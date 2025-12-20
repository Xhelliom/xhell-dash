/**
 * Composant pour les statistiques de carte personnalisées
 * 
 * Remplacez "Template" par le nom de votre carte
 * 
 * Ce composant est utilisé pour afficher des statistiques personnalisées
 * directement sur la carte (pas dans le panneau détaillé).
 * 
 * Exemple : afficher les 3 dernières images, une queue, etc.
 * 
 * Ce fichier est optionnel - ne le créez que si vous avez besoin
 * d'un type custom de statistique de carte (au-delà de 'number' et 'chart')
 */

'use client'

import { useState, useEffect } from 'react'
import type { CardStatComponentProps } from '@/lib/card-registry'
import type { TemplateRecentItem } from './types'

/**
 * Composant qui affiche les statistiques personnalisées sur la carte
 * 
 * Exemple : afficher les 3 derniers éléments
 */
export function TemplateRecentItems({ app, config }: CardStatComponentProps) {
  const [recentItems, setRecentItems] = useState<TemplateRecentItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchRecentItems = async () => {
      setIsLoading(true)
      try {
        // Récupérer les stats depuis l'API
        const response = await fetch(`/api/apps/${app.id}/stats/template`)
        if (response.ok) {
          const data = await response.json()
          // Prendre les 3 premiers éléments
          const items = (data.recentItems || []).slice(0, 3)
          setRecentItems(items)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des éléments récents:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecentItems()

    // Rafraîchir périodiquement si nécessaire
    const interval = setInterval(fetchRecentItems, 600000) // 10 minutes
    return () => clearInterval(interval)
  }, [app.id])

  if (isLoading) {
    return (
      <div className="space-y-2">
        {config.label && (
          <span className="text-sm text-muted-foreground">
            {config.label}
          </span>
        )}
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 w-12 animate-pulse rounded bg-muted"
            />
          ))}
        </div>
      </div>
    )
  }

  if (recentItems.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {config.label && (
        <span className="text-sm text-muted-foreground">
          {config.label}
        </span>
      )}
      <div className="flex gap-2">
        {recentItems.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className="p-2 rounded border bg-card"
          >
            <p className="text-xs font-medium truncate">{item.title}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

