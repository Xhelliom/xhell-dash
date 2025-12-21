/**
 * Handler API pour la route des statistiques Radarr
 * 
 * GET /api/apps/[id]/stats/radarr
 * 
 * Récupère les statistiques depuis l'API Radarr
 */

import { NextRequest, NextResponse } from 'next/server'
import { readApps } from '@/lib/db'
import type { RadarrStats } from './types'

/**
 * GET /api/apps/[id]/stats/radarr
 * 
 * Récupère les statistiques détaillées depuis l'API Radarr
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
    const hasCorrectTemplate = app.statsConfig?.templateId === 'radarr'
    if (!hasCorrectTemplate) {
      return NextResponse.json(
        { error: 'Cette route est réservée aux applications avec le template Radarr' },
        { status: 400 }
      )
    }

    // Récupérer les informations de connexion depuis l'app
    const apiUrl = app.url?.replace(/\/$/, '') || ''
    const apiKey = (app as any).apiKey || (app as any).radarrApiKey

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
          error: 'URL non configurée. Veuillez configurer l\'URL du serveur Radarr dans les paramètres de l\'application.',
        },
        { status: 400 }
      )
    }

    // Récupérer les statistiques depuis l'API Radarr
    const stats = await fetchRadarrStats(apiUrl, apiKey)

    return NextResponse.json(stats, { status: 200 })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des stats Radarr:', error)
    
    return NextResponse.json(
      { error: error.message || 'Impossible de récupérer les statistiques Radarr' },
      { status: 500 }
    )
  }
}

/**
 * Récupère les statistiques depuis l'API Radarr
 * 
 * @param apiUrl - URL de base de l'API Radarr
 * @param apiKey - Clé API pour l'authentification
 * @returns Les statistiques formatées
 */
async function fetchRadarrStats(apiUrl: string, apiKey: string): Promise<RadarrStats> {
  const headers = {
    'X-Api-Key': apiKey,
    'Accept': 'application/json',
  }

  // Récupérer les films
  const moviesResponse = await fetch(`${apiUrl}/api/v3/movie`, {
    headers,
    signal: AbortSignal.timeout(10000),
  })

  if (!moviesResponse.ok) {
    throw new Error(`Erreur API Radarr: ${moviesResponse.status}`)
  }

  const movies = await moviesResponse.json()
  const totalMovies = movies.length || 0

  // Compter les films téléchargés et manquants
  let downloadedMovies = 0
  let missingMovies = 0

  for (const movie of movies) {
    if (movie.hasFile) {
      downloadedMovies++
    } else {
      missingMovies++
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

  return {
    totalMovies,
    downloadedMovies,
    missingMovies,
    queuePending,
    queueDownloading,
    queueCompleted,
    queueFailed,
    queueStats: {
      total: queuePending + queueDownloading + queueCompleted + queueFailed,
      pending: queuePending,
      downloading: queueDownloading,
      completed: queueCompleted,
      failed: queueFailed,
    },
  }
}

