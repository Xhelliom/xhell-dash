/**
 * Registre central des cartes modulaires
 * 
 * Ce fichier définit l'interface standardisée pour les cartes et le registre
 * qui permet de charger et d'utiliser les cartes de manière dynamique.
 */

import type { StatsTemplate, StatsDisplayOptions } from './types'
import type { NextRequest, NextResponse } from 'next/server'
import type { ComponentType } from 'react'

/**
 * Interface pour un composant de panneau de statistiques
 * Les props standardisées sont : open, onOpenChange, appId, appName
 */
export interface StatsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appId: string
  appName: string
}

/**
 * Interface pour un composant de statistique de carte personnalisé
 * Les props standardisées sont : app, customType, config
 */
export interface CardStatComponentProps {
  app: any // Type App depuis types.ts
  customType?: string
  config: any // CardStatConfig depuis types.ts
}

/**
 * Handler pour une route API de statistiques
 * Prend les paramètres de la route Next.js et retourne une NextResponse
 */
export type ApiRouteHandler = (
  request: NextRequest,
  params: { params: Promise<{ id: string }> }
) => Promise<NextResponse>

/**
 * Définition complète d'une carte modulaire
 * 
 * Chaque carte doit exporter cette interface depuis son index.ts
 */
export interface CardDefinition {
  /**
   * Identifiant unique de la carte (ex: 'plex', 'sonarr')
   * Doit correspondre au nom du dossier dans cards/
   */
  id: string

  /**
   * Nom affiché de la carte
   */
  name: string

  /**
   * Description de la carte
   */
  description: string

  /**
   * Template de statistiques pour cette carte
   * Définit les options par défaut et la configuration
   */
  template: StatsTemplate

  /**
   * Handler pour la route API des statistiques
   * Gère GET /api/apps/[id]/stats/[templateId]
   * Si non fourni, la route générique sera utilisée
   */
  apiRouteHandler?: ApiRouteHandler

  /**
   * Composant React pour le panneau de statistiques détaillées
   * Affiche les stats complètes dans un Sheet/Modal
   * Si non fourni, aucun panneau ne sera affiché
   */
  statsPanelComponent?: ComponentType<StatsPanelProps>

  /**
   * Composants personnalisés pour les statistiques de carte
   * Map des customType vers leurs composants React
   * Ex: { 'plex-recent': PlexRecentImages }
   */
  cardStatComponents?: Record<string, ComponentType<CardStatComponentProps>>

  /**
   * Types de statistiques de carte disponibles pour cette carte
   * Inclut les types communs ('number', 'chart') + les types custom
   */
  cardStatTypes?: string[]

  /**
   * Types TypeScript exportés par cette carte
   * Permet d'étendre les types globaux si nécessaire
   */
  types?: Record<string, any>
}

/**
 * Registre central des cartes
 * Stocke toutes les cartes chargées par leur ID
 */
class CardRegistry {
  private cards: Map<string, CardDefinition> = new Map()

  /**
   * Enregistre une nouvelle carte dans le registre
   * 
   * @param card - Définition de la carte à enregistrer
   * @throws Error si une carte avec le même ID existe déjà
   */
  register(card: CardDefinition): void {
    if (this.cards.has(card.id)) {
      throw new Error(`Une carte avec l'ID "${card.id}" est déjà enregistrée`)
    }

    // Valider que l'ID correspond au templateId
    if (card.template.id !== card.id) {
      throw new Error(
        `L'ID de la carte ("${card.id}") doit correspondre à l'ID du template ("${card.template.id}")`
      )
    }

    this.cards.set(card.id, card)
  }

  /**
   * Récupère une carte par son ID
   * 
   * @param id - ID de la carte à récupérer
   * @returns La définition de la carte ou undefined si non trouvée
   */
  get(id: string): CardDefinition | undefined {
    return this.cards.get(id)
  }

  /**
   * Récupère toutes les cartes enregistrées
   * 
   * @returns Tableau de toutes les définitions de cartes
   */
  getAll(): CardDefinition[] {
    return Array.from(this.cards.values())
  }

  /**
   * Vérifie si une carte est enregistrée
   * 
   * @param id - ID de la carte à vérifier
   * @returns true si la carte existe, false sinon
   */
  has(id: string): boolean {
    return this.cards.has(id)
  }

  /**
   * Récupère tous les templates de statistiques depuis les cartes
   * 
   * @returns Tableau de tous les templates
   */
  getTemplates(): StatsTemplate[] {
    return this.getAll().map((card) => card.template)
  }

  /**
   * Récupère un template par son ID
   * 
   * @param id - ID du template à récupérer
   * @returns Le template ou undefined si non trouvé
   */
  getTemplate(id: string): StatsTemplate | undefined {
    return this.get(id)?.template
  }

  /**
   * Récupère tous les types de statistiques de carte disponibles
   * Agrège les types de toutes les cartes
   * 
   * @param cardId - ID optionnel d'une carte spécifique
   * @returns Tableau de tous les types disponibles
   */
  getCardStatTypes(cardId?: string): string[] {
    if (cardId) {
      const card = this.get(cardId)
      return card?.cardStatTypes || []
    }

    // Agrégation de tous les types de toutes les cartes
    const allTypes = new Set<string>()
    this.getAll().forEach((card) => {
      card.cardStatTypes?.forEach((type) => allTypes.add(type))
    })
    return Array.from(allTypes)
  }

  /**
   * Récupère un composant de statistique de carte personnalisé
   * 
   * @param cardId - ID de la carte
   * @param customType - Type custom de la statistique
   * @returns Le composant React ou undefined si non trouvé
   */
  getCardStatComponent(
    cardId: string,
    customType: string
  ): ComponentType<CardStatComponentProps> | undefined {
    const card = this.get(cardId)
    return card?.cardStatComponents?.[customType]
  }

  /**
   * Vide le registre (utile pour les tests)
   */
  clear(): void {
    this.cards.clear()
  }
}

/**
 * Instance singleton du registre de cartes
 * Utilisée dans toute l'application pour accéder aux cartes
 */
export const cardRegistry = new CardRegistry()

