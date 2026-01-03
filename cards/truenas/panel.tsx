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
import { Button } from '@/components/ui/button'
import { Loader2, HardDrive, Cpu, MemoryStick, Server, AlertCircle, RefreshCw } from 'lucide-react'
import type { TrueNASStats } from './types'
import type { StatsDisplayOptions, App } from '@/lib/types'
import type { StatsPanelProps } from '@/lib/card-registry'
import { getTemplateById } from '@/lib/stats-templates'
import { getCachedData, setCachedData, getCacheKey, getCacheTimestamp } from '@/lib/cache-client'
import { formatRelativeTime, formatDateTime, getDataAgeColor } from '@/lib/date-utils'
import { fetchWithRetry } from '@/lib/api-retry'
import { createStructuredError, isRecoverableError } from '@/lib/error-handler'
import { getTimeoutFromApp } from '@/lib/timeout-config'

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
    const [lastUpdated, setLastUpdated] = useState<number | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [app, setApp] = useState<App | null>(null)

    // Intervalle de rafraîchissement configurable (défaut : 10 minutes)
    const refreshInterval = app?.statsConfig?.refreshInterval || 600000

    /**
     * Fonction pour récupérer les statistiques depuis l'API
     * Peut être appelée manuellement (rafraîchissement) ou automatiquement
     */
    const fetchData = async (forceRefresh = false) => {
        // Ne pas afficher le loader si on force le rafraîchissement (on utilise isRefreshing)
        if (!forceRefresh) {
            setIsLoading(true)
        } else {
            setIsRefreshing(true)
        }
        setError(null)

        try {
            const templateId = 'truenas'
            const cacheKey = getCacheKey(appId, templateId)

            // Charger depuis le cache si disponible et pas de force refresh (optimistic UI)
            if (!forceRefresh) {
                const cachedData = getCachedData<TrueNASStats>(cacheKey)
                if (cachedData) {
                    setStats(cachedData)
                    const cachedTimestamp = getCacheTimestamp(cacheKey)
                    if (cachedTimestamp) {
                        setLastUpdated(cachedTimestamp)
                    }
                }
            }

            // Récupérer l'app pour avoir accès aux options d'affichage
            const appResponse = await fetch(`/api/apps`)
            if (appResponse.ok) {
                const apps: App[] = await appResponse.json()
                const currentApp = apps.find((a) => a.id === appId)

                if (currentApp) {
                    setApp(currentApp)

                    if (currentApp.statsConfig?.displayOptions) {
                        setDisplayOptions(currentApp.statsConfig.displayOptions)
                    } else if (currentApp.statsConfig?.templateId) {
                        const template = getTemplateById(currentApp.statsConfig.templateId)
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
            // Utiliser le timeout adaptatif selon le type d'API
            const timeout = getTimeoutFromApp(app || { id: appId } as App)
            
            // Utiliser fetchWithRetry pour réessayer automatiquement en cas d'erreur
            const statsResponse = await fetchWithRetry(
                `/api/apps/${appId}/stats/truenas`,
                {
                    signal: AbortSignal.timeout(timeout),
                },
                {
                    maxRetries: 3,
                    baseDelay: 1000,
                }
            )

            if (!statsResponse.ok) {
                const errorData = await statsResponse.json().catch(() => ({}))
                const error = new Error(errorData.error || 'Erreur lors de la récupération des statistiques')
                const structuredError = createStructuredError(error, statsResponse)
                throw structuredError
            }

            const data = await statsResponse.json()
            setStats(data)
            const now = Date.now()
            setLastUpdated(now)

            // Mettre en cache avec TTL de 5 minutes
            setCachedData(cacheKey, data, 300000)
        } catch (err: any) {
            console.error('Erreur lors de la récupération des stats TrueNAS:', err)
            
            // Créer une erreur structurée
            const structuredError = err.type 
                ? err 
                : createStructuredError(
                    err instanceof Error ? err : new Error(String(err))
                  )
            
            // Afficher un message d'erreur approprié
            setError(structuredError.message)
            
            // Si l'erreur est récupérable et qu'on a des données en cache, les garder affichées
            if (isRecoverableError(structuredError) || !stats) {
                const cacheKey = getCacheKey(appId, 'truenas')
                const cachedData = getCachedData<TrueNASStats>(cacheKey)
                if (cachedData) {
                    setStats(cachedData)
                    const cachedTimestamp = getCacheTimestamp(cacheKey)
                    if (cachedTimestamp) {
                        setLastUpdated(cachedTimestamp)
                    }
                }
            }
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    /**
     * Effect pour récupérer les données au chargement et rafraîchir périodiquement
     */
    useEffect(() => {
        if (!open || !appId) return

        fetchData()

        // Rafraîchir selon l'intervalle configuré (défaut : 10 minutes)
        const interval = setInterval(() => {
            fetchData()
        }, refreshInterval)

        return () => clearInterval(interval)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, appId]) // refreshInterval peut changer mais on ne veut pas recréer l'interval à chaque fois

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="h-[90vh] max-h-[90vh] overflow-y-auto p-6"
            >
                <SheetHeader className="pb-4 border-b px-0">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <SheetTitle className="text-2xl">Statistiques {appName}</SheetTitle>
                            <SheetDescription>
                                Vue d'ensemble de votre système TrueNAS
                            </SheetDescription>
                            {lastUpdated && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span 
                                        className={`text-xs px-2 py-1 rounded-full ${
                                            getDataAgeColor(lastUpdated) === 'green' 
                                                ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                                                : getDataAgeColor(lastUpdated) === 'orange'
                                                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                                : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                        }`}
                                    >
                                        Mis à jour {formatRelativeTime(lastUpdated)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        ({formatDateTime(lastUpdated)})
                                    </span>
                                </div>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fetchData(true)}
                            disabled={isRefreshing || isLoading}
                            className="ml-4"
                            title="Rafraîchir les statistiques"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
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

