/**
 * Composant Panel pour les statistiques détaillées Home Assistant
 * 
 * Ce composant affiche le panneau modal avec les statistiques détaillées
 * Il est affiché quand l'utilisateur clique sur le bouton "Détails" de la carte
 */

'use client'

import { useState, useEffect } from 'react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Home, Activity, Zap, AlertCircle, Clock } from 'lucide-react'
import type { HomeAssistantStats } from './types'
import type { StatsDisplayOptions, App } from '@/lib/types'
import type { StatsPanelProps } from '@/lib/card-registry'
import { getTemplateById } from '@/lib/stats-templates'

/**
 * Formate une date relative
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'À l\'instant'
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`
  if (diffHours < 24) return `Il y a ${diffHours} h`
  return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
}

/**
 * Composant du panneau de statistiques Home Assistant
 * 
 * Affiche les statistiques détaillées dans un Sheet (panneau latéral)
 */
export function HomeAssistantStatsPanel({ open, onOpenChange, appId, appName }: StatsPanelProps) {
    const [stats, setStats] = useState<HomeAssistantStats | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [displayOptions, setDisplayOptions] = useState<StatsDisplayOptions | null>(null)

    /**
     * Récupère les statistiques depuis l'API et les options d'affichage depuis l'app
     */
    useEffect(() => {
        if (!open || !appId) return

        const fetchData = async () => {
            setIsLoading(true)
            setError(null)

            try {
                // Récupérer l'app pour avoir accès aux options d'affichage
                const appResponse = await fetch(`/api/apps`)
                if (appResponse.ok) {
                    const apps: App[] = await appResponse.json()
                    const app = apps.find((a) => a.id === appId)

                    if (app) {
                        const templateId = app.statsConfig?.templateId || 'home-assistant'

                        if (app.statsConfig?.displayOptions) {
                            setDisplayOptions(app.statsConfig.displayOptions)
                        } else if (app.statsConfig?.templateId) {
                            const template = getTemplateById(app.statsConfig.templateId)
                            if (template) {
                                setDisplayOptions(template.defaultDisplayOptions)
                            }
                        } else {
                            setDisplayOptions({
                                showKPIs: true,
                            })
                        }
                    }
                }

                // Récupérer les statistiques depuis l'API
                const statsResponse = await fetch(`/api/apps/${appId}/stats/home-assistant`)

                if (!statsResponse.ok) {
                    const errorData = await statsResponse.json()
                    throw new Error(errorData.error || 'Erreur lors de la récupération des statistiques')
                }

                const data = await statsResponse.json()
                setStats(data)
            } catch (err: any) {
                console.error('Erreur lors de la récupération des stats:', err)
                setError(err.message || 'Impossible de charger les statistiques')
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [open, appId])

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="h-[90vh] max-h-[90vh] overflow-y-auto p-6"
            >
                <SheetHeader className="pb-4 border-b px-0">
                    <SheetTitle className="text-2xl">Statistiques {appName}</SheetTitle>
                    <SheetDescription>
                        Vue d'ensemble de votre installation Home Assistant
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="ml-2 text-muted-foreground">Chargement des statistiques...</span>
                        </div>
                    ) : error ? (
                        <div className="py-8 text-center">
                            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                            <p className="text-destructive">{error}</p>
                        </div>
                    ) : stats ? (
                        <div className="space-y-6">
                            {/* KPI Cards */}
                            {displayOptions?.showKPIs !== false && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Total Entités</CardTitle>
                                            <Home className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{stats.totalEntities}</div>
                                            <p className="text-xs text-muted-foreground">
                                                {stats.activeEntities} actives
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Actives</CardTitle>
                                            <Activity className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-green-600">{stats.activeEntities}</div>
                                            <p className="text-xs text-muted-foreground">
                                                {stats.inactiveEntities} inactives
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Automatisations</CardTitle>
                                            <Zap className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{stats.automationsActive}</div>
                                            <p className="text-xs text-muted-foreground">
                                                Actives
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Domaines</CardTitle>
                                            <Home className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{stats.domainStats.length}</div>
                                            <p className="text-xs text-muted-foreground">
                                                Types différents
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Domaines */}
                            {stats.domainStats.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Statistiques par domaine</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {stats.domainStats.map((domain) => (
                                                <div
                                                    key={domain.domain}
                                                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                                                >
                                                    <div>
                                                        <p className="font-medium text-sm">{domain.domain}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {domain.active} actives sur {domain.count}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold">{domain.count}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Changements récents */}
                            {stats.recentChanges.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Clock className="h-5 w-5" />
                                            Changements récents (24h)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {stats.recentChanges.map((change, index) => (
                                                <div
                                                    key={`${change.entityId}-${index}`}
                                                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                                                >
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm">
                                                            {change.friendlyName || change.entityId}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {change.entityId}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium">{change.state}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatRelativeTime(change.lastChanged)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    ) : null}
                </div>
            </SheetContent>
        </Sheet>
    )
}

