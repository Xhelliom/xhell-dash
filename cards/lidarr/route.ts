/**
 * Handler API pour la route des statistiques Lidarr
 * 
 * GET /api/apps/[id]/stats/lidarr
 * 
 * Récupère les statistiques depuis l'API Lidarr
 */

import { NextRequest, NextResponse } from 'next/server'
import { readApps } from '@/lib/db'
import type { LidarrStats } from './types'

/**
 * GET /api/apps/[id]/stats/lidarr
 * 
 * Récupère les statistiques détaillées depuis l'API Lidarr
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
    const hasCorrectTemplate = app.statsConfig?.templateId === 'lidarr'
    if (!hasCorrectTemplate) {
      return NextResponse.json(
        { error: 'Cette route est réservée aux applications avec le template Lidarr' },
        { status: 400 }
      )
    }

    // Récupérer les informations de connexion depuis l'app
    const apiUrl = app.url?.replace(/\/$/, '') || ''
    const apiKey = (app as any).apiKey || (app as any).lidarrApiKey

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
          error: 'URL non configurée. Veuillez configurer l\'URL du serveur Lidarr dans les paramètres de l\'application.',
        },
        { status: 400 }
      )
    }

    // Récupérer les statistiques depuis l'API Lidarr
    const stats = await fetchLidarrStats(apiUrl, apiKey)

    return NextResponse.json(stats, { status: 200 })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des stats Lidarr:', error)
    
    return NextResponse.json(
      { error: error.message || 'Impossible de récupérer les statistiques Lidarr' },
      { status: 500 }
    )
  }
}

/**
 * Récupère les statistiques depuis l'API Lidarr
 * 
 * @param apiUrl - URL de base de l'API Lidarr
 * @param apiKey - Clé API pour l'authentification
 * @returns Les statistiques formatées
 */
async function fetchLidarrStats(apiUrl: string, apiKey: string): Promise<LidarrStats> {
  const headers = {
    'X-Api-Key': apiKey,
    'Accept': 'application/json',
  }

  // Récupérer les artistes
  const artistsResponse = await fetch(`${apiUrl}/api/v1/artist`, {
    headers,
    signal: AbortSignal.timeout(10000),
  })

  if (!artistsResponse.ok) {
    throw new Error(`Erreur API Lidarr: ${artistsResponse.status}`)
  }

  const artists = await artistsResponse.json()
  const totalArtists = artists.length || 0

  // Récupérer les albums
  const albumsResponse = await fetch(`${apiUrl}/api/v1/album`, {
    headers,
    signal: AbortSignal.timeout(10000),
  })

  let totalAlbums = 0
  let downloadedAlbums = 0
  let missingAlbums = 0

  if (albumsResponse.ok) {
    const albums = await albumsResponse.json()
    totalAlbums = albums.length || 0

    for (const album of albums) {
      if (album.statistics?.trackCount > 0 && album.statistics?.sizeOnDisk > 0) {
        downloadedAlbums++
      } else {
        missingAlbums++
      }
    }
  }

  // Récupérer la queue
  const queueResponse = await fetch(`${apiUrl}/api/v1/queue`, {
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
    totalArtists,
    totalAlbums,
    downloadedAlbums,
    missingAlbums,
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

