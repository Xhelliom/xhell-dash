/**
 * Carte Proxmox - Export principal
 * 
 * Ce fichier définit la CardDefinition complète pour la carte Proxmox
 * et l'enregistre automatiquement dans le registre de cartes
 */

import { cardRegistry } from '@/lib/card-registry'
import type { CardDefinition } from '@/lib/card-registry'
import type { StatsTemplate } from '@/lib/stats-templates'
import type { StatsDisplayOptions } from '@/lib/types'
import { ProxmoxStatsPanel } from './panel'
// Note: Le handler API n'est pas importé ici car il utilise fs (côté serveur uniquement)
// Il sera chargé dynamiquement dans la route API

/**
 * Template de statistiques pour Proxmox
 */
const proxmoxTemplate: StatsTemplate = {
  id: 'proxmox',
  name: 'Proxmox',
  description: 'Statistiques complètes pour Proxmox (virtualisation)',
  applyTemplate: (currentValues: any) => {
    return {
      ...currentValues,
      name: currentValues.name || 'Proxmox',
      logo: currentValues.logo || 'Server',
      logoType: currentValues.logoType || 'icon',
      statLabel: currentValues.statLabel || 'VMs',
    }
  },
  defaultDisplayOptions: {
    showKPIs: true,
  },
  // Types de stats de carte disponibles pour Proxmox
  cardStatTypes: ['number', 'chart'],
}

/**
 * Définition complète de la carte Proxmox
 */
const proxmoxCard: CardDefinition = {
  id: 'proxmox',
  name: 'Proxmox',
  description: 'Statistiques complètes pour Proxmox (virtualisation)',
  template: proxmoxTemplate,
  // Le handler API sera chargé dynamiquement dans la route API
  // Ne pas l'importer ici car il utilise fs (côté serveur uniquement)
  apiRouteHandler: undefined, // Sera chargé dynamiquement
  statsPanelComponent: ProxmoxStatsPanel,
  cardStatComponents: {},
  cardStatTypes: ['number', 'chart'],
  // Clés de statistiques disponibles pour Proxmox
  availableStatKeys: [
    { value: 'totalNodes', label: 'Total Nœuds' },
    { value: 'totalVMs', label: 'Total VMs' },
    { value: 'totalContainers', label: 'Total Containers' },
    { value: 'activeVMs', label: 'VMs Actives' },
    { value: 'cpuUsage', label: 'Utilisation CPU' },
    { value: 'memoryUsage', label: 'Utilisation Mémoire' },
  ],
  types: {},
}

// Enregistrer automatiquement la carte dans le registre
cardRegistry.register(proxmoxCard)

// Exporter la définition pour utilisation externe si nécessaire
export default proxmoxCard
export { proxmoxCard, proxmoxTemplate }

