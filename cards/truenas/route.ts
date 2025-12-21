/**
 * Handler API pour la route des statistiques TrueNAS
 * 
 * GET /api/apps/[id]/stats/truenas
 * 
 * Récupère les statistiques depuis l'API TrueNAS
 */

import { NextRequest, NextResponse } from 'next/server'
import { readApps } from '@/lib/db'
import type { TrueNASStats, TrueNASPool, TrueNASService } from './types'

/**
 * GET /api/apps/[id]/stats/truenas
 * 
 * Récupère les statistiques détaillées depuis l'API TrueNAS
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
    const hasCorrectTemplate = app.statsConfig?.templateId === 'truenas'
    if (!hasCorrectTemplate) {
      return NextResponse.json(
        { error: 'Cette route est réservée aux applications avec le template TrueNAS' },
        { status: 400 }
      )
    }

    // Récupérer les informations de connexion depuis l'app
    const apiUrl = app.url?.replace(/\/$/, '') || ''
    const apiKey = (app as any).apiKey || (app as any).truenasApiKey
    const username = (app as any).username
    const password = (app as any).password

    if (!apiUrl) {
      return NextResponse.json(
        { 
          error: 'URL non configurée. Veuillez configurer l\'URL du serveur TrueNAS dans les paramètres de l\'application.',
        },
        { status: 400 }
      )
    }

    // TrueNAS peut utiliser soit une API key, soit username/password
    if (!apiKey && (!username || !password)) {
      return NextResponse.json(
        { 
          error: 'Authentification non configurée. Veuillez configurer soit une clé API, soit un nom d\'utilisateur et un mot de passe dans les paramètres de l\'application.',
        },
        { status: 400 }
      )
    }

    // Récupérer les statistiques depuis l'API TrueNAS
    const stats = await fetchTrueNASStats(apiUrl, apiKey, username, password)

    return NextResponse.json(stats, { status: 200 })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des stats TrueNAS:', error)
    
    return NextResponse.json(
      { error: error.message || 'Impossible de récupérer les statistiques TrueNAS' },
      { status: 500 }
    )
  }
}

/**
 * Récupère les statistiques depuis l'API TrueNAS
 * 
 * @param apiUrl - URL de base de l'API TrueNAS
 * @param apiKey - Clé API pour l'authentification (optionnel)
 * @param username - Nom d'utilisateur (optionnel)
 * @param password - Mot de passe (optionnel)
 * @returns Les statistiques formatées
 */
async function fetchTrueNASStats(
  apiUrl: string,
  apiKey?: string,
  username?: string,
  password?: string
): Promise<TrueNASStats> {
  // Construire les headers d'authentification
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }

  // Si on a une API key, l'utiliser
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  } else if (username && password) {
    // Sinon, utiliser basic auth
    const credentials = Buffer.from(`${username}:${password}`).toString('base64')
    headers['Authorization'] = `Basic ${credentials}`
  }

  // Récupérer les informations système
  const systemInfoResponse = await fetch(`${apiUrl}/api/v2.0/system/info`, {
    headers,
    signal: AbortSignal.timeout(10000),
  })

  if (!systemInfoResponse.ok) {
    throw new Error(`Erreur API TrueNAS: ${systemInfoResponse.status}`)
  }

  const systemInfo = await systemInfoResponse.json()

  // Récupérer les pools de stockage
  const poolsResponse = await fetch(`${apiUrl}/api/v2.0/pool`, {
    headers,
    signal: AbortSignal.timeout(10000),
  })

  const pools: TrueNASPool[] = []
  let diskTotal = 0
  let diskUsed = 0

  if (poolsResponse.ok) {
    const poolsData = await poolsResponse.json()
    
    for (const pool of poolsData) {
      const size = pool.size?.raw || 0
      const allocated = pool.allocated?.raw || 0
      const free = size - allocated

      pools.push({
        id: pool.id,
        name: pool.name,
        status: pool.status || 'unknown',
        size,
        allocated,
        free,
      })

      diskTotal += size
      diskUsed += allocated
    }
  }

  // Récupérer les services
  const servicesResponse = await fetch(`${apiUrl}/api/v2.0/service`, {
    headers,
    signal: AbortSignal.timeout(10000),
  })

  const services: TrueNASService[] = []
  let activeServices = 0

  if (servicesResponse.ok) {
    const servicesData = await servicesResponse.json()
    
    for (const service of servicesData) {
      services.push({
        id: service.id,
        service: service.service || 'unknown',
        state: service.state || 'unknown',
        enable: service.enable || false,
      })

      if (service.state === 'RUNNING') {
        activeServices++
      }
    }
  }

  // Récupérer les métriques en temps réel (CPU, mémoire)
  let cpuUsage = 0
  let memoryUsage = 0
  let memoryTotal = 0
  let memoryUsed = 0

  try {
    const realtimeResponse = await fetch(`${apiUrl}/api/v2.0/reporting/realtime`, {
      headers,
      signal: AbortSignal.timeout(10000),
    })

    if (realtimeResponse.ok) {
      const realtimeData = await realtimeResponse.json()
      
      // Les données sont dans un format spécifique TrueNAS
      if (realtimeData.cpu) {
        cpuUsage = realtimeData.cpu.usage || 0
      }
      
      if (realtimeData.memory) {
        memoryTotal = realtimeData.memory.total || 0
        memoryUsed = realtimeData.memory.used || 0
        memoryUsage = memoryTotal > 0 ? (memoryUsed / memoryTotal) * 100 : 0
      }
    }
  } catch (error) {
    console.warn('Impossible de récupérer les métriques en temps réel:', error)
  }

  return {
    cpuUsage,
    memoryUsage,
    memoryTotal,
    memoryUsed,
    diskTotal,
    diskUsed,
    activePools: pools.length,
    activeServices,
    pools,
    services,
  }
}

