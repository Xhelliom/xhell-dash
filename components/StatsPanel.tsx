/**
 * Composant StatsPanel générique
 * 
 * Route vers le bon composant de statistiques selon le templateId de l'application
 * Permet d'ajouter facilement de nouveaux templates de stats sans modifier AppCard
 */

'use client'

import { PlexStatsPanel } from './PlexStatsPanel'
import type { App } from '@/lib/types'

interface StatsPanelProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    appId: string
    appName: string
    templateId?: string
}

/**
 * Composant générique qui route vers le bon panneau de stats selon le templateId
 */
export function StatsPanel({ open, onOpenChange, appId, appName, templateId }: StatsPanelProps) {
    // Router vers le bon composant selon le templateId
    switch (templateId) {
        case 'plex':
            return (
                <PlexStatsPanel
                    open={open}
                    onOpenChange={onOpenChange}
                    appId={appId}
                    appName={appName}
                />
            )

        // Ajouter d'autres templates ici
        // case 'sonarr':
        //   return <SonarrStatsPanel ... />
        // case 'radarr':
        //   return <RadarrStatsPanel ... />

        default:
            // Si aucun template n'est reconnu, ne rien afficher
            return null
    }
}

