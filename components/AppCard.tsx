/**
 * Composant AppCard
 * 
 * Affiche une card pour une application avec :
 * - Logo (icône Lucide ou image URL)
 * - Nom de l'application
 * - Statistique configurable (si disponible)
 * - Bouton pour ouvrir l'application
 * - Bouton Détails pour les apps avec template de stats (optionnel)
 */

'use client'

import { useState, useEffect } from 'react'
import * as Icons from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatsPanel } from '@/components/StatsPanel'
import { CardStatRenderer } from '@/components/card-stats/CardStatRenderer'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { normalizeCardStatConfig } from '@/lib/card-stat-utils'
import type { App, CardStatType } from '@/lib/types'

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
  const [imageError, setImageError] = useState(false)
  const [isStatsPanelOpen, setIsStatsPanelOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Vérifier si l'application a un template de statistiques configuré
  const hasStatsTemplate = !!app.statsConfig?.templateId
  const templateId = app.statsConfig?.templateId
  
  // Configuration de la statistique de carte (normalisée pour gérer les anciennes configs)
  const cardStatConfig = normalizeCardStatConfig(app.statsConfig?.cardStat)
  const cardStatType: CardStatType | undefined = cardStatConfig?.type || (app.statLabel ? 'number' : undefined)

  /**
   * Gère le clic sur le bouton pour ouvrir l'application
   */
  const handleOpenApp = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(app.url, '_blank')
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
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Empêcher le clic sur la card
    setIsDeleteDialogOpen(true)
  }

  /**
   * Confirme la suppression
   */
  const handleConfirmDelete = () => {
    onDelete?.(app.id)
  }


  // Récupérer le composant d'icône si c'est une icône
  const IconComponent = app.logoType === 'icon' ? getLucideIcon(app.logo) : null

  return (
    <Card className="transition-all hover:shadow-lg">
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
                onClick={handleDeleteClick}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Icons.Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Affichage de la statistique via le renderer générique */}
        {cardStatConfig && cardStatConfig.type && (
          <CardStatRenderer app={app} config={cardStatConfig} />
        )}

        {/* Compatibilité avec l'ancien système (si pas de cardStat configuré mais statLabel présent) */}
        {!cardStatConfig && app.statLabel && (
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-muted-foreground">{app.statLabel}:</span>
            <span className="text-lg font-semibold">{app.statValue ?? 'N/A'}</span>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-2">
          {/* Bouton pour ouvrir l'application */}
          <Button
            variant="default"
            size="sm"
            onClick={handleOpenApp}
            className="flex-1"
            type="button"
          >
            <Icons.ExternalLink className="h-4 w-4 mr-2" />
            Ouvrir
          </Button>

          {/* Bouton Détails pour les apps avec template de stats */}
          {hasStatsTemplate && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsStatsPanelOpen(true)
              }}
              className="flex-1"
              type="button"
            >
              <Icons.BarChart3 className="h-4 w-4 mr-2" />
              Détails
            </Button>
          )}
        </div>
      </CardContent>

      {/* Panneau de statistiques générique */}
      {hasStatsTemplate && templateId && (
        <StatsPanel
          open={isStatsPanelOpen}
          onOpenChange={setIsStatsPanelOpen}
          appId={app.id}
          appName={app.name}
          templateId={templateId}
        />
      )}

      {/* Dialog de confirmation de suppression */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Supprimer l'application"
        description={`Êtes-vous sûr de vouloir supprimer "${app.name}" ? Cette action est irréversible.`}
      />
    </Card>
  )
}

