/**
 * Schémas de validation Zod pour les données génériques
 * 
 * Ces schémas permettent de valider les données reçues depuis
 * une API externe générique.
 */

import { z } from 'zod'
import type { GenericStats } from './types'

/**
 * Schéma générique pour les statistiques
 * Accepte un objet avec des valeurs numériques ou string
 * 
 * Note: z.record() ne supporte pas .passthrough() dans Zod v4
 * On utilise z.object({}).passthrough() pour accepter n'importe quel objet
 */
export const GenericStatsSchema = z.object({}).passthrough()

/**
 * Valide et normalise les données génériques
 * 
 * @param data - Données brutes à valider
 * @returns Données validées et normalisées
 */
export function validateGenericStats(data: unknown): GenericStats {
  try {
    // Pour les données génériques, on est plus permissif
    const result = GenericStatsSchema.safeParse(data)
    
    if (result.success) {
      return result.data as GenericStats
    }
    
    // Si la validation échoue, logger et retourner un objet vide
    console.warn('Validation GenericStats échouée:', result.error.issues)
    
    // Essayer de retourner les données telles quelles si c'est un objet
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      return data as GenericStats
    }
    
    // Sinon, retourner un objet vide
    return {}
  } catch (error) {
    console.error('Erreur lors de la validation GenericStats:', error)
    return {}
  }
}

