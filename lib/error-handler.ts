/**
 * Gestionnaire d'erreurs amélioré pour les cartes
 * 
 * Ce module fournit des fonctions pour gérer les erreurs de manière cohérente
 * et afficher des messages appropriés selon le type d'erreur.
 */

import { getErrorType, getErrorMessage, type ErrorType } from './api-retry'

/**
 * Interface pour une erreur structurée
 */
export interface StructuredError {
  /** Type d'erreur */
  type: ErrorType
  /** Message d'erreur lisible en français */
  message: string
  /** Message d'aide supplémentaire (optionnel) */
  hint?: string
  /** Code de statut HTTP si disponible */
  statusCode?: number
  /** Erreur originale */
  originalError?: Error
}

/**
 * Crée une erreur structurée à partir d'une erreur ou d'une réponse HTTP
 * 
 * @param error - Erreur capturée
 * @param response - Réponse HTTP (optionnel)
 * @param customHint - Message d'aide personnalisé (optionnel)
 * @returns Erreur structurée
 */
export function createStructuredError(
  error: Error | null,
  response?: Response,
  customHint?: string
): StructuredError {
  const errorType = getErrorType(error, response)
  const message = getErrorMessage(errorType, error, response)
  
  // Générer un hint personnalisé selon le type d'erreur
  let hint = customHint
  if (!hint) {
    switch (errorType) {
      case 'network':
        hint = 'Vérifiez votre connexion internet et réessayez.'
        break
      case 'timeout':
        hint = 'Le serveur met trop de temps à répondre. Réessayez plus tard.'
        break
      case 'server':
        hint = 'Le serveur rencontre un problème temporaire. Réessayez dans quelques instants.'
        break
      case 'client':
        if (response?.status === 401 || response?.status === 403) {
          hint = 'Vérifiez vos identifiants dans les paramètres de l\'application.'
        } else if (response?.status === 404) {
          hint = 'Vérifiez que l\'URL de l\'API est correcte.'
        } else {
          hint = 'Vérifiez les paramètres de votre requête.'
        }
        break
      default:
        hint = 'Réessayez plus tard ou contactez le support si le problème persiste.'
    }
  }

  return {
    type: errorType,
    message,
    hint,
    statusCode: response?.status,
    originalError: error || undefined,
  }
}

/**
 * Détermine si une erreur est récupérable (peut être réessayée)
 * 
 * @param error - Erreur structurée
 * @returns true si l'erreur est récupérable, false sinon
 */
export function isRecoverableError(error: StructuredError): boolean {
  // Les erreurs réseau, timeout et serveur sont généralement récupérables
  return ['network', 'timeout', 'server'].includes(error.type)
}

/**
 * Détermine si une erreur nécessite une action de l'utilisateur
 * 
 * @param error - Erreur structurée
 * @returns true si l'utilisateur doit agir, false sinon
 */
export function requiresUserAction(error: StructuredError): boolean {
  // Les erreurs client (401, 403, etc.) nécessitent généralement une action
  return error.type === 'client'
}

