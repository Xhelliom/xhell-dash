/**
 * Handler API pour la route des statistiques Overseerr
 * 
 * GET /api/apps/[id]/stats/overseerr
 * 
 * Récupère les statistiques depuis l'API Overseerr
 */

import { NextRequest, NextResponse } from 'next/server'
import { readApps } from '@/lib/db'
import type { OverseerrStats } from './types'

/**
 * GET /api/apps/[id]/stats/overseerr
 * 
 * Récupère les statistiques détaillées depuis l'API Overseerr
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
    const hasCorrectTemplate = app.statsConfig?.templateId === 'overseerr'
    if (!hasCorrectTemplate) {
      return NextResponse.json(
        { error: 'Cette route est réservée aux applications avec le template Overseerr' },
        { status: 400 }
      )
    }

    // Récupérer les informations de connexion depuis l'app
    const apiUrl = app.url?.replace(/\/$/, '') || ''
    const apiKey = (app as any).apiKey || (app as any).overseerrApiKey

    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'Token API non configuré. Veuillez configurer le token API dans les paramètres de l\'application.',
        },
        { status: 400 }
      )
    }

    if (!apiUrl) {
      return NextResponse.json(
        { 
          error: 'URL non configurée. Veuillez configurer l\'URL du serveur Overseerr dans les paramètres de l\'application.',
        },
        { status: 400 }
      )
    }

    // Récupérer les statistiques depuis l'API Overseerr
    const stats = await fetchOverseerrStats(apiUrl, apiKey)

    return NextResponse.json(stats, { status: 200 })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des stats Overseerr:', error)
    
    return NextResponse.json(
      { error: error.message || 'Impossible de récupérer les statistiques Overseerr' },
      { status: 500 }
    )
  }
}

/**
 * Récupère les statistiques depuis l'API Overseerr
 * 
 * @param apiUrl - URL de base de l'API Overseerr
 * @param apiKey - Token API pour l'authentification
 * @returns Les statistiques formatées
 */
async function fetchOverseerrStats(apiUrl: string, apiKey: string): Promise<OverseerrStats> {
  const headers = {
    'X-Api-Key': apiKey,
    'Accept': 'application/json',
  }

  // Récupérer les compteurs de demandes
  const requestCountResponse = await fetch(`${apiUrl}/api/v1/request/count`, {
    headers,
    signal: AbortSignal.timeout(10000),
  })

  let totalRequests = 0
  let pendingRequests = 0
  let approvedRequests = 0
  let declinedRequests = 0
  let processingRequests = 0
  let availableMedia = 0

  if (requestCountResponse.ok) {
    const requestCountData = await requestCountResponse.json()
    totalRequests = requestCountData.total || 0
    pendingRequests = requestCountData.pending || 0
    approvedRequests = requestCountData.approved || 0
    declinedRequests = requestCountData.declined || 0
    processingRequests = requestCountData.processing || 0
    availableMedia = requestCountData.available || 0
  }

  // Récupérer les statistiques du serveur
  const aboutResponse = await fetch(`${apiUrl}/api/v1/settings/about`, {
    headers,
    signal: AbortSignal.timeout(10000),
  })

  let totalMovies = 0
  let totalTvShows = 0
  let totalUsers = 0

  if (aboutResponse.ok) {
    const aboutData = await aboutResponse.json()
    // Les statistiques peuvent être dans différents champs selon la version
    totalMovies = aboutData.totalMovies || 0
    totalTvShows = aboutData.totalTvShows || 0
    totalUsers = aboutData.totalUsers || 0
  }

  // Récupérer les médias pour compter films vs séries
  try {
    const mediaResponse = await fetch(`${apiUrl}/api/v1/media?take=1`, {
      headers,
      signal: AbortSignal.timeout(10000),
    })

    if (mediaResponse.ok) {
      const mediaData = await mediaResponse.json()
      // Compter les films et séries depuis les résultats
      // Note: L'API Overseerr peut nécessiter plusieurs requêtes pour obtenir le total
      // Pour simplifier, on utilise les données de /settings/about si disponibles
    }
  } catch (error) {
    console.warn('Impossible de récupérer les médias:', error)
  }

  return {
    totalRequests,
    pendingRequests,
    approvedRequests,
    declinedRequests,
    processingRequests,
    availableMedia,
    totalMovies,
    totalTvShows,
    totalUsers,
    requestStats: {
      total: totalRequests,
      pending: pendingRequests,
      approved: approvedRequests,
      declined: declinedRequests,
      processing: processingRequests,
      available: availableMedia,
    },
  }
}

