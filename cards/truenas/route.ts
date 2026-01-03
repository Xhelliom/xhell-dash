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
    
    // Gérer le cas où poolsData est un tableau ou un objet avec une propriété data
    const poolsArray = Array.isArray(poolsData) ? poolsData : (poolsData.data || [])
    
    for (const pool of poolsArray) {
      // Les données de taille et d'allocation sont dans pool.topology.data[0].stats
      // TrueNAS stocke les informations dans la structure topology
      let size = 0
      let allocated = 0

      // Extraire les données depuis topology.data[0].stats
      if (pool.topology && pool.topology.data && pool.topology.data.length > 0) {
        const dataVdev = pool.topology.data[0]
        if (dataVdev.stats) {
          size = dataVdev.stats.size || 0
          allocated = dataVdev.stats.allocated || 0
        }
      }

      // Si les données ne sont pas dans topology, essayer d'autres emplacements
      // (pour compatibilité avec différentes versions de l'API)
      if (size === 0 && allocated === 0) {
        // Format alternatif 1: pool.size.raw et pool.allocated.raw
        if (pool.size) {
          if (typeof pool.size === 'object' && pool.size.raw !== undefined) {
            size = typeof pool.size.raw === 'number' ? pool.size.raw : parseInt(pool.size.raw, 10) || 0
          } else if (typeof pool.size === 'number') {
            size = pool.size
          }
        }
        
        if (pool.allocated) {
          if (typeof pool.allocated === 'object' && pool.allocated.raw !== undefined) {
            allocated = typeof pool.allocated.raw === 'number' ? pool.allocated.raw : parseInt(pool.allocated.raw, 10) || 0
          } else if (typeof pool.allocated === 'number') {
            allocated = pool.allocated
          }
        }
      }

      // Calculer l'espace libre
      const free = size - allocated

      // Ne traiter que les pools valides (avec une taille > 0)
      if (size > 0) {
        pools.push({
          id: pool.id,
          name: pool.name || 'Unknown',
          status: pool.status || 'unknown',
          size,
          allocated,
          free,
        })

        diskTotal += size
        diskUsed += allocated
      }
    }
  } else {
    // Si l'endpoint /pool ne fonctionne pas, logger l'erreur
    console.error(`[TrueNAS] Erreur lors de la récupération des pools: ${poolsResponse.status}`)
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

  // Récupérer les métriques CPU et mémoire
  // Pour TrueNAS 13.0, les endpoints de reporting (/reporting/realtime, /reporting/get_data) 
  // ne sont pas disponibles via l'API REST
  // Utilisons les données disponibles dans system/info
  
  let cpuUsage = 0
  let memoryUsage = 0
  let memoryTotal = systemInfo.physmem || 0 // Mémoire physique totale depuis system/info
  let memoryUsed = 0

  // Pour l'utilisation CPU, utiliser loadavg comme approximation
  // loadavg[0] = charge moyenne sur 1 minute
  // Pour convertir en pourcentage approximatif : (loadavg / cores) * 100
  if (systemInfo.loadavg && Array.isArray(systemInfo.loadavg) && systemInfo.loadavg.length > 0) {
    const load1m = systemInfo.loadavg[0]
    const cores = systemInfo.cores || 4
    // Load average représente la charge moyenne sur les cores
    // Une charge de 1.0 = 100% d'utilisation d'un core
    // Pour obtenir un pourcentage, on fait (load / cores) * 100, limité à 100%
    cpuUsage = Math.min((load1m / cores) * 100, 100)
  }

  // Pour la mémoire utilisée, system/info ne fournit que physmem (total)
  // L'API REST de TrueNAS 13.0 ne fournit pas l'utilisation de la mémoire
  // Les endpoints de reporting nécessitent WebSocket/JSON-RPC qui ne sont pas supportés ici
  // On laisse memoryUsed et memoryUsage à 0
  // Note: Pour obtenir l'utilisation de la mémoire, il faudrait utiliser l'API WebSocket/JSON-RPC
  // ou mettre à jour vers une version plus récente de TrueNAS qui expose ces données via REST

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

