/**
 * Handler API pour la route des statistiques Sonarr
 * 
 * GET /api/apps/[id]/stats/sonarr
 * 
 * Récupère les statistiques depuis l'API Sonarr
 */

import { NextRequest, NextResponse } from 'next/server'
import { readApps } from '@/lib/db'
import type { SonarrStats, SonarrUpcomingEpisode } from './types'

/**
 * GET /api/apps/[id]/stats/sonarr
 * 
 * Récupère les statistiques détaillées depuis l'API Sonarr
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Lire les applications
    const apps = await readApps()
    
    // Trouver l'application
    const app = apps.find((a) => a.id === id)
    
    if (!app) {
      return NextResponse.json(
        { error: 'Application non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier que c'est bien une application avec le bon template
    const hasCorrectTemplate = app.statsConfig?.templateId === 'sonarr'
    if (!hasCorrectTemplate) {
      return NextResponse.json(
        { error: 'Cette route est réservée aux applications avec le template Sonarr' },
        { status: 400 }
      )
    }

    // Récupérer les informations de connexion depuis l'app
    const apiUrl = app.url?.replace(/\/$/, '') || ''
    const apiKey = (app as any).apiKey || (app as any).sonarrApiKey

    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'Clé API non configurée. Veuillez configurer la clé API dans les paramètres de l\'application.',
        },
        { status: 400 }
      )
    }

    if (!apiUrl) {
      return NextResponse.json(
        { 
          error: 'URL non configurée. Veuillez configurer l\'URL du serveur Sonarr dans les paramètres de l\'application.',
        },
        { status: 400 }
      )
    }

    // Récupérer les statistiques depuis l'API Sonarr
    const stats = await fetchSonarrStats(apiUrl, apiKey)

    return NextResponse.json(stats, { status: 200 })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des stats Sonarr:', error)
    
    return NextResponse.json(
      { error: error.message || 'Impossible de récupérer les statistiques Sonarr' },
      { status: 500 }
    )
  }
}

/**
 * Récupère les statistiques depuis l'API Sonarr
 * 
 * @param apiUrl - URL de base de l'API Sonarr
 * @param apiKey - Clé API pour l'authentification
 * @returns Les statistiques formatées
 */
async function fetchSonarrStats(apiUrl: string, apiKey: string): Promise<SonarrStats> {
  const headers = {
    'X-Api-Key': apiKey,
    'Accept': 'application/json',
  }

  // Récupérer les séries
  const seriesResponse = await fetch(`${apiUrl}/api/v3/series`, {
    headers,
    signal: AbortSignal.timeout(10000),
  })

  if (!seriesResponse.ok) {
    throw new Error(`Erreur API Sonarr: ${seriesResponse.status}`)
  }

  const series = await seriesResponse.json()
  const totalSeries = series.length || 0

  // Calculer le total d'épisodes
  let totalEpisodes = 0
  for (const serie of series) {
    if (serie.statistics?.episodeCount) {
      totalEpisodes += serie.statistics.episodeCount
    }
  }

  // Récupérer la queue
  const queueResponse = await fetch(`${apiUrl}/api/v3/queue`, {
    headers,
    signal: AbortSignal.timeout(10000),
  })

  let queuePending = 0
  let queueDownloading = 0
  let queueCompleted = 0
  let queueFailed = 0

  if (queueResponse.ok) {
    const queueData = await queueResponse.json()
    const queueItems = queueData.records || []

    for (const item of queueItems) {
      const status = item.status?.toLowerCase() || ''
      if (status === 'queued' || status === 'paused') {
        queuePending++
      } else if (status === 'downloading') {
        queueDownloading++
      } else if (status === 'completed') {
        queueCompleted++
      } else if (status === 'failed' || status === 'warning') {
        queueFailed++
      }
    }
  }

  // Récupérer le calendrier (prochains épisodes)
  const calendarResponse = await fetch(`${apiUrl}/api/v3/calendar?start=${new Date().toISOString()}&end=${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}`, {
    headers,
    signal: AbortSignal.timeout(10000),
  })

  const upcomingEpisodes: SonarrUpcomingEpisode[] = []
  if (calendarResponse.ok) {
    const calendarData = await calendarResponse.json()
    const episodes = calendarData.slice(0, 10) // Limiter à 10 prochains épisodes

    for (const episode of episodes) {
      upcomingEpisodes.push({
        seriesTitle: episode.series?.title || 'Unknown',
        episodeTitle: episode.title || 'Unknown',
        seasonNumber: episode.seasonNumber || 0,
        episodeNumber: episode.episodeNumber || 0,
        airDate: episode.airDate || '',
        airDateUtc: episode.airDateUtc || '',
      })
    }
  }

  return {
    totalSeries,
    totalEpisodes,
    queuePending,
    queueDownloading,
    queueCompleted,
    queueFailed,
    upcomingEpisodes,
    queueStats: {
      total: queuePending + queueDownloading + queueCompleted + queueFailed,
      pending: queuePending,
      downloading: queueDownloading,
      completed: queueCompleted,
      failed: queueFailed,
    },
  }
}

