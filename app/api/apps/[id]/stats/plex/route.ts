/**
 * API Route pour récupérer les statistiques détaillées de Plex
 * 
 * GET /api/apps/[id]/stats/plex
 * Récupère les KPI et les derniers médias ajoutés depuis l'API Plex
 */

import { NextRequest, NextResponse } from 'next/server'
import { readApps } from '@/lib/db'
import type { PlexStats, PlexRecentMedia, PlexLibraryStat } from '@/lib/types'

/**
 * GET /api/apps/[id]/stats/plex
 * Récupère les statistiques détaillées depuis l'API Plex
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

    // Vérifier que c'est bien une application avec le template Plex
    const isPlexApp = app.name.toLowerCase() === 'plex' || app.statsConfig?.templateId === 'plex'
    if (!isPlexApp) {
      return NextResponse.json(
        { error: 'Cette route est réservée aux applications avec le template Plex' },
        { status: 400 }
      )
    }

    // Récupérer le token Plex et l'URL du serveur
    // Le token peut être dans le champ plexToken ou extrait de statApiUrl (pour compatibilité)
    const plexServerUrl = (app as any).plexServerUrl || app.url.replace(/\/$/, '')
    const plexToken = (app as any).plexToken || extractTokenFromUrl(app.statApiUrl || '')

    if (!plexToken) {
      return NextResponse.json(
        { 
          error: 'Token Plex non configuré. Veuillez configurer le token Plex dans les paramètres de l\'application.',
          hint: 'Le token Plex est nécessaire pour accéder à l\'API Plex. Vous pouvez le trouver dans les paramètres de votre serveur Plex.'
        },
        { status: 400 }
      )
    }

    // Construire l'URL de base de l'API Plex
    // Si l'URL ne contient pas de port, on ajoute le port par défaut 32400
    let baseUrl = plexServerUrl
    if (!baseUrl.includes(':32400') && !baseUrl.match(/:\d+/)) {
      baseUrl = `${baseUrl}:32400`
    }
    baseUrl = baseUrl.replace(/\/$/, '')

    // Récupérer les statistiques depuis l'API Plex
    const stats = await fetchPlexStats(baseUrl, plexToken)

    return NextResponse.json(stats, { status: 200 })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des stats Plex:', error)
    
    return NextResponse.json(
      { error: error.message || 'Impossible de récupérer les statistiques Plex' },
      { status: 500 }
    )
  }
}

/**
 * Extrait le token Plex depuis une URL si elle contient le token en paramètre
 */
function extractTokenFromUrl(url: string): string | null {
  if (!url) return null
  try {
    const urlObj = new URL(url)
    return urlObj.searchParams.get('X-Plex-Token') || null
  } catch {
    return null
  }
}

/**
 * Récupère les statistiques depuis l'API Plex
 */
async function fetchPlexStats(baseUrl: string, token: string): Promise<PlexStats> {
  const headers = {
    'X-Plex-Token': token,
    'Accept': 'application/json',
  }

  // Récupérer les bibliothèques
  const librariesResponse = await fetch(`${baseUrl}/library/sections`, {
    headers,
    signal: AbortSignal.timeout(10000),
  })

  if (!librariesResponse.ok) {
    throw new Error(`Erreur API Plex: ${librariesResponse.status}`)
  }

  const librariesData = await librariesResponse.json()
  const libraries = librariesData.MediaContainer?.Directory || []

  // Calculer les statistiques par type de bibliothèque
  const libraryStats: PlexLibraryStat[] = []
  let totalMovies = 0
  let totalShows = 0
  let totalEpisodes = 0

  // Récupérer les statistiques pour chaque bibliothèque
  for (const library of libraries) {
    const libraryType = library.type
    const libraryName = library.title
    let count = 0

    // Récupérer le nombre d'éléments dans la bibliothèque
    try {
      const libraryDetailsResponse = await fetch(
        `${baseUrl}/library/sections/${library.key}/all`,
        { headers, signal: AbortSignal.timeout(5000) }
      )
      
      if (libraryDetailsResponse.ok) {
        const libraryDetails = await libraryDetailsResponse.json()
        count = libraryDetails.MediaContainer?.totalSize || 0
      }
    } catch (error) {
      console.warn(`Impossible de récupérer les détails de la bibliothèque ${libraryName}:`, error)
    }

    libraryStats.push({
      name: libraryName,
      type: libraryType as 'movie' | 'show' | 'music' | 'photo',
      count,
    })

    // Compter par type
    if (libraryType === 'movie') {
      totalMovies += count
    } else if (libraryType === 'show') {
      totalShows += count
      // Pour les séries, on doit aussi compter les épisodes
      // On peut faire une requête supplémentaire ou estimer
    }
  }

  // Récupérer les derniers médias ajoutés
  // On utilise l'endpoint /library/recentlyAdded
  const recentMedia: PlexRecentMedia[] = []
  
  try {
    const recentlyAddedResponse = await fetch(
      `${baseUrl}/library/recentlyAdded?X-Plex-Container-Start=0&X-Plex-Container-Size=20`,
      { headers, signal: AbortSignal.timeout(10000) }
    )

    if (recentlyAddedResponse.ok) {
      const recentlyAddedData = await recentlyAddedResponse.json()
      const items = recentlyAddedData.MediaContainer?.Metadata || []

      for (const item of items) {
        const mediaType = item.type === 'movie' ? 'movie' : 'episode'
        const libraryTitle = item.librarySectionTitle || 'Unknown'
        
        recentMedia.push({
          title: item.title || (item.grandparentTitle && item.grandparentTitle !== item.title 
            ? `${item.grandparentTitle} - ${item.title}` 
            : item.title) || 'Unknown',
          type: mediaType,
          library: libraryTitle,
          addedAt: item.addedAt ? new Date(item.addedAt * 1000).toISOString() : new Date().toISOString(),
          year: item.year,
          thumb: item.thumb ? `${baseUrl}${item.thumb}?X-Plex-Token=${token}` : undefined,
          ratingKey: item.ratingKey?.toString() || '',
        })
      }
    }
  } catch (error) {
    console.warn('Impossible de récupérer les derniers médias ajoutés:', error)
  }

  // Récupérer le nombre d'utilisateurs (nécessite un appel à /accounts)
  let totalUsers = 0
  try {
    const accountsResponse = await fetch(`${baseUrl}/accounts`, {
      headers,
      signal: AbortSignal.timeout(5000),
    })
    
    if (accountsResponse.ok) {
      const accountsData = await accountsResponse.json()
      totalUsers = accountsData.MediaContainer?.Account?.length || 0
    }
  } catch (error) {
    console.warn('Impossible de récupérer le nombre d\'utilisateurs:', error)
  }

  // Pour les épisodes, on peut estimer ou faire une requête supplémentaire
  // Pour l'instant, on laisse à 0 et on peut l'améliorer plus tard
  if (totalShows > 0) {
    // Estimation basique : environ 10 épisodes par série en moyenne
    // Ce n'est pas précis mais donne une idée
    totalEpisodes = totalShows * 10
  }

  return {
    totalMovies,
    totalShows,
    totalEpisodes,
    totalUsers,
    totalLibraries: libraries.length,
    recentMedia,
    libraryStats,
  }
}

