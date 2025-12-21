/**
 * Composant Panel pour les statistiques détaillées Kubernetes
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
import { Loader2, Server, Cpu, MemoryStick, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import type { KubernetesStats } from './types'
import type { StatsDisplayOptions, App } from '@/lib/types'
import type { StatsPanelProps } from '@/lib/card-registry'
import { getTemplateById } from '@/lib/stats-templates'

/**
 * Formate les bytes en format lisible
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

/**
 * Composant du panneau de statistiques Kubernetes
 * 
 * Affiche les statistiques détaillées dans un Sheet (panneau latéral)
 */
export function KubernetesStatsPanel({ open, onOpenChange, appId, appName }: StatsPanelProps) {
    const [stats, setStats] = useState<KubernetesStats | null>(null)
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
                        const templateId = app.statsConfig?.templateId || 'kubernetes'

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
                const statsResponse = await fetch(`/api/apps/${appId}/stats/kubernetes`)

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
                        Vue d'ensemble de votre cluster Kubernetes
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
                                            <CardTitle className="text-sm font-medium">Nœuds</CardTitle>
                                            <Server className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{stats.totalNodes}</div>
                                            <p className="text-xs text-muted-foreground">
                                                Dans le cluster
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Pods</CardTitle>
                                            <Server className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{stats.totalPods}</div>
                                            <p className="text-xs text-muted-foreground">
                                                {stats.runningPods} en cours d'exécution
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">CPU</CardTitle>
                                            <Cpu className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{stats.cpuUsage.toFixed(1)}</div>
                                            <p className="text-xs text-muted-foreground">
                                                Cores utilisés
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Mémoire</CardTitle>
                                            <MemoryStick className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{stats.memoryUsage.toFixed(1)}%</div>
                                            <p className="text-xs text-muted-foreground">
                                                {formatBytes(stats.memoryUsed)} / {formatBytes(stats.memoryTotal)}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Statistiques des pods */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Statut des pods</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold">{stats.totalPods}</div>
                                            <p className="text-xs text-muted-foreground">Total</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">{stats.runningPods}</div>
                                            <p className="text-xs text-muted-foreground">En cours</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-yellow-600">{stats.pendingPods}</div>
                                            <p className="text-xs text-muted-foreground">En attente</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-red-600">{stats.failedPods}</div>
                                            <p className="text-xs text-muted-foreground">Échecs</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Namespaces */}
                            {stats.namespaceStats.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Statistiques par namespace</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {stats.namespaceStats.map((namespace) => (
                                                <div
                                                    key={namespace.namespace}
                                                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                                                >
                                                    <div>
                                                        <p className="font-medium text-sm">{namespace.namespace}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {namespace.runningPods} en cours, {namespace.failedPods} échecs
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold">{namespace.podCount}</div>
                                                        <p className="text-xs text-muted-foreground">pods</p>
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

