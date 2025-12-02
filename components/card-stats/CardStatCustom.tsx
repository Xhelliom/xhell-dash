/**
 * Composant CardStatCustom
 * 
 * Renderer pour les types custom de statistiques de carte
 * Route vers les composants spécifiques selon le customType
 */

'use client'

import { PlexRecentImages } from '@/components/PlexRecentImages'
import type { App, CardStatConfig } from '@/lib/types'

interface CardStatCustomProps {
  app: App
  customType?: string
  config: CardStatConfig
}

export function CardStatCustom({ app, customType, config }: CardStatCustomProps) {
  // Router vers le bon composant selon le customType
  switch (customType) {
    case 'plex-recent':
      return (
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">
            {config.label || 'Derniers ajouts'}
          </span>
          <PlexRecentImages appId={app.id} />
        </div>
      )
    
    // Ajouter d'autres types custom ici :
    // case 'sonarr-queue':
    //   return <SonarrQueueImages appId={app.id} />
    
    default:
      return null
  }
}

