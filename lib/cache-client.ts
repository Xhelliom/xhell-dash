/**
 * Gestion du cache côté client pour les statistiques
 * 
 * Ce module fournit des fonctions pour stocker et récupérer des données
 * dans le localStorage avec un système de TTL (Time To Live).
 * 
 * Utilisation :
 * - Stocker des données : setCachedData('key', data, 300000) // 5 minutes
 * - Récupérer des données : getCachedData('key')
 * - Vérifier si des données sont valides : isCacheValid('key')
 */

/**
 * Interface pour une entrée de cache
 * 
 * @template T - Type des données stockées
 */
interface CacheEntry<T> {
  /** Données stockées */
  data: T
  /** Timestamp de création en millisecondes */
  timestamp: number
  /** Durée de vie en millisecondes (TTL) */
  ttl: number
}

/**
 * Préfixe pour toutes les clés de cache
 * Permet de distinguer les données de cache des autres données localStorage
 */
const CACHE_PREFIX = 'xhell_dash_cache_'

/**
 * Génère une clé de cache pour une application et un template
 * 
 * @param appId - ID de l'application
 * @param templateId - ID du template (optionnel)
 * @param key - Clé supplémentaire (optionnel, pour différencier les types de stats)
 * @returns Clé de cache complète
 */
export function getCacheKey(appId: string, templateId?: string, key?: string): string {
  const parts = [appId]
  if (templateId) parts.push(templateId)
  if (key) parts.push(key)
  return `${CACHE_PREFIX}${parts.join('_')}`
}

/**
 * Récupère des données depuis le cache si elles sont encore valides
 * 
 * @template T - Type des données à récupérer
 * @param cacheKey - Clé de cache
 * @returns Données en cache si valides, null sinon
 */
export function getCachedData<T>(cacheKey: string): T | null {
  try {
    // Vérifier si localStorage est disponible (peut ne pas l'être en SSR)
    if (typeof window === 'undefined' || !window.localStorage) {
      return null
    }

    const cached = window.localStorage.getItem(cacheKey)
    if (!cached) {
      return null
    }

    const entry: CacheEntry<T> = JSON.parse(cached)
    const now = Date.now()
    const age = now - entry.timestamp

    // Vérifier si les données sont encore valides (pas expirées)
    if (age > entry.ttl) {
      // Données expirées, les supprimer du cache
      window.localStorage.removeItem(cacheKey)
      return null
    }

    return entry.data
  } catch (error) {
    // En cas d'erreur (données corrompues, etc.), nettoyer et retourner null
    console.warn(`Erreur lors de la récupération du cache pour ${cacheKey}:`, error)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(cacheKey)
      }
    } catch {
      // Ignorer les erreurs de nettoyage
    }
    return null
  }
}

/**
 * Stocke des données dans le cache avec un TTL
 * 
 * @template T - Type des données à stocker
 * @param cacheKey - Clé de cache
 * @param data - Données à stocker
 * @param ttl - Durée de vie en millisecondes (défaut : 5 minutes)
 */
export function setCachedData<T>(cacheKey: string, data: T, ttl: number = 300000): void {
  try {
    // Vérifier si localStorage est disponible
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    }

    window.localStorage.setItem(cacheKey, JSON.stringify(entry))
  } catch (error) {
    // En cas d'erreur (quota dépassé, etc.), logger mais ne pas faire échouer
    console.warn(`Erreur lors du stockage du cache pour ${cacheKey}:`, error)
  }
}

/**
 * Vérifie si des données en cache sont encore valides
 * 
 * @param cacheKey - Clé de cache
 * @returns true si les données sont valides, false sinon
 */
export function isCacheValid(cacheKey: string): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false
    }

    const cached = window.localStorage.getItem(cacheKey)
    if (!cached) {
      return false
    }

    const entry: CacheEntry<unknown> = JSON.parse(cached)
    const now = Date.now()
    const age = now - entry.timestamp

    return age <= entry.ttl
  } catch {
    return false
  }
}

/**
 * Récupère le timestamp de la dernière mise à jour des données en cache
 * 
 * @param cacheKey - Clé de cache
 * @returns Timestamp en millisecondes, ou null si pas de cache
 */
export function getCacheTimestamp(cacheKey: string): number | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null
    }

    const cached = window.localStorage.getItem(cacheKey)
    if (!cached) {
      return null
    }

    const entry: CacheEntry<unknown> = JSON.parse(cached)
    return entry.timestamp
  } catch {
    return null
  }
}

/**
 * Supprime des données du cache
 * 
 * @param cacheKey - Clé de cache à supprimer
 */
export function clearCachedData(cacheKey: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(cacheKey)
    }
  } catch (error) {
    console.warn(`Erreur lors de la suppression du cache pour ${cacheKey}:`, error)
  }
}

/**
 * Nettoie toutes les entrées de cache expirées
 * 
 * Cette fonction parcourt toutes les clés de cache et supprime celles qui sont expirées.
 * Utile pour libérer de l'espace dans localStorage.
 */
export function cleanExpiredCache(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }

    const now = Date.now()
    const keysToRemove: string[] = []

    // Parcourir toutes les clés de localStorage
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = window.localStorage.getItem(key)
          if (cached) {
            const entry: CacheEntry<unknown> = JSON.parse(cached)
            const age = now - entry.timestamp
            if (age > entry.ttl) {
              keysToRemove.push(key)
            }
          }
        } catch {
          // Si les données sont corrompues, les supprimer
          keysToRemove.push(key)
        }
      }
    }

    // Supprimer les clés expirées
    keysToRemove.forEach((key) => {
      window.localStorage.removeItem(key)
    })

    if (keysToRemove.length > 0) {
      console.log(`Nettoyage du cache : ${keysToRemove.length} entrée(s) expirée(s) supprimée(s)`)
    }
  } catch (error) {
    console.warn('Erreur lors du nettoyage du cache:', error)
  }
}

/**
 * Nettoie automatiquement le cache expiré au chargement du module
 * Cela évite d'accumuler des données inutiles dans localStorage
 */
if (typeof window !== 'undefined') {
  // Nettoyer le cache expiré au chargement
  cleanExpiredCache()

  // Nettoyer périodiquement (toutes les heures)
  setInterval(cleanExpiredCache, 3600000)
}

