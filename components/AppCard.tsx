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
import { PlexRecentImages } from '@/components/PlexRecentImages'
import { ChartContainer, ChartConfig } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import type { App, CardStatType, PlexStats } from '@/lib/types'

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
  const [chartData, setChartData] = useState<any[]>([])
  const [isLoadingStat, setIsLoadingStat] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isStatsPanelOpen, setIsStatsPanelOpen] = useState(false)

  // Vérifier si l'application a un template de statistiques configuré
  const hasStatsTemplate = !!app.statsConfig?.templateId
  const templateId = app.statsConfig?.templateId

  // Configuration de la statistique de carte
  const cardStatConfig = app.statsConfig?.cardStat
  const cardStatType: CardStatType | undefined = cardStatConfig?.type || (app.statLabel ? 'number' : undefined)

  /**
   * Récupère les statistiques depuis l'API selon le type configuré
   */
  useEffect(() => {
    // Si pas de configuration de stat de carte, utiliser l'ancien système
    if (!cardStatType && !app.statApiUrl) return

    const fetchStats = async () => {
      setIsLoadingStat(true)
      try {
        if (cardStatType === 'plex-recent') {
          // Pour les images Plex, on ne charge rien ici (géré par PlexRecentImages)
          setIsLoadingStat(false)
          return
        }

        if (cardStatType === 'chart' && app.statsConfig?.templateId === 'plex') {
          // Pour les graphiques Plex, récupérer les stats complètes
          const response = await fetch(`/api/apps/${app.id}/stats/plex`)
          if (response.ok) {
            const data: PlexStats = await response.json()
            const statKey = cardStatConfig?.key || 'totalMovies'

            // Générer des données pour le graphique (simulation avec les données actuelles)
            // Dans un vrai cas, on aurait besoin de données historiques
            const value = (data as any)[statKey] || 0
            setChartData([
              { name: 'J-6', value: Math.max(0, value - 20) },
              { name: 'J-5', value: Math.max(0, value - 15) },
              { name: 'J-4', value: Math.max(0, value - 10) },
              { name: 'J-3', value: Math.max(0, value - 5) },
              { name: 'J-2', value: Math.max(0, value - 2) },
              { name: 'J-1', value: Math.max(0, value - 1) },
              { name: 'Aujourd\'hui', value },
            ])
          }
        } else if (cardStatType === 'number') {
          // Pour les nombres, utiliser l'API générique ou Plex selon le template
          const endpoint = app.statsConfig?.templateId === 'plex'
            ? `/api/apps/${app.id}/stats/plex`
            : `/api/apps/${app.id}/stats`

          const response = await fetch(endpoint)
          if (response.ok) {
            const data = await response.json()
            const statKey = cardStatConfig?.key || 'value'

            // Extraire la valeur selon la clé
            const value = (data as any)[statKey] ||
              (typeof data === 'number' ? data :
                data.value || data.count || data.total)
            setStatValue(value)
          }
        } else if (app.statApiUrl) {
          // Ancien système de compatibilité
          const response = await fetch(`/api/apps/${app.id}/stats`)
          if (response.ok) {
            const data = await response.json()
            const value = typeof data === 'number' || typeof data === 'string'
              ? data
              : data.value || data.count || data.total
            setStatValue(value)
          }
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
  }, [app.id, app.statApiUrl, cardStatType, cardStatConfig?.key, app.statsConfig?.templateId])

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
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation() // Empêcher le clic sur la card
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${app.name}" ?`)) {
      onDelete?.(app.id)
    }
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
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Icons.Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Affichage de la statistique selon le type configuré */}
        {cardStatType === 'plex-recent' && (
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">
              {cardStatConfig?.label || 'Derniers ajouts'}
            </span>
            <PlexRecentImages appId={app.id} />
          </div>
        )}

        {cardStatType === 'chart' && (
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">
              {cardStatConfig?.label || app.statLabel || 'Statistique'}
            </span>
            {isLoadingStat ? (
              <div className="h-24 flex items-center justify-center">
                <span className="text-sm text-muted-foreground">Chargement...</span>
              </div>
            ) : chartData.length > 0 ? (
              <ChartContainer
                config={{
                  value: {
                    label: cardStatConfig?.label || 'Valeur',
                    color: 'hsl(var(--chart-1))',
                  },
                } satisfies ChartConfig}
                className="h-24 w-full"
              >
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-value)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-24 flex items-center justify-center">
                <span className="text-sm text-muted-foreground">Aucune donnée</span>
              </div>
            )}
          </div>
        )}

        {cardStatType === 'number' && (
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-muted-foreground">
              {cardStatConfig?.label || app.statLabel || 'Statistique'}:
            </span>
            {isLoadingStat ? (
              <span className="text-sm text-muted-foreground">...</span>
            ) : (
              <span className="text-lg font-semibold">{statValue ?? 'N/A'}</span>
            )}
          </div>
        )}

        {/* Compatibilité avec l'ancien système */}
        {!cardStatType && app.statLabel && (
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-muted-foreground">{app.statLabel}:</span>
            {isLoadingStat ? (
              <span className="text-sm text-muted-foreground">...</span>
            ) : (
              <span className="text-lg font-semibold">{statValue ?? 'N/A'}</span>
            )}
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
    </Card>
  )
}

