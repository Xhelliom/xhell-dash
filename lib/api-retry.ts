/**
 * Gestion du retry automatique avec backoff exponentiel
 * 
 * Ce module fournit des fonctions pour réessayer automatiquement les requêtes
 * API en cas d'échec, avec un système de backoff exponentiel pour éviter
 * de surcharger le serveur.
 */

/**
 * Types d'erreurs possibles lors d'une requête
 */
export type ErrorType = 'network' | 'timeout' | 'server' | 'client' | 'unknown'

/**
 * Interface pour les options de retry
 */
export interface RetryOptions {
  /** Nombre maximum de tentatives (défaut : 3) */
  maxRetries?: number
  /** Délai de base en millisecondes pour le backoff (défaut : 1000ms) */
  baseDelay?: number
  /** Multiplicateur pour le backoff exponentiel (défaut : 2) */
  backoffMultiplier?: number
  /** Délai maximum entre les tentatives en millisecondes (défaut : 30000ms) */
  maxDelay?: number
  /** Codes HTTP qui doivent déclencher un retry (défaut : [500, 502, 503, 504]) */
  retryableStatusCodes?: number[]
  /** Fonction pour déterminer si une erreur est retryable */
  shouldRetry?: (error: Error, attempt: number) => boolean
}

/**
 * Options par défaut pour le retry
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 30000,
  retryableStatusCodes: [500, 502, 503, 504],
  shouldRetry: () => true,
}

/**
 * Détermine le type d'erreur à partir d'une erreur ou d'une réponse HTTP
 * 
 * @param error - Erreur capturée
 * @param response - Réponse HTTP (si disponible)
 * @returns Type d'erreur identifié
 */
export function getErrorType(error: Error | null, response?: Response): ErrorType {
  // Erreur de timeout
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
    return 'timeout'
  }

  // Erreur réseau (pas de connexion, DNS, etc.)
  if (error?.message?.includes('fetch') || 
      error?.message?.includes('network') ||
      error?.message?.includes('Failed to fetch')) {
    return 'network'
  }

  // Erreur HTTP
  if (response) {
    const status = response.status
    if (status >= 500) {
      return 'server'
    } else if (status >= 400) {
      return 'client'
    }
  }

  return 'unknown'
}

/**
 * Calcule le délai d'attente pour la prochaine tentative avec backoff exponentiel
 * 
 * @param attempt - Numéro de la tentative (commence à 1)
 * @param baseDelay - Délai de base en millisecondes
 * @param multiplier - Multiplicateur pour le backoff
 * @param maxDelay - Délai maximum en millisecondes
 * @returns Délai en millisecondes
 */
function calculateBackoffDelay(
  attempt: number,
  baseDelay: number,
  multiplier: number,
  maxDelay: number
): number {
  // Calcul du délai avec backoff exponentiel : baseDelay * (multiplier ^ (attempt - 1))
  const delay = baseDelay * Math.pow(multiplier, attempt - 1)
  
  // Ajouter un peu de jitter aléatoire pour éviter le thundering herd
  const jitter = Math.random() * 0.3 * delay // Jitter de 0-30% du délai
  
  // Retourner le délai avec jitter, mais pas plus que maxDelay
  return Math.min(delay + jitter, maxDelay)
}

/**
 * Attend un certain nombre de millisecondes
 * 
 * @param ms - Nombre de millisecondes à attendre
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Effectue une requête fetch avec retry automatique et backoff exponentiel
 * 
 * @param url - URL à appeler
 * @param options - Options de la requête fetch
 * @param retryOptions - Options de retry personnalisées
 * @returns Réponse de la requête
 * @throws Erreur si toutes les tentatives échouent
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...retryOptions }
  let lastError: Error | null = null
  let lastResponse: Response | undefined

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      // Effectuer la requête
      const response = await fetch(url, options)

      // Si la réponse est OK, la retourner directement
      if (response.ok) {
        return response
      }

      // Si le code de statut n'est pas retryable, ne pas réessayer
      if (!opts.retryableStatusCodes.includes(response.status)) {
        return response
      }

      // Stocker la réponse pour l'analyse d'erreur
      lastResponse = response

      // Si c'est la dernière tentative, retourner la réponse même si elle n'est pas OK
      if (attempt === opts.maxRetries) {
        return response
      }

      // Calculer le délai d'attente avant la prochaine tentative
      const delay = calculateBackoffDelay(
        attempt,
        opts.baseDelay,
        opts.backoffMultiplier,
        opts.maxDelay
      )

      console.log(
        `Tentative ${attempt}/${opts.maxRetries} échouée pour ${url}. ` +
        `Nouvelle tentative dans ${Math.round(delay)}ms...`
      )

      // Attendre avant de réessayer
      await sleep(delay)

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Vérifier si on doit réessayer cette erreur
      if (!opts.shouldRetry(lastError, attempt)) {
        throw lastError
      }

      // Si c'est la dernière tentative, lancer l'erreur
      if (attempt === opts.maxRetries) {
        throw lastError
      }

      // Calculer le délai d'attente avant la prochaine tentative
      const delay = calculateBackoffDelay(
        attempt,
        opts.baseDelay,
        opts.backoffMultiplier,
        opts.maxDelay
      )

      console.log(
        `Erreur lors de la tentative ${attempt}/${opts.maxRetries} pour ${url}: ${lastError.message}. ` +
        `Nouvelle tentative dans ${Math.round(delay)}ms...`
      )

      // Attendre avant de réessayer
      await sleep(delay)
    }
  }

  // Si on arrive ici, toutes les tentatives ont échoué
  // Retourner la dernière réponse ou lancer la dernière erreur
  if (lastResponse) {
    return lastResponse
  }

  throw lastError || new Error('Toutes les tentatives ont échoué')
}

/**
 * Crée un message d'erreur lisible en français selon le type d'erreur
 * 
 * @param errorType - Type d'erreur identifié
 * @param error - Erreur originale (optionnel)
 * @param response - Réponse HTTP (optionnel)
 * @returns Message d'erreur en français
 */
export function getErrorMessage(
  errorType: ErrorType,
  error?: Error | null,
  response?: Response
): string {
  switch (errorType) {
    case 'network':
      return 'Erreur de connexion réseau. Vérifiez votre connexion internet.'
    
    case 'timeout':
      return 'La requête a expiré. Le serveur met trop de temps à répondre.'
    
    case 'server':
      const status = response?.status || 500
      return `Erreur serveur (${status}). Le serveur rencontre un problème temporaire.`
    
    case 'client':
      const clientStatus = response?.status || 400
      if (clientStatus === 401) {
        return 'Authentification requise. Vérifiez vos identifiants.'
      } else if (clientStatus === 403) {
        return 'Accès refusé. Vous n\'avez pas les permissions nécessaires.'
      } else if (clientStatus === 404) {
        return 'Ressource non trouvée. L\'URL demandée n\'existe pas.'
      }
      return `Erreur de requête (${clientStatus}). Vérifiez les paramètres de votre requête.`
    
    case 'unknown':
    default:
      return error?.message || 'Une erreur inconnue s\'est produite.'
  }
}

