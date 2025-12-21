/**
 * Carte Kubernetes - Export principal
 * 
 * Ce fichier définit la CardDefinition complète pour la carte Kubernetes
 * et l'enregistre automatiquement dans le registre de cartes
 */

import { cardRegistry } from '@/lib/card-registry'
import type { CardDefinition } from '@/lib/card-registry'
import type { StatsTemplate } from '@/lib/stats-templates'
import type { StatsDisplayOptions } from '@/lib/types'
import { KubernetesStatsPanel } from './panel'
// Note: Le handler API n'est pas importé ici car il utilise fs (côté serveur uniquement)
// Il sera chargé dynamiquement dans la route API

/**
 * Template de statistiques pour Kubernetes
 */
const kubernetesTemplate: StatsTemplate = {
  id: 'kubernetes',
  name: 'Kubernetes',
  description: 'Statistiques complètes pour Kubernetes (orchestration de conteneurs)',
  applyTemplate: (currentValues: any) => {
    return {
      ...currentValues,
      name: currentValues.name || 'Kubernetes',
      logo: currentValues.logo || 'Server',
      logoType: currentValues.logoType || 'icon',
      statLabel: currentValues.statLabel || 'Pods',
    }
  },
  defaultDisplayOptions: {
    showKPIs: true,
  },
  // Types de stats de carte disponibles pour Kubernetes
  cardStatTypes: ['number', 'chart'],
}

/**
 * Définition complète de la carte Kubernetes
 */
const kubernetesCard: CardDefinition = {
  id: 'kubernetes',
  name: 'Kubernetes',
  description: 'Statistiques complètes pour Kubernetes (orchestration de conteneurs)',
  template: kubernetesTemplate,
  // Le handler API sera chargé dynamiquement dans la route API
  // Ne pas l'importer ici car il utilise fs (côté serveur uniquement)
  apiRouteHandler: undefined, // Sera chargé dynamiquement
  statsPanelComponent: KubernetesStatsPanel,
  cardStatComponents: {},
  cardStatTypes: ['number', 'chart'],
  // Clés de statistiques disponibles pour Kubernetes
  availableStatKeys: [
    { value: 'totalNodes', label: 'Total Nœuds' },
    { value: 'totalPods', label: 'Total Pods' },
    { value: 'runningPods', label: 'Pods en Cours' },
    { value: 'failedPods', label: 'Pods en Échec' },
    { value: 'cpuUsage', label: 'Utilisation CPU' },
    { value: 'memoryUsage', label: 'Utilisation Mémoire' },
  ],
  types: {},
}

// Enregistrer automatiquement la carte dans le registre
cardRegistry.register(kubernetesCard)

// Exporter la définition pour utilisation externe si nécessaire
export default kubernetesCard
export { kubernetesCard, kubernetesTemplate }

