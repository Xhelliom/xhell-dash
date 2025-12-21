/**
 * Composant Panel pour les statistiques détaillées Uptime Kuma
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
import { Loader2, Activity, AlertCircle, CheckCircle2, Clock, Shield } from 'lucide-react'
import type { UptimeKumaStats } from './types'
import type { StatsDisplayOptions, App } from '@/lib/types'
import type { StatsPanelProps } from '@/lib/card-registry'
import { getTemplateById } from '@/lib/stats-templates'

/**
 * Composant du panneau de statistiques Uptime Kuma
 * 
 * Affiche les statistiques détaillées dans un Sheet (panneau latéral)
 */
export function UptimeKumaStatsPanel({ open, onOpenChange, appId, appName }: StatsPanelProps) {
    const [stats, setStats] = useState<UptimeKumaStats | null>(null)
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
                        const templateId = app.statsConfig?.templateId || 'uptime-kuma'

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
                const statsResponse = await fetch(`/api/apps/${appId}/stats/uptime-kuma`)

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
                        Vue d'ensemble de vos monitors Uptime Kuma
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
                                            <CardTitle className="text-sm font-medium">Total Monitors</CardTitle>
                                            <Activity className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{stats.totalMonitors}</div>
                                            <p className="text-xs text-muted-foreground">
                                                {stats.activeMonitors} actifs
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Uptime 24h</CardTitle>
                                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{stats.averageUptime24h.toFixed(2)}%</div>
                                            <p className="text-xs text-muted-foreground">
                                                Moyenne
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Temps de réponse</CardTitle>
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{stats.averageResponseTime.toFixed(0)}ms</div>
                                            <p className="text-xs text-muted-foreground">
                                                Moyenne
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Certificats</CardTitle>
                                            <Shield className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{stats.certificatesExpiring}</div>
                                            <p className="text-xs text-muted-foreground">
                                                Expirent bientôt
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Monitors */}
                            {stats.monitors.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Monitors</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {stats.monitors.map((monitor) => (
                                                <div
                                                    key={monitor.id}
                                                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-sm">{monitor.name}</p>
                                                            <span className={`text-xs px-2 py-1 rounded ${
                                                                monitor.status === 'up' 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : monitor.status === 'down'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {monitor.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {monitor.type}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        {monitor.uptime24h !== undefined && (
                                                            <div className="text-sm font-medium">
                                                                {monitor.uptime24h.toFixed(1)}%
                                                            </div>
                                                        )}
                                                        {monitor.responseTime !== undefined && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {monitor.responseTime.toFixed(0)}ms
                                                            </p>
                                                        )}
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

