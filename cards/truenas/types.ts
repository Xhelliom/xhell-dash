/**
 * Types TypeScript spécifiques à la carte TrueNAS
 * 
 * Ces types sont utilisés uniquement par la carte TrueNAS
 * et peuvent être étendus selon les besoins
 */

/**
 * Interface pour les statistiques TrueNAS
 */
export interface TrueNASStats {
  // KPI principaux
  cpuUsage: number
  memoryUsage: number
  memoryTotal: number
  memoryUsed: number
  diskTotal: number
  diskUsed: number
  activePools: number
  activeServices: number
  
  // Informations sur les pools
  pools: TrueNASPool[]
  
  // Services
  services: TrueNASService[]
}

/**
 * Interface pour un pool de stockage TrueNAS
 */
export interface TrueNASPool {
  id: number
  name: string
  status: string
  size: number
  allocated: number
  free: number
}

/**
 * Interface pour un service TrueNAS
 */
export interface TrueNASService {
  id: number
  service: string
  state: string
  enable: boolean
}

