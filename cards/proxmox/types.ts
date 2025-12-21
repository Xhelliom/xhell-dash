/**
 * Types TypeScript spécifiques à la carte Proxmox
 * 
 * Ces types sont utilisés uniquement par la carte Proxmox
 * et peuvent être étendus selon les besoins
 */

/**
 * Interface pour les statistiques Proxmox
 */
export interface ProxmoxStats {
  // KPI principaux
  totalNodes: number
  totalVMs: number
  totalContainers: number
  activeVMs: number
  inactiveVMs: number
  activeContainers: number
  inactiveContainers: number
  cpuUsage: number
  memoryUsage: number
  memoryTotal: number
  memoryUsed: number
  
  // Informations sur les nœuds
  nodes: ProxmoxNode[]
}

/**
 * Interface pour un nœud Proxmox
 */
export interface ProxmoxNode {
  node: string
  status: string
  cpu: number
  maxcpu: number
  mem: number
  maxmem: number
  uptime: number
}

