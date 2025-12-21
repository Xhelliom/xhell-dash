/**
 * Types TypeScript spécifiques à la carte Uptime Kuma
 * 
 * Ces types sont utilisés uniquement par la carte Uptime Kuma
 * et peuvent être étendus selon les besoins
 */

/**
 * Interface pour les statistiques Uptime Kuma
 */
export interface UptimeKumaStats {
  // KPI principaux
  totalMonitors: number
  activeMonitors: number
  downMonitors: number
  averageUptime24h: number
  averageUptime7d: number
  averageUptime30d: number
  averageResponseTime: number
  certificatesExpiring: number
  
  // Liste des monitors
  monitors: UptimeKumaMonitor[]
}

/**
 * Interface pour un monitor Uptime Kuma
 */
export interface UptimeKumaMonitor {
  id: number
  name: string
  type: string
  status: 'up' | 'down' | 'maintenance' | 'unknown'
  uptime24h?: number
  uptime7d?: number
  uptime30d?: number
  responseTime?: number
  certExpiry?: number
}

