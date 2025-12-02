/**
 * Registre des types de statistiques de carte disponibles
 * 
 * Ce fichier définit les types de stats de carte disponibles pour chaque template.
 * Les types communs ('number', 'chart') sont disponibles pour tous les templates.
 * Les types spécifiques sont enregistrés par template.
 */

/**
 * Types de statistiques de carte communs disponibles pour tous les templates
 */
export const COMMON_CARD_STAT_TYPES = ['number', 'chart'] as const

/**
 * Types de statistiques de carte spécifiques par template
 * Chaque template peut définir ses propres types personnalisés
 */
export const TEMPLATE_CARD_STAT_TYPES: Record<string, readonly string[]> = {
  plex: ['plex-recent'] as const,
  // Ajouter d'autres templates ici :
  // sonarr: ['sonarr-queue', 'sonarr-calendar'] as const,
  // radarr: ['radarr-queue'] as const,
}

/**
 * Interface pour le registre de types de stats de carte
 */
export interface CardStatTypeRegistry {
  /**
   * Types communs disponibles pour tous les templates
   */
  common: readonly string[]
  /**
   * Types spécifiques par template
   */
  templateSpecific: Record<string, readonly string[]>
}

/**
 * Récupère tous les types de stats de carte disponibles pour un template donné
 * 
 * @param templateId - ID du template (ex: 'plex', 'sonarr') ou undefined pour les types communs uniquement
 * @returns Liste des types disponibles (communs + spécifiques au template)
 */
export function getCardStatTypes(templateId?: string): string[] {
  const common = [...COMMON_CARD_STAT_TYPES]
  
  if (!templateId) {
    return common
  }
  
  const templateSpecific = TEMPLATE_CARD_STAT_TYPES[templateId] || []
  return [...common, ...templateSpecific]
}

/**
 * Vérifie si un type de stat de carte est valide pour un template donné
 * 
 * @param type - Type à vérifier
 * @param templateId - ID du template (optionnel)
 * @returns true si le type est valide pour ce template
 */
export function isValidCardStatType(type: string, templateId?: string): boolean {
  const availableTypes = getCardStatTypes(templateId)
  return availableTypes.includes(type)
}

/**
 * Récupère le registre complet des types de stats de carte
 */
export function getCardStatTypeRegistry(): CardStatTypeRegistry {
  return {
    common: COMMON_CARD_STAT_TYPES,
    templateSpecific: TEMPLATE_CARD_STAT_TYPES,
  }
}

