/**
 * Carte Générique - Export principal
 * 
 * Cette carte gère les statistiques basiques depuis une API externe
 * Elle utilise statApiUrl et statLabel pour récupérer et afficher les données
 */

import { cardRegistry } from '@/lib/card-registry'
import type { CardDefinition } from '@/lib/card-registry'
import type { StatsTemplate } from '@/lib/stats-templates'
import type { StatsDisplayOptions } from '@/lib/types'
import { GenericStatsPanel } from './panel'
// Note: Le handler API n'est pas importé ici car il utilise fs (côté serveur uniquement)
// Il sera chargé dynamiquement dans la route API

/**
 * Template de statistiques pour la carte générique
 */
const genericTemplate: StatsTemplate = {
  id: 'generic',
  name: 'Générique',
  description: 'Statistiques depuis une API externe',
  applyTemplate: (currentValues: any) => {
    // Ne pré-remplit aucun champ - l'utilisateur configure tout manuellement
    return {
      ...currentValues,
    }
  },
  defaultDisplayOptions: {
    showKPIs: true,
    // Pas d'options spécifiques pour la carte générique
  },
  // Types de stats de carte disponibles : uniquement number et chart
  cardStatTypes: ['number', 'chart'],
}

/**
 * Définition complète de la carte générique
 */
const genericCard: CardDefinition = {
  id: 'generic',
  name: 'Générique',
  description: 'Statistiques depuis une API externe',
  template: genericTemplate,
  // Le handler API sera chargé dynamiquement dans la route API
  // Ne pas l'importer ici car il utilise fs (côté serveur uniquement)
  apiRouteHandler: undefined, // Sera chargé dynamiquement
  statsPanelComponent: GenericStatsPanel,
  // Pas de composants custom pour la carte générique
  cardStatComponents: {},
  cardStatTypes: ['number', 'chart'],
  // Clés de statistiques disponibles pour la carte générique
  // Clés génériques communes pour les APIs externes
  availableStatKeys: [
    { value: 'value', label: 'Valeur' },
    { value: 'count', label: 'Compte' },
    { value: 'total', label: 'Total' },
    { value: 'items', label: 'Éléments' },
    { value: 'users', label: 'Utilisateurs' },
    { value: 'requests', label: 'Requêtes' },
  ],
  types: {},
}

// Enregistrer automatiquement la carte dans le registre
cardRegistry.register(genericCard)

// Exporter la définition pour utilisation externe si nécessaire
export default genericCard
export { genericCard, genericTemplate }

