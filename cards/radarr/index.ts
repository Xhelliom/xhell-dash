/**
 * Carte Radarr - Export principal
 * 
 * Ce fichier définit la CardDefinition complète pour la carte Radarr
 * et l'enregistre automatiquement dans le registre de cartes
 */

import { cardRegistry } from '@/lib/card-registry'
import type { CardDefinition } from '@/lib/card-registry'
import type { StatsTemplate } from '@/lib/stats-templates'
import type { StatsDisplayOptions } from '@/lib/types'
import { RadarrStatsPanel } from './panel'
// Note: Le handler API n'est pas importé ici car il utilise fs (côté serveur uniquement)
// Il sera chargé dynamiquement dans la route API

/**
 * Template de statistiques pour Radarr
 */
const radarrTemplate: StatsTemplate = {
  id: 'radarr',
  name: 'Radarr',
  description: 'Statistiques complètes pour Radarr (gestion de films)',
  applyTemplate: (currentValues: any) => {
    return {
      ...currentValues,
      name: currentValues.name || 'Radarr',
      logo: currentValues.logo || 'Film',
      logoType: currentValues.logoType || 'icon',
      statLabel: currentValues.statLabel || 'Films',
    }
  },
  defaultDisplayOptions: {
    showKPIs: true,
  },
  // Types de stats de carte disponibles pour Radarr
  cardStatTypes: ['number', 'chart'],
}

/**
 * Définition complète de la carte Radarr
 */
const radarrCard: CardDefinition = {
  id: 'radarr',
  name: 'Radarr',
  description: 'Statistiques complètes pour Radarr (gestion de films)',
  template: radarrTemplate,
  // Le handler API sera chargé dynamiquement dans la route API
  // Ne pas l'importer ici car il utilise fs (côté serveur uniquement)
  apiRouteHandler: undefined, // Sera chargé dynamiquement
  statsPanelComponent: RadarrStatsPanel,
  cardStatComponents: {},
  cardStatTypes: ['number', 'chart'],
  // Clés de statistiques disponibles pour Radarr
  availableStatKeys: [
    { value: 'totalMovies', label: 'Total Films' },
    { value: 'downloadedMovies', label: 'Films Téléchargés' },
    { value: 'queuePending', label: 'Queue en attente' },
    { value: 'queueDownloading', label: 'Queue en téléchargement' },
  ],
  types: {},
}

// Enregistrer automatiquement la carte dans le registre
cardRegistry.register(radarrCard)

// Exporter la définition pour utilisation externe si nécessaire
export default radarrCard
export { radarrCard, radarrTemplate }

