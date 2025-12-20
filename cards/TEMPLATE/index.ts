/**
 * Carte Template - Export principal
 * 
 * INSTRUCTIONS :
 * 1. Remplacez "Template" par le nom de votre carte (ex: "Sonarr", "Radarr")
 * 2. Remplacez "template" par l'ID de votre carte (ex: "sonarr", "radarr")
 * 3. Adaptez le template selon vos besoins
 * 4. Enregistrez votre carte dans cards/index.ts
 * 
 * Ce fichier définit la CardDefinition complète pour votre carte
 * et l'enregistre automatiquement dans le registre de cartes
 */

import { cardRegistry } from '@/lib/card-registry'
import type { CardDefinition } from '@/lib/card-registry'
import type { StatsTemplate, StatsDisplayOptions } from '@/lib/types'
import { TemplateStatsPanel } from './panel'
import { TemplateRecentItems } from './card-stat'
// Note: Le handler API n'est pas importé ici car il utilise fs (côté serveur uniquement)
// Il sera chargé dynamiquement dans la route API

/**
 * Template de statistiques pour votre carte
 * 
 * Adaptez cette configuration selon vos besoins :
 * - name : nom affiché dans l'interface
 * - description : description affichée dans le formulaire
 * - applyTemplate : pré-remplit les champs du formulaire
 * - defaultDisplayOptions : options d'affichage par défaut
 * - cardStatTypes : types de stats de carte disponibles
 */
const templateTemplate: StatsTemplate = {
  id: 'template', // ID unique de votre carte (doit correspondre au nom du dossier)
  name: 'Template', // Nom affiché
  description: 'Description de votre carte', // Description affichée dans le formulaire
  applyTemplate: (currentValues) => {
    // Pré-remplit les champs du formulaire lors de la sélection du template
    return {
      ...currentValues,
      name: currentValues.name || 'Template', // Nom par défaut
      logo: currentValues.logo || 'Grid3x3', // Icône Lucide par défaut
      logoType: currentValues.logoType || 'icon',
      statLabel: currentValues.statLabel || 'Éléments', // Libellé par défaut
    }
  },
  defaultDisplayOptions: {
    showKPIs: true, // Afficher les KPI par défaut
    // Ajoutez d'autres options selon vos besoins
  },
  // Types de stats de carte disponibles
  // 'number' et 'chart' sont toujours disponibles
  // Ajoutez vos types custom ici (ex: 'template-recent')
  cardStatTypes: ['number', 'chart', 'template-recent'],
}

/**
 * Définition complète de votre carte
 * 
 * Tous les champs sont optionnels sauf id, name, description et template
 */
const templateCard: CardDefinition = {
  // ID unique de la carte (doit correspondre au nom du dossier et à l'ID du template)
  id: 'template',
  
  // Nom et description
  name: 'Template',
  description: 'Description de votre carte',
  
  // Template de statistiques
  template: templateTemplate,
  
  // Le handler API sera chargé dynamiquement dans la route API
  // Ne pas l'importer ici car il utilise fs (côté serveur uniquement)
  apiRouteHandler: undefined, // Sera chargé dynamiquement
  
  // Composant React pour le panneau de stats détaillées (optionnel mais recommandé)
  // Si non fourni, aucun panneau ne sera affiché
  statsPanelComponent: TemplateStatsPanel,
  
  // Composants personnalisés pour les stats de carte (optionnel)
  // Map des customType vers leurs composants React
  // Ex: { 'template-recent': TemplateRecentItems }
  cardStatComponents: {
    'template-recent': TemplateRecentItems,
  },
  
  // Types de stats de carte disponibles
  // Doit correspondre à cardStatTypes du template
  cardStatTypes: ['number', 'chart', 'template-recent'],
  
  // Types TypeScript exportés (optionnel)
  // Peuvent être utilisés pour étendre les types globaux si nécessaire
  types: {},
}

// Enregistrer automatiquement la carte dans le registre
// Cette ligne est OBLIGATOIRE pour que votre carte soit disponible
cardRegistry.register(templateCard)

// Exporter la définition pour utilisation externe si nécessaire
export default templateCard
export { templateCard, templateTemplate }

