/**
 * Configuration des timeouts adaptatifs selon le type d'API
 * 
 * Certaines APIs sont plus lentes que d'autres, donc nous adaptons
 * les timeouts par défaut selon le type de service.
 */

/**
 * Timeouts par défaut en millisecondes selon le type d'API
 * 
 * Ces valeurs sont utilisées si aucun timeout n'est configuré dans statsConfig
 */
const DEFAULT_TIMEOUTS: Record<string, number> = {
  // APIs rapides (réponses généralement < 2 secondes)
  'plex': 10000,        // 10 secondes - API généralement rapide
  'generic': 10000,     // 10 secondes - API générique
  
  // APIs moyennement lentes (réponses généralement 2-5 secondes)
  'sonarr': 15000,      // 15 secondes - Peut être plus lent avec beaucoup de séries
  'radarr': 15000,      // 15 secondes - Peut être plus lent avec beaucoup de films
  'lidarr': 15000,      // 15 secondes - Peut être plus lent avec beaucoup d'albums
  
  // APIs lentes (réponses généralement 5-10 secondes)
  'truenas': 20000,     // 20 secondes - API TrueNAS peut être lente
  'homeassistant': 20000, // 20 secondes - Home Assistant peut être lent avec beaucoup d'entités
  'proxmox': 20000,     // 20 secondes - Proxmox peut être lent avec beaucoup de VMs
  
  // APIs très lentes (réponses généralement > 10 secondes)
  'kubernetes': 30000,  // 30 secondes - Kubernetes peut être très lent avec beaucoup de pods
}

/**
 * Récupère le timeout adaptatif selon le type d'API
 * 
 * @param templateId - ID du template de stats (ex: 'plex', 'sonarr', 'kubernetes')
 * @param configuredTimeout - Timeout configuré manuellement dans statsConfig (optionnel)
 * @returns Le timeout à utiliser en millisecondes
 * 
 * @example
 * ```typescript
 * // Utilise le timeout adaptatif pour Plex (10 secondes)
 * const timeout = getAdaptiveTimeout('plex')
 * 
 * // Utilise le timeout configuré manuellement (prioritaire)
 * const timeout = getAdaptiveTimeout('plex', 5000)
 * 
 * // Utilise le timeout adaptatif pour Kubernetes (30 secondes)
 * const timeout = getAdaptiveTimeout('kubernetes')
 * ```
 */
export function getAdaptiveTimeout(
  templateId?: string,
  configuredTimeout?: number
): number {
  // Si un timeout est configuré manuellement, l'utiliser en priorité
  if (configuredTimeout !== undefined && configuredTimeout > 0) {
    return configuredTimeout
  }
  
  // Sinon, utiliser le timeout adaptatif selon le templateId
  if (templateId && templateId in DEFAULT_TIMEOUTS) {
    return DEFAULT_TIMEOUTS[templateId]
  }
  
  // Par défaut, utiliser 10 secondes pour les templates inconnus
  return 10000
}

/**
 * Récupère le timeout adaptatif depuis une configuration d'application
 * 
 * @param app - Configuration de l'application avec statsConfig
 * @returns Le timeout à utiliser en millisecondes
 * 
 * @example
 * ```typescript
 * const timeout = getTimeoutFromApp(app)
 * ```
 */
export function getTimeoutFromApp(app: { statsConfig?: { templateId?: string; timeout?: number } }): number {
  return getAdaptiveTimeout(
    app.statsConfig?.templateId,
    app.statsConfig?.timeout
  )
}

