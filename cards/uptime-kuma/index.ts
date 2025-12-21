/**
 * Carte Uptime Kuma - Export principal
 * 
 * Ce fichier définit la CardDefinition complète pour la carte Uptime Kuma
 * et l'enregistre automatiquement dans le registre de cartes
 */

import { cardRegistry } from '@/lib/card-registry'
import type { CardDefinition } from '@/lib/card-registry'
import type { StatsTemplate } from '@/lib/stats-templates'
import type { StatsDisplayOptions } from '@/lib/types'
import { UptimeKumaStatsPanel } from './panel'
// Note: Le handler API n'est pas importé ici car il utilise fs (côté serveur uniquement)
// Il sera chargé dynamiquement dans la route API

/**
 * Template de statistiques pour Uptime Kuma
 */
const uptimeKumaTemplate: StatsTemplate = {
  id: 'uptime-kuma',
  name: 'Uptime Kuma',
  description: 'Statistiques complètes pour Uptime Kuma (monitoring de disponibilité)',
  applyTemplate: (currentValues: any) => {
    return {
      ...currentValues,
      name: currentValues.name || 'Uptime Kuma',
      logo: currentValues.logo || 'Activity',
      logoType: currentValues.logoType || 'icon',
      statLabel: currentValues.statLabel || 'Monitors',
    }
  },
  defaultDisplayOptions: {
    showKPIs: true,
  },
  // Types de stats de carte disponibles pour Uptime Kuma
  cardStatTypes: ['number', 'chart'],
}

/**
 * Définition complète de la carte Uptime Kuma
 */
const uptimeKumaCard: CardDefinition = {
  id: 'uptime-kuma',
  name: 'Uptime Kuma',
  description: 'Statistiques complètes pour Uptime Kuma (monitoring de disponibilité)',
  template: uptimeKumaTemplate,
  // Le handler API sera chargé dynamiquement dans la route API
  // Ne pas l'importer ici car il utilise fs (côté serveur uniquement)
  apiRouteHandler: undefined, // Sera chargé dynamiquement
  statsPanelComponent: UptimeKumaStatsPanel,
  cardStatComponents: {},
  cardStatTypes: ['number', 'chart'],
  // Clés de statistiques disponibles pour Uptime Kuma
  availableStatKeys: [
    { value: 'totalMonitors', label: 'Total Monitors' },
    { value: 'activeMonitors', label: 'Monitors Actifs' },
    { value: 'downMonitors', label: 'Monitors Inactifs' },
    { value: 'averageUptime24h', label: 'Uptime Moyen 24h' },
    { value: 'averageUptime7d', label: 'Uptime Moyen 7j' },
    { value: 'averageResponseTime', label: 'Temps de Réponse Moyen' },
    { value: 'certificatesExpiring', label: 'Certificats Expirant' },
  ],
  types: {},
}

// Enregistrer automatiquement la carte dans le registre
cardRegistry.register(uptimeKumaCard)

// Exporter la définition pour utilisation externe si nécessaire
export default uptimeKumaCard
export { uptimeKumaCard, uptimeKumaTemplate }

