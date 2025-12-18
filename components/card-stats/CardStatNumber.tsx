/**
 * Composant CardStatNumber
 * 
 * Affiche une statistique sous forme de nombre simple
 */

'use client'

import { useState, useEffect } from 'react'
import type { App, CardStatConfig, PlexStats } from '@/lib/types'

interface CardStatNumberProps {
  app: App
  config: CardStatConfig
}

export function CardStatNumber({ app, config }: CardStatNumberProps) {
  const [statValue, setStatValue] = useState<string | number | undefined>(app.statValue)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!config.key) return

    const fetchStats = async () => {
      setIsLoading(true)
      try {
        // Utiliser l'API générique ou Plex selon le template
        const endpoint = app.statsConfig?.templateId === 'plex'
          ? `/api/apps/${app.id}/stats/plex`
          : `/api/apps/${app.id}/stats`
        
        const response = await fetch(endpoint)
        if (response.ok) {
          const data = await response.json()
          const value = (data as any)[config.key!] || 
                       (typeof data === 'number' ? data : 
                       data.value || data.count || data.total)
          setStatValue(value)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()

    // Rafraîchir toutes les 10 minutes (600000 ms) pour éviter les artefacts visuels
    const interval = setInterval(fetchStats, 600000)
    return () => clearInterval(interval)
  }, [app.id, config.key, app.statsConfig?.templateId])

  return (
    <div className="flex items-baseline gap-2">
      <span className="text-sm text-muted-foreground">
        {config.label || app.statLabel || 'Statistique'}:
      </span>
      {isLoading ? (
        <span className="text-sm text-muted-foreground">...</span>
      ) : (
        <span className="text-lg font-semibold">{statValue ?? 'N/A'}</span>
      )}
    </div>
  )
}

