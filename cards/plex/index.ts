/**
 * Carte Plex - Export principal
 * 
 * Ce fichier définit la CardDefinition complète pour la carte Plex
 * et l'enregistre automatiquement dans le registre de cartes
 */

import { cardRegistry } from '@/lib/card-registry'
import type { CardDefinition } from '@/lib/card-registry'
import type { StatsTemplate } from '@/lib/stats-templates'
import type { StatsDisplayOptions } from '@/lib/types'
import { PlexStatsPanel } from './panel'
import { PlexRecentImages } from './card-stat'
// Note: Le handler API n'est pas importé ici car il utilise fs (côté serveur uniquement)
// Il sera chargé dynamiquement dans la route API

/**
 * Template de statistiques pour Plex
 */
const plexTemplate: StatsTemplate = {
  id: 'plex',
  name: 'Plex',
  description: 'Statistiques complètes pour Plex Media Server',
  applyTemplate: (currentValues: any) => {
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
  cardStatTypes: ['number', 'chart', 'plex-recent'],
}

/**
 * Définition complète de la carte Plex
 */
const plexCard: CardDefinition = {
  id: 'plex',
  name: 'Plex',
  description: 'Statistiques complètes pour Plex Media Server',
  template: plexTemplate,
  // Le handler API sera chargé dynamiquement dans la route API
  // Ne pas l'importer ici car il utilise fs (côté serveur uniquement)
  apiRouteHandler: undefined, // Sera chargé dynamiquement
  statsPanelComponent: PlexStatsPanel,
  cardStatComponents: {
    'plex-recent': PlexRecentImages,
  },
  cardStatTypes: ['number', 'chart', 'plex-recent'],
  // Clés de statistiques disponibles pour Plex
  availableStatKeys: [
    { value: 'totalMovies', label: 'Total Films' },
    { value: 'totalShows', label: 'Total Séries' },
    { value: 'totalEpisodes', label: 'Total Épisodes' },
    { value: 'totalUsers', label: 'Total Utilisateurs' },
    { value: 'totalLibraries', label: 'Total Bibliothèques' },
  ],
  types: {
    // Types exportés par cette carte (optionnel)
    // Peuvent être utilisés pour étendre les types globaux si nécessaire
  },
}

// Enregistrer automatiquement la carte dans le registre
cardRegistry.register(plexCard)

// Exporter la définition pour utilisation externe si nécessaire
export default plexCard
export { plexCard, plexTemplate }

