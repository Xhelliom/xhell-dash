/**
 * Carte Sonarr - Export principal
 * 
 * Ce fichier définit la CardDefinition complète pour la carte Sonarr
 * et l'enregistre automatiquement dans le registre de cartes
 */

import { cardRegistry } from '@/lib/card-registry'
import type { CardDefinition } from '@/lib/card-registry'
import type { StatsTemplate } from '@/lib/stats-templates'
import type { StatsDisplayOptions } from '@/lib/types'
import { SonarrStatsPanel } from './panel'
// Note: Le handler API n'est pas importé ici car il utilise fs (côté serveur uniquement)
// Il sera chargé dynamiquement dans la route API

/**
 * Template de statistiques pour Sonarr
 */
const sonarrTemplate: StatsTemplate = {
  id: 'sonarr',
  name: 'Sonarr',
  description: 'Statistiques complètes pour Sonarr (gestion de séries TV)',
  applyTemplate: (currentValues: any) => {
    return {
      ...currentValues,
      name: currentValues.name || 'Sonarr',
      logo: currentValues.logo || 'Tv',
      logoType: currentValues.logoType || 'icon',
      statLabel: currentValues.statLabel || 'Séries',
    }
  },
  defaultDisplayOptions: {
    showKPIs: true,
  },
  // Types de stats de carte disponibles pour Sonarr
  cardStatTypes: ['number', 'chart'],
}

/**
 * Définition complète de la carte Sonarr
 */
const sonarrCard: CardDefinition = {
  id: 'sonarr',
  name: 'Sonarr',
  description: 'Statistiques complètes pour Sonarr (gestion de séries TV)',
  template: sonarrTemplate,
  // Le handler API sera chargé dynamiquement dans la route API
  // Ne pas l'importer ici car il utilise fs (côté serveur uniquement)
  apiRouteHandler: undefined, // Sera chargé dynamiquement
  statsPanelComponent: SonarrStatsPanel,
  cardStatComponents: {},
  cardStatTypes: ['number', 'chart'],
  // Clés de statistiques disponibles pour Sonarr
  availableStatKeys: [
    { value: 'totalSeries', label: 'Total Séries' },
    { value: 'totalEpisodes', label: 'Total Épisodes' },
    { value: 'queuePending', label: 'Queue en attente' },
    { value: 'queueDownloading', label: 'Queue en téléchargement' },
    { value: 'upcomingEpisodes', label: 'Prochains épisodes' },
  ],
  types: {},
}

// Enregistrer automatiquement la carte dans le registre
cardRegistry.register(sonarrCard)

// Exporter la définition pour utilisation externe si nécessaire
export default sonarrCard
export { sonarrCard, sonarrTemplate }

