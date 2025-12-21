/**
 * Handler API pour la route des statistiques Uptime Kuma
 * 
 * GET /api/apps/[id]/stats/uptime-kuma
 * 
 * Récupère les statistiques depuis l'API Uptime Kuma
 */

import { NextRequest, NextResponse } from 'next/server'
import { readApps } from '@/lib/db'
import type { UptimeKumaStats, UptimeKumaMonitor } from './types'

/**
 * GET /api/apps/[id]/stats/uptime-kuma
 * 
 * Récupère les statistiques détaillées depuis l'API Uptime Kuma
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
    const hasCorrectTemplate = app.statsConfig?.templateId === 'uptime-kuma'
    if (!hasCorrectTemplate) {
      return NextResponse.json(
        { error: 'Cette route est réservée aux applications avec le template Uptime Kuma' },
        { status: 400 }
      )
    }

    // Récupérer les informations de connexion depuis l'app
    const apiUrl = app.url?.replace(/\/$/, '') || ''
    const apiKey = (app as any).apiKey || (app as any).uptimeKumaApiKey
    const username = (app as any).username
    const password = (app as any).password

    if (!apiUrl) {
      return NextResponse.json(
        { 
          error: 'URL non configurée. Veuillez configurer l\'URL du serveur Uptime Kuma dans les paramètres de l\'application.',
        },
        { status: 400 }
      )
    }

    // Uptime Kuma peut utiliser soit une API key, soit username/password
    if (!apiKey && (!username || !password)) {
      return NextResponse.json(
        { 
          error: 'Authentification non configurée. Veuillez configurer soit une clé API, soit un nom d\'utilisateur et un mot de passe dans les paramètres de l\'application.',
        },
        { status: 400 }
      )
    }

    // Récupérer les statistiques depuis l'API Uptime Kuma
    const stats = await fetchUptimeKumaStats(apiUrl, apiKey, username, password)

    return NextResponse.json(stats, { status: 200 })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des stats Uptime Kuma:', error)
    
    return NextResponse.json(
      { error: error.message || 'Impossible de récupérer les statistiques Uptime Kuma' },
      { status: 500 }
    )
  }
}

/**
 * Récupère les statistiques depuis l'API Uptime Kuma
 * 
 * @param apiUrl - URL de base de l'API Uptime Kuma
 * @param apiKey - Clé API pour l'authentification (optionnel)
 * @param username - Nom d'utilisateur (optionnel)
 * @param password - Mot de passe (optionnel)
 * @returns Les statistiques formatées
 */
async function fetchUptimeKumaStats(
  apiUrl: string,
  apiKey?: string,
  username?: string,
  password?: string
): Promise<UptimeKumaStats> {
  // Construire les headers d'authentification
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }

  // Si on a une API key, l'utiliser
  if (apiKey) {
    headers['X-Api-Key'] = apiKey
  } else if (username && password) {
    // Sinon, utiliser basic auth
    const credentials = Buffer.from(`${username}:${password}`).toString('base64')
    headers['Authorization'] = `Basic ${credentials}`
  }

  // Récupérer les monitors
  const monitorsResponse = await fetch(`${apiUrl}/api/monitors`, {
    headers,
    signal: AbortSignal.timeout(10000),
  })

  if (!monitorsResponse.ok) {
    throw new Error(`Erreur API Uptime Kuma: ${monitorsResponse.status}`)
  }

  const monitorsData = await monitorsResponse.json()
  const monitors: UptimeKumaMonitor[] = monitorsData || []
  const totalMonitors = monitors.length

  // Compter les monitors actifs/inactifs
  let activeMonitors = 0
  let downMonitors = 0
  let totalUptime24h = 0
  let totalUptime7d = 0
  let totalUptime30d = 0
  let totalResponseTime = 0
  let responseTimeCount = 0
  let certificatesExpiring = 0

  // Récupérer les statistiques détaillées pour chaque monitor
  for (const monitor of monitors) {
    // Déterminer le statut
    const status = monitor.status || 'unknown'
    if (status === 'up') {
      activeMonitors++
    } else if (status === 'down') {
      downMonitors++
    }

    // Récupérer les statistiques d'uptime si disponibles
    try {
      const heartbeatResponse = await fetch(`${apiUrl}/api/status-page/heartbeat/${monitor.id}`, {
        headers,
        signal: AbortSignal.timeout(5000),
      })

      if (heartbeatResponse.ok) {
        const heartbeatData = await heartbeatResponse.json()
        const uptimeList = heartbeatData.uptimeList || {}
        
        // Extraire les uptimes
        const uptime24h = uptimeList['24'] || uptimeList['1_24'] || 0
        const uptime7d = uptimeList['720'] || uptimeList['7_720'] || 0
        const uptime30d = uptimeList['8640'] || uptimeList['30_8640'] || 0

        monitor.uptime24h = uptime24h * 100 // Convertir en pourcentage
        monitor.uptime7d = uptime7d * 100
        monitor.uptime30d = uptime30d * 100

        totalUptime24h += monitor.uptime24h
        totalUptime7d += monitor.uptime7d
        totalUptime30d += monitor.uptime30d
      }
    } catch (error) {
      console.warn(`Impossible de récupérer les heartbeats pour le monitor ${monitor.id}:`, error)
    }

    // Récupérer le temps de réponse moyen
    if (monitor.responseTime !== undefined && monitor.responseTime > 0) {
      totalResponseTime += monitor.responseTime
      responseTimeCount++
    }

    // Vérifier les certificats SSL
    if (monitor.certExpiry !== undefined && monitor.certExpiry > 0) {
      const daysUntilExpiry = Math.floor((monitor.certExpiry - Date.now()) / (1000 * 60 * 60 * 24))
      if (daysUntilExpiry > 0 && daysUntilExpiry < 30) {
        certificatesExpiring++
      }
    }
  }

  // Calculer les moyennes
  const averageUptime24h = totalMonitors > 0 ? totalUptime24h / totalMonitors : 0
  const averageUptime7d = totalMonitors > 0 ? totalUptime7d / totalMonitors : 0
  const averageUptime30d = totalMonitors > 0 ? totalUptime30d / totalMonitors : 0
  const averageResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0

  return {
    totalMonitors,
    activeMonitors,
    downMonitors,
    averageUptime24h,
    averageUptime7d,
    averageUptime30d,
    averageResponseTime,
    certificatesExpiring,
    monitors: monitors.slice(0, 20), // Limiter à 20 monitors pour la réponse
  }
}

