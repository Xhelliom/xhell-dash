/**
 * Système de stockage des métriques historiques
 * 
 * Ce module permet de stocker et récupérer des métriques historiques
 * pour afficher des graphiques avec de vraies données au lieu de données simulées.
 * 
 * Utilise localStorage pour le stockage côté client.
 * Les métriques sont stockées avec un timestamp pour permettre l'affichage
 * de graphiques sur différentes périodes (7 jours, 30 jours, etc.).
 */

'use client'

/**
 * Interface pour une entrée de métrique
 */
export interface MetricEntry {
  /** ID de l'application */
  appId: string
  /** ID du template de stats */
  templateId: string
  /** Clé de la métrique (ex: 'totalMovies', 'totalShows') */
  key: string
  /** Valeur de la métrique */
  value: number
  /** Timestamp de la métrique en millisecondes */
  timestamp: number
}

/**
 * Préfixe pour les clés de stockage des métriques
 */
const METRICS_PREFIX = 'xhell_dash_metrics_'

/**
 * Génère une clé de stockage pour une métrique
 * 
 * @param appId - ID de l'application
 * @param templateId - ID du template
 * @param key - Clé de la métrique
 * @returns Clé de stockage complète
 */
function getMetricStorageKey(appId: string, templateId: string, key: string): string {
  return `${METRICS_PREFIX}${appId}_${templateId}_${key}`
}

/**
 * Stocke une métrique dans le localStorage
 * 
 * @param entry - Entrée de métrique à stocker
 */
export function storeMetric(entry: MetricEntry): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }

    const storageKey = getMetricStorageKey(entry.appId, entry.templateId, entry.key)
    
    // Récupérer les métriques existantes
    const existing = getMetrics(entry.appId, entry.templateId, entry.key)
    
    // Ajouter la nouvelle métrique
    const updated = [...existing, entry]
    
    // Limiter à 1000 entrées par métrique pour éviter de saturer le localStorage
    // Garder les 1000 plus récentes
    const limited = updated
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 1000)
      .sort((a, b) => a.timestamp - b.timestamp) // Re-trier par ordre chronologique
    
    window.localStorage.setItem(storageKey, JSON.stringify(limited))
  } catch (error) {
    console.warn(`Erreur lors du stockage de la métrique pour ${entry.appId}/${entry.templateId}/${entry.key}:`, error)
  }
}

/**
 * Stocke plusieurs métriques en une seule fois
 * 
 * @param entries - Tableau d'entrées de métriques à stocker
 */
export function storeMetrics(entries: MetricEntry[]): void {
  entries.forEach(entry => storeMetric(entry))
}

/**
 * Récupère toutes les métriques pour une application, template et clé donnés
 * 
 * @param appId - ID de l'application
 * @param templateId - ID du template
 * @param key - Clé de la métrique
 * @returns Tableau des métriques, trié par timestamp croissant
 */
export function getMetrics(
  appId: string,
  templateId: string,
  key: string
): MetricEntry[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return []
    }

    const storageKey = getMetricStorageKey(appId, templateId, key)
    const stored = window.localStorage.getItem(storageKey)
    
    if (!stored) {
      return []
    }

    const metrics: MetricEntry[] = JSON.parse(stored)
    
    // Vérifier que les données sont valides
    if (!Array.isArray(metrics)) {
      return []
    }

    // Filtrer les entrées invalides et trier par timestamp
    return metrics
      .filter(entry => 
        entry &&
        typeof entry.timestamp === 'number' &&
        typeof entry.value === 'number'
      )
      .sort((a, b) => a.timestamp - b.timestamp)
  } catch (error) {
    console.warn(`Erreur lors de la récupération des métriques pour ${appId}/${templateId}/${key}:`, error)
    return []
  }
}

/**
 * Récupère les métriques pour une période donnée
 * 
 * @param appId - ID de l'application
 * @param templateId - ID du template
 * @param key - Clé de la métrique
 * @param periodDays - Nombre de jours à récupérer (défaut: 7)
 * @returns Tableau des métriques pour la période demandée
 */
export function getMetricsForPeriod(
  appId: string,
  templateId: string,
  key: string,
  periodDays: number = 7
): MetricEntry[] {
  const allMetrics = getMetrics(appId, templateId, key)
  const now = Date.now()
  const periodMs = periodDays * 24 * 60 * 60 * 1000
  const cutoffTime = now - periodMs

  return allMetrics.filter(entry => entry.timestamp >= cutoffTime)
}

/**
 * Récupère les métriques agrégées par jour pour une période donnée
 * Utile pour afficher des graphiques avec une valeur par jour
 * 
 * @param appId - ID de l'application
 * @param templateId - ID du template
 * @param key - Clé de la métrique
 * @param periodDays - Nombre de jours à récupérer (défaut: 7)
 * @returns Tableau des métriques agrégées par jour
 */
export function getDailyAggregatedMetrics(
  appId: string,
  templateId: string,
  key: string,
  periodDays: number = 7
): Array<{ date: string; value: number; timestamp: number }> {
  const metrics = getMetricsForPeriod(appId, templateId, key, periodDays)
  
  // Grouper par jour
  const dailyMap = new Map<string, { values: number[]; timestamp: number }>()
  
  metrics.forEach(entry => {
    const date = new Date(entry.timestamp)
    const dateKey = date.toISOString().split('T')[0] // Format YYYY-MM-DD
    
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, { values: [], timestamp: entry.timestamp })
    }
    
    const dayData = dailyMap.get(dateKey)!
    dayData.values.push(entry.value)
    // Garder le timestamp le plus récent de la journée
    if (entry.timestamp > dayData.timestamp) {
      dayData.timestamp = entry.timestamp
    }
  })
  
  // Convertir en tableau et calculer la moyenne par jour
  return Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      value: Math.round(data.values.reduce((sum, val) => sum + val, 0) / data.values.length),
      timestamp: data.timestamp,
    }))
    .sort((a, b) => a.timestamp - b.timestamp)
}

/**
 * Nettoie les métriques anciennes (plus de 90 jours)
 * 
 * @param appId - ID de l'application (optionnel, si non fourni, nettoie toutes les apps)
 */
export function cleanOldMetrics(appId?: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }

    const now = Date.now()
    const cutoffTime = now - (90 * 24 * 60 * 60 * 1000) // 90 jours
    const keysToUpdate: string[] = []

    // Parcourir toutes les clés de localStorage
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith(METRICS_PREFIX)) {
        // Si un appId est spécifié, ne traiter que les clés correspondantes
        if (appId && !key.includes(`${METRICS_PREFIX}${appId}_`)) {
          continue
        }

        try {
          const stored = window.localStorage.getItem(key)
          if (stored) {
            const metrics: MetricEntry[] = JSON.parse(stored)
            const filtered = metrics.filter(entry => entry.timestamp >= cutoffTime)
            
            if (filtered.length < metrics.length) {
              keysToUpdate.push(key)
              if (filtered.length > 0) {
                window.localStorage.setItem(key, JSON.stringify(filtered))
              } else {
                window.localStorage.removeItem(key)
              }
            }
          }
        } catch {
          // Si les données sont corrompues, les supprimer
          if (key) {
            window.localStorage.removeItem(key)
          }
        }
      }
    }

    if (keysToUpdate.length > 0) {
      console.log(`Nettoyage des métriques : ${keysToUpdate.length} clé(s) mise(s) à jour`)
    }
  } catch (error) {
    console.warn('Erreur lors du nettoyage des métriques:', error)
  }
}

/**
 * Supprime toutes les métriques pour une application donnée
 * 
 * @param appId - ID de l'application
 */
export function clearMetricsForApp(appId: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }

    const keysToRemove: string[] = []

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith(METRICS_PREFIX) && key.includes(`${METRICS_PREFIX}${appId}_`)) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach(key => window.localStorage.removeItem(key))
    
    if (keysToRemove.length > 0) {
      console.log(`Suppression des métriques : ${keysToRemove.length} clé(s) supprimée(s) pour l'app ${appId}`)
    }
  } catch (error) {
    console.warn(`Erreur lors de la suppression des métriques pour ${appId}:`, error)
  }
}

/**
 * Nettoie automatiquement les métriques anciennes au chargement du module
 */
if (typeof window !== 'undefined') {
  // Nettoyer les métriques anciennes au chargement
  cleanOldMetrics()

  // Nettoyer périodiquement (tous les jours)
  setInterval(() => cleanOldMetrics(), 24 * 60 * 60 * 1000)
}

