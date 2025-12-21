/**
 * Handler API pour la route des statistiques Proxmox
 * 
 * GET /api/apps/[id]/stats/proxmox
 * 
 * Récupère les statistiques depuis l'API Proxmox
 */

import { NextRequest, NextResponse } from 'next/server'
import { readApps } from '@/lib/db'
import type { ProxmoxStats, ProxmoxNode } from './types'

/**
 * GET /api/apps/[id]/stats/proxmox
 * 
 * Récupère les statistiques détaillées depuis l'API Proxmox
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
    const hasCorrectTemplate = app.statsConfig?.templateId === 'proxmox'
    if (!hasCorrectTemplate) {
      return NextResponse.json(
        { error: 'Cette route est réservée aux applications avec le template Proxmox' },
        { status: 400 }
      )
    }

    // Récupérer les informations de connexion depuis l'app
    const apiUrl = app.url?.replace(/\/$/, '') || ''
    const username = (app as any).username || (app as any).proxmoxUsername
    const password = (app as any).password || (app as any).proxmoxPassword
    const token = (app as any).token || (app as any).proxmoxToken

    if (!apiUrl) {
      return NextResponse.json(
        { 
          error: 'URL non configurée. Veuillez configurer l\'URL du serveur Proxmox dans les paramètres de l\'application.',
        },
        { status: 400 }
      )
    }

    // Proxmox nécessite soit username/password, soit un token
    if (!token && (!username || !password)) {
      return NextResponse.json(
        { 
          error: 'Authentification non configurée. Veuillez configurer soit un token, soit un nom d\'utilisateur et un mot de passe dans les paramètres de l\'application.',
        },
        { status: 400 }
      )
    }

    // Récupérer les statistiques depuis l'API Proxmox
    const stats = await fetchProxmoxStats(apiUrl, username, password, token)

    return NextResponse.json(stats, { status: 200 })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des stats Proxmox:', error)
    
    return NextResponse.json(
      { error: error.message || 'Impossible de récupérer les statistiques Proxmox' },
      { status: 500 }
    )
  }
}

/**
 * Récupère un ticket d'authentification Proxmox
 */
async function getProxmoxTicket(apiUrl: string, username: string, password: string): Promise<string> {
  const response = await fetch(`${apiUrl}/api2/json/access/ticket`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      username,
      password,
    }),
    signal: AbortSignal.timeout(10000),
  })

  if (!response.ok) {
    throw new Error(`Erreur d'authentification Proxmox: ${response.status}`)
  }

  const data = await response.json()
  return data.data.ticket
}

/**
 * Récupère les statistiques depuis l'API Proxmox
 * 
 * @param apiUrl - URL de base de l'API Proxmox
 * @param username - Nom d'utilisateur (optionnel si token fourni)
 * @param password - Mot de passe (optionnel si token fourni)
 * @param token - Token d'authentification (optionnel)
 * @returns Les statistiques formatées
 */
async function fetchProxmoxStats(
  apiUrl: string,
  username?: string,
  password?: string,
  token?: string
): Promise<ProxmoxStats> {
  let authHeader: string

  // Obtenir le ticket ou utiliser le token
  if (token) {
    authHeader = `PVEAPIToken=${token}`
  } else if (username && password) {
    const ticket = await getProxmoxTicket(apiUrl, username, password)
    authHeader = `PVEAuthCookie=${ticket}`
  } else {
    throw new Error('Authentification requise')
  }

  const headers = {
    'Authorization': authHeader,
    'Accept': 'application/json',
  }

  // Récupérer les nœuds
  const nodesResponse = await fetch(`${apiUrl}/api2/json/nodes`, {
    headers,
    signal: AbortSignal.timeout(10000),
  })

  if (!nodesResponse.ok) {
    throw new Error(`Erreur API Proxmox: ${nodesResponse.status}`)
  }

  const nodesData = await nodesResponse.json()
  const nodes: ProxmoxNode[] = nodesData.data || []
  const totalNodes = nodes.length

  let totalVMs = 0
  let totalContainers = 0
  let activeVMs = 0
  let inactiveVMs = 0
  let activeContainers = 0
  let inactiveContainers = 0
  let totalCpu = 0
  let totalMaxCpu = 0
  let totalMem = 0
  let totalMaxMem = 0

  // Pour chaque nœud, récupérer les VMs et containers
  for (const node of nodes) {
    // Récupérer les VMs QEMU
    try {
      const qemuResponse = await fetch(`${apiUrl}/api2/json/nodes/${node.node}/qemu`, {
        headers,
        signal: AbortSignal.timeout(5000),
      })

      if (qemuResponse.ok) {
        const qemuData = await qemuResponse.json()
        const vms = qemuData.data || []
        totalVMs += vms.length

        for (const vm of vms) {
          if (vm.status === 'running') {
            activeVMs++
          } else {
            inactiveVMs++
          }
        }
      }
    } catch (error) {
      console.warn(`Impossible de récupérer les VMs pour le nœud ${node.node}:`, error)
    }

    // Récupérer les containers LXC
    try {
      const lxcResponse = await fetch(`${apiUrl}/api2/json/nodes/${node.node}/lxc`, {
        headers,
        signal: AbortSignal.timeout(5000),
      })

      if (lxcResponse.ok) {
        const lxcData = await lxcResponse.json()
        const containers = lxcData.data || []
        totalContainers += containers.length

        for (const container of containers) {
          if (container.status === 'running') {
            activeContainers++
          } else {
            inactiveContainers++
          }
        }
      }
    } catch (error) {
      console.warn(`Impossible de récupérer les containers pour le nœud ${node.node}:`, error)
    }

    // Accumuler les ressources
    totalCpu += node.cpu || 0
    totalMaxCpu += node.maxcpu || 1
    totalMem += node.mem || 0
    totalMaxMem += node.maxmem || 0
  }

  // Calculer les pourcentages
  const cpuUsage = totalMaxCpu > 0 ? (totalCpu / totalMaxCpu) * 100 : 0
  const memoryUsage = totalMaxMem > 0 ? (totalMem / totalMaxMem) * 100 : 0

  return {
    totalNodes,
    totalVMs,
    totalContainers,
    activeVMs,
    inactiveVMs,
    activeContainers,
    inactiveContainers,
    cpuUsage,
    memoryUsage,
    memoryTotal: totalMaxMem,
    memoryUsed: totalMem,
    nodes,
  }
}

