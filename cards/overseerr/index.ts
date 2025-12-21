/**
 * Carte Overseerr - Export principal
 * 
 * Ce fichier définit la CardDefinition complète pour la carte Overseerr
 * et l'enregistre automatiquement dans le registre de cartes
 */

import { cardRegistry } from '@/lib/card-registry'
import type { CardDefinition } from '@/lib/card-registry'
import type { StatsTemplate } from '@/lib/stats-templates'
import type { StatsDisplayOptions } from '@/lib/types'
import { OverseerrStatsPanel } from './panel'
// Note: Le handler API n'est pas importé ici car il utilise fs (côté serveur uniquement)
// Il sera chargé dynamiquement dans la route API

/**
 * Template de statistiques pour Overseerr
 */
const overseerrTemplate: StatsTemplate = {
  id: 'overseerr',
  name: 'Overseerr',
  description: 'Statistiques complètes pour Overseerr (gestion de demandes de médias)',
  applyTemplate: (currentValues: any) => {
    return {
      ...currentValues,
      name: currentValues.name || 'Overseerr',
      logo: currentValues.logo || 'Download',
      logoType: currentValues.logoType || 'icon',
      statLabel: currentValues.statLabel || 'Demandes',
    }
  },
  defaultDisplayOptions: {
    showKPIs: true,
  },
  // Types de stats de carte disponibles pour Overseerr
  cardStatTypes: ['number', 'chart'],
}

/**
 * Définition complète de la carte Overseerr
 */
const overseerrCard: CardDefinition = {
  id: 'overseerr',
  name: 'Overseerr',
  description: 'Statistiques complètes pour Overseerr (gestion de demandes de médias)',
  template: overseerrTemplate,
  // Le handler API sera chargé dynamiquement dans la route API
  // Ne pas l'importer ici car il utilise fs (côté serveur uniquement)
  apiRouteHandler: undefined, // Sera chargé dynamiquement
  statsPanelComponent: OverseerrStatsPanel,
  cardStatComponents: {},
  cardStatTypes: ['number', 'chart'],
  // Clés de statistiques disponibles pour Overseerr
  availableStatKeys: [
    { value: 'totalRequests', label: 'Total Demandes' },
    { value: 'pendingRequests', label: 'Demandes en Attente' },
    { value: 'approvedRequests', label: 'Demandes Approuvées' },
    { value: 'processingRequests', label: 'Demandes en Traitement' },
    { value: 'availableMedia', label: 'Médias Disponibles' },
    { value: 'totalMovies', label: 'Total Films' },
    { value: 'totalTvShows', label: 'Total Séries' },
    { value: 'totalUsers', label: 'Total Utilisateurs' },
  ],
  types: {},
}

// Enregistrer automatiquement la carte dans le registre
cardRegistry.register(overseerrCard)

// Exporter la définition pour utilisation externe si nécessaire
export default overseerrCard
export { overseerrCard, overseerrTemplate }

