/**
 * Handler API pour la route des statistiques Home Assistant
 * 
 * GET /api/apps/[id]/stats/home-assistant
 * 
 * Récupère les statistiques depuis l'API Home Assistant
 */

import { NextRequest, NextResponse } from 'next/server'
import { readApps } from '@/lib/db'
import type { HomeAssistantStats, HomeAssistantRecentChange, HomeAssistantDomainStat } from './types'

/**
 * GET /api/apps/[id]/stats/home-assistant
 * 
 * Récupère les statistiques détaillées depuis l'API Home Assistant
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
    const hasCorrectTemplate = app.statsConfig?.templateId === 'home-assistant'
    if (!hasCorrectTemplate) {
      return NextResponse.json(
        { error: 'Cette route est réservée aux applications avec le template Home Assistant' },
        { status: 400 }
      )
    }

    // Récupérer les informations de connexion depuis l'app
    const apiUrl = app.url?.replace(/\/$/, '') || ''
    const apiKey = (app as any).apiKey || (app as any).homeAssistantApiKey

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
          error: 'URL non configurée. Veuillez configurer l\'URL du serveur Home Assistant dans les paramètres de l\'application.',
        },
        { status: 400 }
      )
    }

    // Récupérer les statistiques depuis l'API Home Assistant
    const stats = await fetchHomeAssistantStats(apiUrl, apiKey)

    return NextResponse.json(stats, { status: 200 })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des stats Home Assistant:', error)
    
    return NextResponse.json(
      { error: error.message || 'Impossible de récupérer les statistiques Home Assistant' },
      { status: 500 }
    )
  }
}

/**
 * Récupère les statistiques depuis l'API Home Assistant
 * 
 * @param apiUrl - URL de base de l'API Home Assistant
 * @param apiKey - Token API pour l'authentification
 * @returns Les statistiques formatées
 */
async function fetchHomeAssistantStats(apiUrl: string, apiKey: string): Promise<HomeAssistantStats> {
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }

  // Récupérer tous les états
  const statesResponse = await fetch(`${apiUrl}/api/states`, {
    headers,
    signal: AbortSignal.timeout(10000),
  })

  if (!statesResponse.ok) {
    throw new Error(`Erreur API Home Assistant: ${statesResponse.status}`)
  }

  const states = await statesResponse.json()
  const totalEntities = states.length || 0

  // Compter les entités actives/inactives
  let activeEntities = 0
  let inactiveEntities = 0
  const domainStatsMap = new Map<string, { count: number; active: number }>()

  // Récupérer les changements récents (dernières 24h)
  const recentChanges: HomeAssistantRecentChange[] = []
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  for (const state of states) {
    const domain = state.entity_id.split('.')[0]
    
    // Compter par domaine
    if (!domainStatsMap.has(domain)) {
      domainStatsMap.set(domain, { count: 0, active: 0 })
    }
    
    const domainStat = domainStatsMap.get(domain)!
    domainStat.count++
    
    // Vérifier si l'entité est active
    const isActive = state.state !== 'unavailable' && state.state !== 'unknown'
    if (isActive) {
      activeEntities++
      domainStat.active++
    } else {
      inactiveEntities++
    }

    // Récupérer les changements récents
    const lastChanged = new Date(state.last_changed || state.last_updated)
    if (lastChanged > oneDayAgo) {
      recentChanges.push({
        entityId: state.entity_id,
        state: state.state,
        lastChanged: state.last_changed || state.last_updated,
        friendlyName: state.attributes?.friendly_name,
      })
    }
  }

  // Trier les changements récents par date (plus récent en premier)
  recentChanges.sort((a, b) => new Date(b.lastChanged).getTime() - new Date(a.lastChanged).getTime())
  const topRecentChanges = recentChanges.slice(0, 10)

  // Convertir la map en array
  const domainStats: HomeAssistantDomainStat[] = Array.from(domainStatsMap.entries()).map(([domain, stats]) => ({
    domain,
    count: stats.count,
    active: stats.active,
  }))

  // Récupérer le nombre d'automatisations (approximation basée sur les entités automation.*)
  const automationsActive = domainStats.find(d => d.domain === 'automation')?.active || 0

  return {
    totalEntities,
    activeEntities,
    inactiveEntities,
    automationsActive,
    recentChanges: topRecentChanges,
    domainStats: domainStats.sort((a, b) => b.count - a.count).slice(0, 10), // Top 10 domaines
  }
}

