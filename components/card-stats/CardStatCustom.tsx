/**
 * Composant CardStatCustom
 * 
 * Renderer pour les types custom de statistiques de carte
 * Utilise le registre de cartes pour charger dynamiquement les composants
 */

'use client'

// Importer toutes les cartes pour qu'elles s'enregistrent
import '@/cards'

import { cardRegistry } from '@/lib/card-registry'
import type { App, CardStatConfig } from '@/lib/types'
import type { CardStatComponentProps } from '@/lib/card-registry'

interface CardStatCustomProps {
  app: App
  customType?: string
  config: CardStatConfig
}

/**
 * Trouve le composant de statistique de carte correspondant au customType
 * 
 * @param customType - Type custom de la statistique (ex: 'plex-recent')
 * @param templateId - ID du template de l'application (optionnel, pour optimisation)
 * @returns Le composant React ou undefined si non trouvé
 */
function findCardStatComponent(customType?: string, templateId?: string) {
  if (!customType) {
    return undefined
  }

  // Si on a le templateId, chercher directement dans cette carte
  if (templateId) {
    return cardRegistry.getCardStatComponent(templateId, customType)
  }

  // Sinon, parcourir toutes les cartes pour trouver celle qui a ce customType
  const allCards = cardRegistry.getAll()
  for (const card of allCards) {
    const component = card.cardStatComponents?.[customType]
    if (component) {
      return component
    }
  }

  return undefined
}

export function CardStatCustom({ app, customType, config }: CardStatCustomProps) {
  // Récupérer le templateId de l'application pour optimiser la recherche
  const templateId = app.statsConfig?.templateId

  // Trouver le composant correspondant au customType
  const Component = findCardStatComponent(customType, templateId)

  // Si aucun composant n'est trouvé, ne rien afficher
  if (!Component) {
    console.warn(
      `[CardStatCustom] Aucun composant trouvé pour le type custom "${customType}"`
    )
    return null
  }

  // Props standardisées pour tous les composants de stats de carte
  const componentProps: CardStatComponentProps = {
    app,
    customType,
    config,
  }

  // Rendre le composant de la carte
  return <Component {...componentProps} />
}

