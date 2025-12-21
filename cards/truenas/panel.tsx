/**
 * Composant Panel pour les statistiques détaillées TrueNAS
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
import { Loader2, HardDrive, Cpu, MemoryStick, Server, AlertCircle } from 'lucide-react'
import type { TrueNASStats } from './types'
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
 * Composant du panneau de statistiques TrueNAS
 * 
 * Affiche les statistiques détaillées dans un Sheet (panneau latéral)
 */
export function TrueNASStatsPanel({ open, onOpenChange, appId, appName }: StatsPanelProps) {
    const [stats, setStats] = useState<TrueNASStats | null>(null)
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
                        const templateId = app.statsConfig?.templateId || 'truenas'

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
                const statsResponse = await fetch(`/api/apps/${appId}/stats/truenas`)

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
                        Vue d'ensemble de votre système TrueNAS
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
                                            <CardTitle className="text-sm font-medium">CPU</CardTitle>
                                            <Cpu className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{stats.cpuUsage.toFixed(1)}%</div>
                                            <p className="text-xs text-muted-foreground">
                                                Utilisation
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

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Stockage</CardTitle>
                                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{formatBytes(stats.diskUsed)}</div>
                                            <p className="text-xs text-muted-foreground">
                                                {formatBytes(stats.diskTotal)} total
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Services</CardTitle>
                                            <Server className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{stats.activeServices}</div>
                                            <p className="text-xs text-muted-foreground">
                                                {stats.services.length} au total
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Pools de stockage */}
                            {stats.pools.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Pools de stockage</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {stats.pools.map((pool) => {
                                                const usagePercent = pool.size > 0 ? (pool.allocated / pool.size) * 100 : 0
                                                return (
                                                    <div
                                                        key={pool.id}
                                                        className="p-3 rounded-lg border bg-card"
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="font-medium text-sm">{pool.name}</p>
                                                            <span className={`text-xs px-2 py-1 rounded ${
                                                                pool.status === 'ONLINE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {pool.status}
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-secondary rounded-full h-2 mb-1">
                                                            <div
                                                                className="bg-primary h-2 rounded-full"
                                                                style={{ width: `${usagePercent}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatBytes(pool.allocated)} / {formatBytes(pool.size)} ({usagePercent.toFixed(1)}%)
                                                        </p>
                                                    </div>
                                                )
                                            })}
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

