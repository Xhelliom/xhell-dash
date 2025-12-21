/**
 * Carte TrueNAS - Export principal
 * 
 * Ce fichier définit la CardDefinition complète pour la carte TrueNAS
 * et l'enregistre automatiquement dans le registre de cartes
 */

import { cardRegistry } from '@/lib/card-registry'
import type { CardDefinition } from '@/lib/card-registry'
import type { StatsTemplate } from '@/lib/stats-templates'
import type { StatsDisplayOptions } from '@/lib/types'
import { TrueNASStatsPanel } from './panel'
// Note: Le handler API n'est pas importé ici car il utilise fs (côté serveur uniquement)
// Il sera chargé dynamiquement dans la route API

/**
 * Template de statistiques pour TrueNAS
 */
const truenasTemplate: StatsTemplate = {
  id: 'truenas',
  name: 'TrueNAS',
  description: 'Statistiques complètes pour TrueNAS (système de stockage NAS)',
  applyTemplate: (currentValues: any) => {
    return {
      ...currentValues,
      name: currentValues.name || 'TrueNAS',
      logo: currentValues.logo || 'HardDrive',
      logoType: currentValues.logoType || 'icon',
      statLabel: currentValues.statLabel || 'Stockage',
    }
  },
  defaultDisplayOptions: {
    showKPIs: true,
  },
  // Types de stats de carte disponibles pour TrueNAS
  cardStatTypes: ['number', 'chart'],
}

/**
 * Définition complète de la carte TrueNAS
 */
const truenasCard: CardDefinition = {
  id: 'truenas',
  name: 'TrueNAS',
  description: 'Statistiques complètes pour TrueNAS (système de stockage NAS)',
  template: truenasTemplate,
  // Le handler API sera chargé dynamiquement dans la route API
  // Ne pas l'importer ici car il utilise fs (côté serveur uniquement)
  apiRouteHandler: undefined, // Sera chargé dynamiquement
  statsPanelComponent: TrueNASStatsPanel,
  cardStatComponents: {},
  cardStatTypes: ['number', 'chart'],
  // Clés de statistiques disponibles pour TrueNAS
  availableStatKeys: [
    { value: 'cpuUsage', label: 'Utilisation CPU' },
    { value: 'memoryUsage', label: 'Utilisation Mémoire' },
    { value: 'diskTotal', label: 'Espace Disque Total' },
    { value: 'diskUsed', label: 'Espace Disque Utilisé' },
    { value: 'activePools', label: 'Pools Actifs' },
    { value: 'activeServices', label: 'Services Actifs' },
  ],
  types: {},
}

// Enregistrer automatiquement la carte dans le registre
cardRegistry.register(truenasCard)

// Exporter la définition pour utilisation externe si nécessaire
export default truenasCard
export { truenasCard, truenasTemplate }

