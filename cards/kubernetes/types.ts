/**
 * Types TypeScript spécifiques à la carte Kubernetes
 * 
 * Ces types sont utilisés uniquement par la carte Kubernetes
 * et peuvent être étendus selon les besoins
 */

/**
 * Interface pour les statistiques Kubernetes
 */
export interface KubernetesStats {
  // KPI principaux
  totalNodes: number
  totalPods: number
  runningPods: number
  pendingPods: number
  failedPods: number
  cpuUsage: number
  memoryUsage: number
  memoryTotal: number
  memoryUsed: number
  
  // Statistiques par namespace
  namespaceStats: KubernetesNamespaceStat[]
}

/**
 * Interface pour les statistiques d'un namespace
 */
export interface KubernetesNamespaceStat {
  namespace: string
  podCount: number
  runningPods: number
  failedPods: number
}

