/**
 * Registre des types de statistiques de carte disponibles
 * 
 * Ce fichier est maintenant un wrapper qui récupère les types depuis
 * le registre de cartes. Il maintient la compatibilité avec l'ancien code
 * tout en utilisant le nouveau système modulaire.
 * 
 * Les types sont maintenant définis dans les cartes individuelles
 * (ex: cards/plex/index.ts) et chargés automatiquement.
 */

// Importer toutes les cartes pour qu'elles s'enregistrent
// Cela garantit que le registre est peuplé avant d'utiliser les types
import '@/cards'

import { cardRegistry } from './card-registry'

/**
 * Types de statistiques de carte communs disponibles pour tous les templates
 * 
 * Ces types sont toujours disponibles, indépendamment des cartes
 */
export const COMMON_CARD_STAT_TYPES = ['number', 'chart'] as const

/**
 * Types de statistiques de carte spécifiques par template
 * 
 * Récupère dynamiquement depuis le registre de cartes
 * Pour la compatibilité, on construit un objet à partir des cartes enregistrées
 */
export const TEMPLATE_CARD_STAT_TYPES: Record<string, readonly string[]> = (() => {
  const types: Record<string, readonly string[]> = {}
  const allCards = cardRegistry.getAll()
  
  for (const card of allCards) {
    if (card.cardStatTypes && card.cardStatTypes.length > 0) {
      // Filtrer les types communs pour ne garder que les types spécifiques
      const specificTypes = card.cardStatTypes.filter(
        (type) => !COMMON_CARD_STAT_TYPES.includes(type as any)
      )
      if (specificTypes.length > 0) {
        types[card.id] = specificTypes as readonly string[]
      }
    }
  }
  
  return types
})()

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
 * Utilise le registre de cartes pour récupérer les types dynamiquement
 * 
 * @param templateId - ID du template (ex: 'plex', 'sonarr') ou undefined pour les types communs uniquement
 * @returns Liste des types disponibles (communs + spécifiques au template)
 */
export function getCardStatTypes(templateId?: string): string[] {
  if (!templateId) {
    return [...COMMON_CARD_STAT_TYPES]
  }
  
  // Utiliser le registre de cartes pour récupérer les types
  return cardRegistry.getCardStatTypes(templateId)
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
 * 
 * Construit le registre à partir du registre de cartes
 */
export function getCardStatTypeRegistry(): CardStatTypeRegistry {
  return {
    common: COMMON_CARD_STAT_TYPES,
    templateSpecific: TEMPLATE_CARD_STAT_TYPES,
  }
}

