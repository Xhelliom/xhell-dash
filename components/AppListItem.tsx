/**
 * Composant AppListItem
 * 
 * Affiche une application dans une liste pour le panneau de configuration
 * Format optimisé pour la configuration avec actions d'édition/suppression
 */

'use client'

import { Button } from '@/components/ui/button'
import { Pencil, Trash2, ExternalLink } from 'lucide-react'
import * as Icons from 'lucide-react'
import type { App } from '@/lib/types'

interface AppListItemProps {
  app: App
  onEdit: (app: App) => void
  onDelete: (appId: string) => void
}

/**
 * Récupère dynamiquement une icône Lucide par son nom
 */
function getLucideIcon(iconName: string) {
  const cleanName = iconName
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
  
  const IconComponent = (Icons as any)[cleanName] || Icons.Grid3x3
  return IconComponent
}

export function AppListItem({ app, onEdit, onDelete }: AppListItemProps) {
  const IconComponent = app.logoType === 'icon' ? getLucideIcon(app.logo) : null

  /**
   * Gère la suppression avec confirmation
   */
  const handleDelete = () => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${app.name}" ?`)) {
      onDelete(app.id)
    }
  }

  /**
   * Ouvre l'application dans un nouvel onglet
   */
  const handleOpen = () => {
    window.open(app.url, '_blank')
  }

  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      {/* Informations de l'application */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Logo */}
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted flex-shrink-0">
          {app.logoType === 'icon' && IconComponent ? (
            <IconComponent className="h-5 w-5 text-primary" />
          ) : (
            <img 
              src={app.logo} 
              alt={app.name}
              className="h-5 w-5 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
        </div>

        {/* Nom et URL */}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{app.name}</div>
          <div className="text-sm text-muted-foreground truncate">{app.url}</div>
          {app.statLabel && (
            <div className="text-xs text-muted-foreground mt-1">
              {app.statLabel}: {app.statValue ?? 'N/A'}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpen}
          className="h-8 w-8 p-0"
          title="Ouvrir l'application"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(app)}
          className="h-8 w-8 p-0"
          title="Modifier"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

