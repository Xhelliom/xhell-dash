/**
 * Templates de statistiques préconfigurés
 * 
 * Ce fichier définit les templates disponibles pour les statistiques
 * Chaque template peut être sélectionné dans le formulaire et pré-remplit les champs appropriés
 */

import type { StatsDisplayOptions } from './types'
import { getCardStatTypes } from './card-stat-types'

/**
 * Interface pour un template de statistiques
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
 * Template Plex
 */
const plexTemplate: StatsTemplate = {
  id: 'plex',
  name: 'Plex',
  description: 'Statistiques complètes pour Plex Media Server',
  applyTemplate: (currentValues) => {
    return {
      ...currentValues,
      name: currentValues.name || 'Plex',
      logo: currentValues.logo || 'Plex',
      logoType: currentValues.logoType || 'icon',
      statLabel: currentValues.statLabel || 'Bibliothèque',
    }
  },
  defaultDisplayOptions: {
    showKPIs: true,
    showLibraryChart: true,
    showRecentMedia: true,
    // Options spécifiques pour les KPI
    kpiOptions: {
      showMovies: true,
      showShows: true,
      showEpisodes: true,
      showUsers: true,
      showLibraries: true,
    },
  },
  // Types de stats de carte disponibles pour Plex
  cardStatTypes: getCardStatTypes('plex'),
}

/**
 * Liste de tous les templates disponibles
 */
export const STATS_TEMPLATES: StatsTemplate[] = [
  plexTemplate,
  // Ajouter d'autres templates ici (Sonarr, Radarr, etc.)
]

/**
 * Récupère un template par son ID
 */
export function getTemplateById(id: string): StatsTemplate | undefined {
  return STATS_TEMPLATES.find((t) => t.id === id)
}

