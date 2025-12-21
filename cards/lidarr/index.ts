/**
 * Carte Lidarr - Export principal
 * 
 * Ce fichier définit la CardDefinition complète pour la carte Lidarr
 * et l'enregistre automatiquement dans le registre de cartes
 */

import { cardRegistry } from '@/lib/card-registry'
import type { CardDefinition } from '@/lib/card-registry'
import type { StatsTemplate } from '@/lib/stats-templates'
import type { StatsDisplayOptions } from '@/lib/types'
import { LidarrStatsPanel } from './panel'
// Note: Le handler API n'est pas importé ici car il utilise fs (côté serveur uniquement)
// Il sera chargé dynamiquement dans la route API

/**
 * Template de statistiques pour Lidarr
 */
const lidarrTemplate: StatsTemplate = {
  id: 'lidarr',
  name: 'Lidarr',
  description: 'Statistiques complètes pour Lidarr (gestion de musique)',
  applyTemplate: (currentValues: any) => {
    return {
      ...currentValues,
      name: currentValues.name || 'Lidarr',
      logo: currentValues.logo || 'Music',
      logoType: currentValues.logoType || 'icon',
      statLabel: currentValues.statLabel || 'Artistes',
    }
  },
  defaultDisplayOptions: {
    showKPIs: true,
  },
  // Types de stats de carte disponibles pour Lidarr
  cardStatTypes: ['number', 'chart'],
}

/**
 * Définition complète de la carte Lidarr
 */
const lidarrCard: CardDefinition = {
  id: 'lidarr',
  name: 'Lidarr',
  description: 'Statistiques complètes pour Lidarr (gestion de musique)',
  template: lidarrTemplate,
  // Le handler API sera chargé dynamiquement dans la route API
  // Ne pas l'importer ici car il utilise fs (côté serveur uniquement)
  apiRouteHandler: undefined, // Sera chargé dynamiquement
  statsPanelComponent: LidarrStatsPanel,
  cardStatComponents: {},
  cardStatTypes: ['number', 'chart'],
  // Clés de statistiques disponibles pour Lidarr
  availableStatKeys: [
    { value: 'totalArtists', label: 'Total Artistes' },
    { value: 'totalAlbums', label: 'Total Albums' },
    { value: 'downloadedAlbums', label: 'Albums Téléchargés' },
    { value: 'queuePending', label: 'Queue en attente' },
  ],
  types: {},
}

// Enregistrer automatiquement la carte dans le registre
cardRegistry.register(lidarrCard)

// Exporter la définition pour utilisation externe si nécessaire
export default lidarrCard
export { lidarrCard, lidarrTemplate }

