/**
 * Composant Panel pour les statistiques détaillées Overseerr
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
import { Loader2, Film, Tv, Users, Download, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'
import type { OverseerrStats } from './types'
import type { StatsDisplayOptions, App } from '@/lib/types'
import type { StatsPanelProps } from '@/lib/card-registry'
import { getTemplateById } from '@/lib/stats-templates'

/**
 * Composant du panneau de statistiques Overseerr
 * 
 * Affiche les statistiques détaillées dans un Sheet (panneau latéral)
 */
export function OverseerrStatsPanel({ open, onOpenChange, appId, appName }: StatsPanelProps) {
    const [stats, setStats] = useState<OverseerrStats | null>(null)
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
                        const templateId = app.statsConfig?.templateId || 'overseerr'

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
                const statsResponse = await fetch(`/api/apps/${appId}/stats/overseerr`)

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
                        Vue d'ensemble de vos demandes et médias Overseerr
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
                                            <CardTitle className="text-sm font-medium">Total Demandes</CardTitle>
                                            <Download className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{stats.totalRequests}</div>
                                            <p className="text-xs text-muted-foreground">
                                                {stats.pendingRequests} en attente
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Médias Disponibles</CardTitle>
                                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{stats.availableMedia}</div>
                                            <p className="text-xs text-muted-foreground">
                                                {stats.totalMovies} films, {stats.totalTvShows} séries
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">En Traitement</CardTitle>
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{stats.processingRequests}</div>
                                            <p className="text-xs text-muted-foreground">
                                                Demandes
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{stats.totalUsers}</div>
                                            <p className="text-xs text-muted-foreground">
                                                Total
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Statistiques de demandes */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Statistiques de demandes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold">{stats.requestStats.total}</div>
                                            <p className="text-xs text-muted-foreground">Total</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-yellow-600">{stats.requestStats.pending}</div>
                                            <p className="text-xs text-muted-foreground">En attente</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">{stats.requestStats.approved}</div>
                                            <p className="text-xs text-muted-foreground">Approuvées</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">{stats.requestStats.processing}</div>
                                            <p className="text-xs text-muted-foreground">En traitement</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-red-600">{stats.requestStats.declined}</div>
                                            <p className="text-xs text-muted-foreground">Refusées</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Médias */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Médias</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                                            <Film className="h-8 w-8 text-primary" />
                                            <div>
                                                <div className="text-2xl font-bold">{stats.totalMovies}</div>
                                                <p className="text-xs text-muted-foreground">Films</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                                            <Tv className="h-8 w-8 text-primary" />
                                            <div>
                                                <div className="text-2xl font-bold">{stats.totalTvShows}</div>
                                                <p className="text-xs text-muted-foreground">Séries</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : null}
                </div>
            </SheetContent>
        </Sheet>
    )
}

