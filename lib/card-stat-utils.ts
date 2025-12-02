/**
 * Utilitaires pour les statistiques de carte
 * 
 * Fonctions de migration et normalisation des configurations
 */

import type { CardStatConfig } from './types'

/**
 * Normalise une configuration de statistique de carte
 * Convertit les anciennes configurations (ex: type: 'plex-recent') vers le nouveau format
 * 
 * @param config - Configuration à normaliser (peut être de l'ancien format)
 * @returns Configuration normalisée
 */
export function normalizeCardStatConfig(config: any): CardStatConfig | undefined {
  if (!config) {
    return undefined
  }

  // Si c'est déjà au nouveau format et valide, retourner tel quel
  if (config.type === 'number' || config.type === 'chart' || config.type === 'custom') {
    return config as CardStatConfig
  }

  // Migration depuis l'ancien format où 'plex-recent' était directement dans type
  if (config.type === 'plex-recent') {
    return {
      type: 'custom',
      customType: 'plex-recent',
      key: config.key,
      label: config.label,
    }
  }

  // Si le type n'est pas reconnu, retourner undefined
  return undefined
}

