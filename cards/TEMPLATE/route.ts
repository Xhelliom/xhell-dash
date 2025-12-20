/**
 * Handler API pour la route des statistiques de votre carte
 * 
 * GET /api/apps/[id]/stats/template
 * 
 * Remplacez "template" par l'ID de votre carte (ex: "sonarr", "radarr")
 * 
 * Ce fichier gère la récupération des statistiques depuis l'API externe
 * et retourne les données au format attendu par le panneau de stats
 */

import { NextRequest, NextResponse } from 'next/server'
import { readApps } from '@/lib/db'
import type { TemplateStats } from './types'

/**
 * GET /api/apps/[id]/stats/template
 * 
 * Récupère les statistiques détaillées depuis l'API externe
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
    const hasCorrectTemplate = app.statsConfig?.templateId === 'template'
    if (!hasCorrectTemplate) {
      return NextResponse.json(
        { error: 'Cette route est réservée aux applications avec le template correspondant' },
        { status: 400 }
      )
    }

    // Récupérer les informations de connexion depuis l'app
    // Adaptez selon votre API (token, clé API, URL, etc.)
    const apiUrl = app.url // ou un champ spécifique comme app.apiUrl
    const apiKey = (app as any).apiKey // ou un champ spécifique selon votre configuration

    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'Clé API non configurée. Veuillez configurer la clé API dans les paramètres de l\'application.',
        },
        { status: 400 }
      )
    }

    // Récupérer les statistiques depuis l'API externe
    const stats = await fetchTemplateStats(apiUrl, apiKey)

    return NextResponse.json(stats, { status: 200 })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des stats:', error)
    
    return NextResponse.json(
      { error: error.message || 'Impossible de récupérer les statistiques' },
      { status: 500 }
    )
  }
}

/**
 * Récupère les statistiques depuis l'API externe
 * 
 * Adaptez cette fonction selon l'API que vous utilisez
 * 
 * @param apiUrl - URL de base de l'API
 * @param apiKey - Clé API pour l'authentification
 * @returns Les statistiques formatées
 */
async function fetchTemplateStats(apiUrl: string, apiKey: string): Promise<TemplateStats> {
  const headers = {
    'X-Api-Key': apiKey, // Adaptez selon votre API
    'Accept': 'application/json',
  }

  // Exemple : récupérer les statistiques depuis l'API
  // Adaptez les endpoints selon votre API
  const response = await fetch(`${apiUrl}/api/v1/stats`, {
    headers,
    signal: AbortSignal.timeout(10000),
  })

  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status}`)
  }

  const data = await response.json()

  // Transformer les données de l'API au format attendu
  // Adaptez selon la structure de votre API
  return {
    totalItems: data.totalItems || 0,
    pendingItems: data.pendingItems || 0,
    recentItems: data.recentItems || [],
  }
}

