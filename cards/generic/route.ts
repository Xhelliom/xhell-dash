/**
 * Handler API pour la route des statistiques génériques
 * 
 * GET /api/apps/[id]/stats/generic
 * Récupère les statistiques depuis l'API externe configurée dans statApiUrl
 */

import { NextRequest, NextResponse } from 'next/server'
import { readApps } from '@/lib/db'
import type { GenericStats } from './types'

/**
 * GET /api/apps/[id]/stats/generic
 * Récupère les statistiques depuis l'API externe configurée dans statApiUrl
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

    // Vérifier que c'est bien une application avec le template générique
    const hasGenericTemplate = app.statsConfig?.templateId === 'generic'
    if (!hasGenericTemplate) {
      return NextResponse.json(
        { error: 'Cette route est réservée aux applications avec le template générique' },
        { status: 400 }
      )
    }

    // Vérifier si une API de stats est configurée
    if (!app.statApiUrl) {
      return NextResponse.json(
        { 
          error: 'Aucune API de statistiques configurée pour cette application',
          hint: 'Veuillez configurer l\'URL de l\'API de statistiques (statApiUrl) dans les paramètres de l\'application.',
        },
        { status: 400 }
      )
    }

    // Faire la requête vers l'API externe
    const response = await fetch(app.statApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Timeout de 10 secondes
      signal: AbortSignal.timeout(10000),
    })
    
    if (!response.ok) {
      throw new Error(`API retourne une erreur: ${response.status} ${response.statusText}`)
    }

    // Récupérer les données (on suppose que l'API retourne du JSON)
    const data: GenericStats = await response.json()
    
    // Configurer le cache côté serveur (Next.js)
    // Revalidation toutes les 5 minutes, mais permet stale-while-revalidate pendant 10 minutes
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des stats génériques:', error)
    
    // Gérer les erreurs de timeout
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Timeout lors de la récupération des statistiques' },
        { status: 504 }
      )
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Impossible de récupérer les statistiques',
        hint: 'Vérifiez que l\'URL de l\'API est correcte et accessible.',
      },
      { status: 500 }
    )
  }
}

