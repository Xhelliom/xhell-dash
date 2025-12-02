/**
 * Composant AppCard
 * 
 * Affiche une card pour une application avec :
 * - Logo (icône Lucide ou image URL)
 * - Nom de l'application
 * - Statistique configurable (si disponible)
 * - Redirection vers l'URL de l'application au clic
 */

'use client'

import { useState, useEffect } from 'react'
import * as Icons from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlexStatsPanel } from '@/components/PlexStatsPanel'
import type { App } from '@/lib/types'

interface AppCardProps {
  app: App
  onEdit?: (app: App) => void
  onDelete?: (appId: string) => void
  showActions?: boolean
}

/**
 * Récupère dynamiquement une icône Lucide par son nom
 * 
 * @param iconName - Nom de l'icône (ex: "Plex", "Home")
 * @returns Composant d'icône ou null si non trouvé
 */
function getLucideIcon(iconName: string) {
  // Nettoyer le nom de l'icône (enlever espaces, mettre en PascalCase)
  const cleanName = iconName
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')

  // Chercher l'icône dans les exports de lucide-react
  // Par défaut, on utilise Grid3x3 si l'icône n'est pas trouvée
  const IconComponent = (Icons as any)[cleanName] || Icons.Grid3x3

  return IconComponent
}

export function AppCard({ app, onEdit, onDelete, showActions = false }: AppCardProps) {
  const [statValue, setStatValue] = useState<string | number | undefined>(app.statValue)
  const [isLoadingStat, setIsLoadingStat] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isStatsPanelOpen, setIsStatsPanelOpen] = useState(false)

  // Vérifier si c'est une application avec le template Plex (par nom ou templateId)
  const isPlex = app.name.toLowerCase() === 'plex' || app.statsConfig?.templateId === 'plex'

  /**
   * Récupère les statistiques depuis l'API si configurée
   */
  useEffect(() => {
    if (!app.statApiUrl) return

    // Fonction pour récupérer les stats
    const fetchStats = async () => {
      setIsLoadingStat(true)
      try {
        const response = await fetch(`/api/apps/${app.id}/stats`)
        if (response.ok) {
          const data = await response.json()
          // Adapter selon le format de réponse de l'API
          // Ici on suppose que l'API retourne directement une valeur ou un objet avec une propriété "value"
          const value = typeof data === 'number' || typeof data === 'string'
            ? data
            : data.value || data.count || data.total
          setStatValue(value)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des stats:', error)
      } finally {
        setIsLoadingStat(false)
      }
    }

    // Récupérer immédiatement
    fetchStats()

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchStats, 30000)

    return () => clearInterval(interval)
  }, [app.id, app.statApiUrl])

  /**
   * Gère le clic sur la card pour rediriger vers l'application
   */
  const handleCardClick = () => {
    window.open(app.url, '_blank')
  }

  /**
   * Gère le clic sur les statistiques
   * Pour Plex, ouvre le panneau de stats détaillées
   * Sinon, redirige vers l'application
   */
  const handleStatClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Empêcher le clic sur la card

    if (isPlex) {
      setIsStatsPanelOpen(true)
    } else {
      handleCardClick()
    }
  }

  /**
   * Gère le clic sur le bouton d'édition
   */
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation() // Empêcher le clic sur la card
    onEdit?.(app)
  }

  /**
   * Gère le clic sur le bouton de suppression
   */
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation() // Empêcher le clic sur la card
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${app.name}" ?`)) {
      onDelete?.(app.id)
    }
  }

  // Récupérer le composant d'icône si c'est une icône
  const IconComponent = app.logoType === 'icon' ? getLucideIcon(app.logo) : null

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
      onClick={handleCardClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          {/* Logo : icône ou image */}
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
            {app.logoType === 'icon' && IconComponent ? (
              <IconComponent className="h-8 w-8 text-primary" />
            ) : imageError ? (
              <Icons.Grid3x3 className="h-8 w-8 text-primary" />
            ) : (
              <img
                src={app.logo}
                alt={app.name}
                className="h-8 w-8 object-contain"
                onError={() => setImageError(true)}
              />
            )}
          </div>
          <CardTitle className="text-lg">{app.name}</CardTitle>
        </div>

        {/* Boutons d'action si activés */}
        {showActions && (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-8 w-8 p-0"
              >
                <Icons.Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Icons.Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Affichage de la statistique si configurée */}
        {app.statLabel && (
          <div
            className={`flex items-baseline gap-2 ${isPlex ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
            onClick={isPlex ? handleStatClick : undefined}
            title={isPlex ? 'Cliquez pour voir les statistiques détaillées' : undefined}
          >
            <span className="text-sm text-muted-foreground">{app.statLabel}:</span>
            {isLoadingStat ? (
              <span className="text-sm text-muted-foreground">...</span>
            ) : (
              <span className="text-lg font-semibold">{statValue ?? 'N/A'}</span>
            )}
            {isPlex && (
              <Icons.BarChart3 className="h-4 w-4 ml-auto text-muted-foreground" />
            )}
          </div>
        )}
      </CardContent>

      {/* Panneau de statistiques Plex */}
      {isPlex && (
        <PlexStatsPanel
          open={isStatsPanelOpen}
          onOpenChange={setIsStatsPanelOpen}
          appId={app.id}
          appName={app.name}
        />
      )}
    </Card>
  )
}

