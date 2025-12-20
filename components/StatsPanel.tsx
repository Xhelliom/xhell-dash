/**
 * Composant StatsPanel générique
 * 
 * Route vers le bon composant de statistiques selon le templateId de l'application
 * Utilise le registre de cartes pour charger dynamiquement les composants
 */

'use client'

// Importer toutes les cartes pour qu'elles s'enregistrent
// Cela garantit que le registre est peuplé
import '@/cards'

import { cardRegistry } from '@/lib/card-registry'
import type { StatsPanelProps as CardStatsPanelProps } from '@/lib/card-registry'

interface StatsPanelProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    appId: string
    appName: string
    templateId?: string
}

/**
 * Composant générique qui route vers le bon panneau de stats selon le templateId
 * Utilise le registre de cartes pour charger dynamiquement le composant
 */
export function StatsPanel({ open, onOpenChange, appId, appName, templateId }: StatsPanelProps) {
    // Si aucun templateId n'est fourni, ne rien afficher
    if (!templateId) {
        return null
    }

    // Récupérer la carte depuis le registre
    const card = cardRegistry.get(templateId)

    // Si la carte n'existe pas ou n'a pas de composant de panneau, ne rien afficher
    if (!card || !card.statsPanelComponent) {
        console.warn(
            `[StatsPanel] Aucun panneau de statistiques trouvé pour le template "${templateId}"`
        )
        return null
    }

    // Récupérer le composant de panneau de la carte
    const StatsPanelComponent = card.statsPanelComponent

    // Props standardisées pour tous les panneaux de stats
    const panelProps: CardStatsPanelProps = {
        open,
        onOpenChange,
        appId,
        appName,
    }

    // Rendre le composant de la carte
    return <StatsPanelComponent {...panelProps} />
}

