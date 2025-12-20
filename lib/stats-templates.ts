/**
 * Templates de statistiques préconfigurés
 * 
 * Ce fichier est maintenant un wrapper qui récupère les templates depuis
 * le registre de cartes. Il maintient la compatibilité avec l'ancien code
 * tout en utilisant le nouveau système modulaire.
 * 
 * Les templates sont maintenant définis dans les cartes individuelles
 * (ex: cards/plex/index.ts) et chargés automatiquement.
 */

// Importer toutes les cartes pour qu'elles s'enregistrent
// Cela garantit que le registre est peuplé avant d'utiliser les templates
import '@/cards'

import { cardRegistry } from './card-registry'
import type { StatsDisplayOptions } from './types'
import { getCardStatTypes } from './card-stat-types'

/**
 * Interface pour un template de statistiques
 * 
 * Cette interface est ré-exportée pour maintenir la compatibilité
 * avec le code existant qui l'importe depuis ce fichier.
 */
export interface StatsTemplate {
  id: string
  name: string
  description: string
  // Fonction pour pré-remplir les champs du formulaire
  applyTemplate: (currentValues: any) => any
  // Options d'affichage par défaut pour ce template
  defaultDisplayOptions: StatsDisplayOptions
  // Types de statistiques de carte disponibles pour ce template
  cardStatTypes?: string[]
}

/**
 * Liste de tous les templates disponibles
 * 
 * Récupère dynamiquement tous les templates depuis le registre de cartes
 * Cela permet d'ajouter de nouvelles cartes sans modifier ce fichier
 */
export const STATS_TEMPLATES: StatsTemplate[] = cardRegistry.getTemplates()

/**
 * Récupère un template par son ID
 * 
 * Utilise le registre de cartes pour trouver le template correspondant
 * 
 * @param id - ID du template à récupérer
 * @returns Le template ou undefined si non trouvé
 */
export function getTemplateById(id: string): StatsTemplate | undefined {
  return cardRegistry.getTemplate(id)
}

