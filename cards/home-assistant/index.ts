/**
 * Carte Home Assistant - Export principal
 * 
 * Ce fichier définit la CardDefinition complète pour la carte Home Assistant
 * et l'enregistre automatiquement dans le registre de cartes
 */

import { cardRegistry } from '@/lib/card-registry'
import type { CardDefinition } from '@/lib/card-registry'
import type { StatsTemplate } from '@/lib/stats-templates'
import type { StatsDisplayOptions } from '@/lib/types'
import { HomeAssistantStatsPanel } from './panel'
// Note: Le handler API n'est pas importé ici car il utilise fs (côté serveur uniquement)
// Il sera chargé dynamiquement dans la route API

/**
 * Template de statistiques pour Home Assistant
 */
const homeAssistantTemplate: StatsTemplate = {
  id: 'home-assistant',
  name: 'Home Assistant',
  description: 'Statistiques complètes pour Home Assistant (domotique)',
  applyTemplate: (currentValues: any) => {
    return {
      ...currentValues,
      name: currentValues.name || 'Home Assistant',
      logo: currentValues.logo || 'Home',
      logoType: currentValues.logoType || 'icon',
      statLabel: currentValues.statLabel || 'Entités',
    }
  },
  defaultDisplayOptions: {
    showKPIs: true,
  },
  // Types de stats de carte disponibles pour Home Assistant
  cardStatTypes: ['number', 'chart'],
}

/**
 * Définition complète de la carte Home Assistant
 */
const homeAssistantCard: CardDefinition = {
  id: 'home-assistant',
  name: 'Home Assistant',
  description: 'Statistiques complètes pour Home Assistant (domotique)',
  template: homeAssistantTemplate,
  // Le handler API sera chargé dynamiquement dans la route API
  // Ne pas l'importer ici car il utilise fs (côté serveur uniquement)
  apiRouteHandler: undefined, // Sera chargé dynamiquement
  statsPanelComponent: HomeAssistantStatsPanel,
  cardStatComponents: {},
  cardStatTypes: ['number', 'chart'],
  // Clés de statistiques disponibles pour Home Assistant
  availableStatKeys: [
    { value: 'totalEntities', label: 'Total Entités' },
    { value: 'activeEntities', label: 'Entités Actives' },
    { value: 'automationsActive', label: 'Automatisations Actives' },
    { value: 'recentChanges', label: 'Changements Récents' },
  ],
  types: {},
}

// Enregistrer automatiquement la carte dans le registre
cardRegistry.register(homeAssistantCard)

// Exporter la définition pour utilisation externe si nécessaire
export default homeAssistantCard
export { homeAssistantCard, homeAssistantTemplate }

