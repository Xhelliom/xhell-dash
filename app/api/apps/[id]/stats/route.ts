/**
 * API Route pour récupérer les statistiques d'une application
 * 
 * GET /api/apps/[id]/stats
 * Récupère les stats depuis l'API externe configurée dans statApiUrl
 * 
 * Si l'application a un template de stats configuré, redirige vers le handler spécialisé correspondant
 */

import { NextRequest, NextResponse } from 'next/server'
import { readApps } from '@/lib/db'

/**
 * GET /api/apps/[id]/stats
 * Récupère les statistiques depuis l'API externe
 * 
 * Si l'app a un template de stats (ex: plex, sonarr), redirige automatiquement vers le handler spécialisé
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

    // Si l'app a un template de stats configuré et qu'on demande des stats détaillées
    // on redirige vers le handler spécialisé correspondant
    const searchParams = request.nextUrl.searchParams
    const detailed = searchParams.get('detailed') === 'true'
    const templateId = app.statsConfig?.templateId
    
    if (templateId && detailed) {
      // Rediriger vers le handler spécialisé selon le templateId
      const statsResponse = await fetch(`${request.nextUrl.origin}/api/apps/${id}/stats/${templateId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        return NextResponse.json(statsData, { status: 200 })
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

