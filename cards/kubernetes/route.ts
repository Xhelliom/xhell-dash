/**
 * Handler API pour la route des statistiques Kubernetes
 * 
 * GET /api/apps/[id]/stats/kubernetes
 * 
 * Récupère les statistiques depuis l'API Kubernetes
 */

import { NextRequest, NextResponse } from 'next/server'
import { readApps } from '@/lib/db'
import type { KubernetesStats, KubernetesNamespaceStat } from './types'

/**
 * GET /api/apps/[id]/stats/kubernetes
 * 
 * Récupère les statistiques détaillées depuis l'API Kubernetes
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
    const hasCorrectTemplate = app.statsConfig?.templateId === 'kubernetes'
    if (!hasCorrectTemplate) {
      return NextResponse.json(
        { error: 'Cette route est réservée aux applications avec le template Kubernetes' },
        { status: 400 }
      )
    }

    // Récupérer les informations de connexion depuis l'app
    const apiUrl = app.url?.replace(/\/$/, '') || ''
    const kubeconfig = (app as any).kubeconfig
    const token = (app as any).token || (app as any).kubernetesToken

    if (!apiUrl) {
      return NextResponse.json(
        { 
          error: 'URL non configurée. Veuillez configurer l\'URL de l\'API Kubernetes dans les paramètres de l\'application.',
        },
        { status: 400 }
      )
    }

    // Kubernetes nécessite soit un token, soit un kubeconfig
    if (!token && !kubeconfig) {
      return NextResponse.json(
        { 
          error: 'Authentification non configurée. Veuillez configurer soit un token, soit un kubeconfig dans les paramètres de l\'application.',
        },
        { status: 400 }
      )
    }

    // Récupérer les statistiques depuis l'API Kubernetes
    const stats = await fetchKubernetesStats(apiUrl, token, kubeconfig)

    return NextResponse.json(stats, { status: 200 })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des stats Kubernetes:', error)
    
    return NextResponse.json(
      { error: error.message || 'Impossible de récupérer les statistiques Kubernetes' },
      { status: 500 }
    )
  }
}

/**
 * Récupère les statistiques depuis l'API Kubernetes
 * 
 * @param apiUrl - URL de base de l'API Kubernetes
 * @param token - Token d'authentification (optionnel)
 * @param kubeconfig - Configuration kubeconfig (optionnel)
 * @returns Les statistiques formatées
 */
async function fetchKubernetesStats(
  apiUrl: string,
  token?: string,
  kubeconfig?: string
): Promise<KubernetesStats> {
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }

  // Utiliser le token si disponible
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  // Note: Pour kubeconfig, il faudrait parser le fichier et extraire le token/certificat
  // Pour simplifier, on suppose qu'un token est fourni directement

  // Récupérer les nœuds
  const nodesResponse = await fetch(`${apiUrl}/api/v1/nodes`, {
    headers,
    signal: AbortSignal.timeout(10000),
  })

  if (!nodesResponse.ok) {
    throw new Error(`Erreur API Kubernetes: ${nodesResponse.status}`)
  }

  const nodesData = await nodesResponse.json()
  const nodes = nodesData.items || []
  const totalNodes = nodes.length

  // Récupérer les pods
  const podsResponse = await fetch(`${apiUrl}/api/v1/pods`, {
    headers,
    signal: AbortSignal.timeout(10000),
  })

  let totalPods = 0
  let runningPods = 0
  let pendingPods = 0
  let failedPods = 0
  const namespaceStatsMap = new Map<string, { podCount: number; runningPods: number; failedPods: number }>()

  if (podsResponse.ok) {
    const podsData = await podsResponse.json()
    const pods = podsData.items || []
    totalPods = pods.length

    for (const pod of pods) {
      const namespace = pod.metadata?.namespace || 'default'
      const phase = pod.status?.phase?.toLowerCase() || 'unknown'

      // Compter par namespace
      if (!namespaceStatsMap.has(namespace)) {
        namespaceStatsMap.set(namespace, { podCount: 0, runningPods: 0, failedPods: 0 })
      }

      const namespaceStat = namespaceStatsMap.get(namespace)!
      namespaceStat.podCount++

      // Compter par phase
      if (phase === 'running') {
        runningPods++
        namespaceStat.runningPods++
      } else if (phase === 'pending') {
        pendingPods++
      } else if (phase === 'failed' || phase === 'error') {
        failedPods++
        namespaceStat.failedPods++
      }
    }
  }

  // Récupérer les métriques (si disponibles)
  let cpuUsage = 0
  let memoryUsage = 0
  let memoryTotal = 0
  let memoryUsed = 0

  try {
    const metricsResponse = await fetch(`${apiUrl}/apis/metrics.k8s.io/v1beta1/nodes`, {
      headers,
      signal: AbortSignal.timeout(10000),
    })

    if (metricsResponse.ok) {
      const metricsData = await metricsResponse.json()
      const nodeMetrics = metricsData.items || []

      for (const nodeMetric of nodeMetrics) {
        const usage = nodeMetric.usage || {}
        
        // CPU en millicores
        const cpuMillicores = parseCpuValue(usage.cpu || '0')
        cpuUsage += cpuMillicores

        // Mémoire en bytes
        const memBytes = parseMemoryValue(usage.memory || '0')
        memoryUsed += memBytes
      }

      // Pour obtenir le total, on peut utiliser les capacités des nœuds
      for (const node of nodes) {
        const capacity = node.status?.capacity || {}
        const totalCpu = parseCpuValue(capacity.cpu || '0')
        const totalMem = parseMemoryValue(capacity.memory || '0')
        memoryTotal += totalMem
      }

      // Convertir en pourcentage
      if (memoryTotal > 0) {
        memoryUsage = (memoryUsed / memoryTotal) * 100
      }
    }
  } catch (error) {
    console.warn('Impossible de récupérer les métriques Kubernetes:', error)
  }

  // Convertir la map en array
  const namespaceStats: KubernetesNamespaceStat[] = Array.from(namespaceStatsMap.entries()).map(([namespace, stats]) => ({
    namespace,
    podCount: stats.podCount,
    runningPods: stats.runningPods,
    failedPods: stats.failedPods,
  }))

  return {
    totalNodes,
    totalPods,
    runningPods,
    pendingPods,
    failedPods,
    cpuUsage,
    memoryUsage,
    memoryTotal,
    memoryUsed,
    namespaceStats: namespaceStats.sort((a, b) => b.podCount - a.podCount).slice(0, 10), // Top 10 namespaces
  }
}

/**
 * Parse une valeur CPU (ex: "100m" = 100 millicores, "1" = 1 core)
 */
function parseCpuValue(value: string): number {
  if (!value) return 0
  if (value.endsWith('m')) {
    return parseFloat(value) / 1000
  }
  return parseFloat(value) || 0
}

/**
 * Parse une valeur mémoire (ex: "1Gi" = 1 GiB, "512Mi" = 512 MiB)
 */
function parseMemoryValue(value: string): number {
  if (!value) return 0
  const match = value.match(/^(\d+(?:\.\d+)?)([KMGT]?i?)$/i)
  if (!match) return 0
  
  const num = parseFloat(match[1])
  const unit = match[2].toUpperCase()
  
  const multipliers: Record<string, number> = {
    '': 1,
    'K': 1024,
    'M': 1024 * 1024,
    'G': 1024 * 1024 * 1024,
    'T': 1024 * 1024 * 1024 * 1024,
    'KI': 1024,
    'MI': 1024 * 1024,
    'GI': 1024 * 1024 * 1024,
    'TI': 1024 * 1024 * 1024 * 1024,
  }
  
  return num * (multipliers[unit] || 1)
}

