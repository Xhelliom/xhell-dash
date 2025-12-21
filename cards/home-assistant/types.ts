/**
 * Types TypeScript spécifiques à la carte Home Assistant
 * 
 * Ces types sont utilisés uniquement par la carte Home Assistant
 * et peuvent être étendus selon les besoins
 */

/**
 * Interface pour les statistiques Home Assistant
 */
export interface HomeAssistantStats {
  // KPI principaux
  totalEntities: number
  activeEntities: number
  inactiveEntities: number
  automationsActive: number
  recentChanges: HomeAssistantRecentChange[]
  
  // Statistiques par domaine
  domainStats: HomeAssistantDomainStat[]
}

/**
 * Interface pour un changement récent
 */
export interface HomeAssistantRecentChange {
  entityId: string
  state: string
  lastChanged: string
  friendlyName?: string
}

/**
 * Interface pour les statistiques d'un domaine
 */
export interface HomeAssistantDomainStat {
  domain: string
  count: number
  active: number
}

