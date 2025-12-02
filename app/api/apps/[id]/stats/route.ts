/**
 * API Route pour récupérer les statistiques d'une application
 * 
 * GET /api/apps/[id]/stats
 * Récupère les stats depuis l'API externe configurée dans statApiUrl
 * 
 * Si l'application est de type Plex, redirige vers le handler spécialisé /stats/plex
 */

import { NextRequest, NextResponse } from 'next/server'
import { readApps } from '@/lib/db'

/**
 * GET /api/apps/[id]/stats
 * Récupère les statistiques depuis l'API externe
 * 
 * Pour Plex, redirige automatiquement vers /stats/plex pour obtenir des statistiques détaillées
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

    // Si c'est Plex et qu'on demande des stats détaillées (paramètre ?detailed=true)
    // ou si le nom est exactement "plex", on redirige vers le handler spécialisé
    const searchParams = request.nextUrl.searchParams
    const detailed = searchParams.get('detailed') === 'true'
    
    if (app.name.toLowerCase() === 'plex' && detailed) {
      // Rediriger vers le handler Plex spécialisé
      const plexResponse = await fetch(`${request.nextUrl.origin}/api/apps/${id}/stats/plex`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (plexResponse.ok) {
        const plexData = await plexResponse.json()
        return NextResponse.json(plexData, { status: 200 })
      }
    }
    
    // Comportement par défaut : API générique
    // Vérifier si une API de stats est configurée
    if (!app.statApiUrl) {
      return NextResponse.json(
        { error: 'Aucune API de statistiques configurée pour cette application' },
        { status: 400 }
      )
    }
    
    // Faire la requête vers l'API externe
    // Note : En production, vous pourriez vouloir ajouter un timeout et une gestion d'erreur plus robuste
    const response = await fetch(app.statApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Timeout de 5 secondes
      signal: AbortSignal.timeout(5000),
    })
    
    if (!response.ok) {
      throw new Error(`API retourne une erreur: ${response.status}`)
    }
    
    // Récupérer les données (on suppose que l'API retourne du JSON)
    const data = await response.json()
    
    // Retourner les données
    // Note : Vous pourriez vouloir transformer les données selon le format attendu
    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des stats:', error)
    
    // Gérer les erreurs de timeout
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Timeout lors de la récupération des statistiques' },
        { status: 504 }
      )
    }
    
    return NextResponse.json(
      { error: 'Impossible de récupérer les statistiques' },
      { status: 500 }
    )
  }
}

