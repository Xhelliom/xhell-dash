/**
 * Composant GenericStatsPanel
 * 
 * Affiche un panneau modal avec les statistiques génériques depuis l'API externe
 * Les données sont affichées de manière générique selon leur structure
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
import { Loader2, BarChart3, RefreshCw } from 'lucide-react'
import { SkeletonCard } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import type { GenericStats } from './types'
import type { StatsDisplayOptions, App } from '@/lib/types'
import type { StatsPanelProps } from '@/lib/card-registry'
import { getTemplateById } from '@/lib/stats-templates'
import { getCachedData, setCachedData, getCacheKey, getCacheTimestamp } from '@/lib/cache-client'
import { formatRelativeTime, formatDateTime, getDataAgeColor } from '@/lib/date-utils'
import { fetchWithRetry } from '@/lib/api-retry'
import { createStructuredError, isRecoverableError } from '@/lib/error-handler'
import { validateGenericStats } from './validation'
import { useConnectivity } from '@/lib/connectivity'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { WifiOff, AlertTriangle } from 'lucide-react'
import { storeMetrics } from '@/lib/metrics-storage'
import { getAdaptiveTimeout } from '@/lib/timeout-config'

/**
 * Composant du panneau de statistiques génériques
 * 
 * Affiche les statistiques depuis l'API externe de manière générique
 */
export function GenericStatsPanel({ open, onOpenChange, appId, appName }: StatsPanelProps) {
    const [stats, setStats] = useState<GenericStats | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [displayOptions, setDisplayOptions] = useState<StatsDisplayOptions | null>(null)
    const [lastUpdated, setLastUpdated] = useState<number | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const connectivityStatus = useConnectivity() // Détection de connectivité

    /**
     * Fonction pour récupérer les statistiques depuis l'API
     * Peut être appelée manuellement (rafraîchissement) ou automatiquement
     */
    const fetchData = async (forceRefresh = false) => {
        // En mode offline, ne pas tenter de faire des requêtes
        if (connectivityStatus === 'offline') {
            const cacheKey = getCacheKey(appId, 'generic')
            const cachedData = getCachedData<GenericStats>(cacheKey)
            if (cachedData) {
                setStats(cachedData)
                const cachedTimestamp = getCacheTimestamp(cacheKey)
                if (cachedTimestamp) {
                    setLastUpdated(cachedTimestamp)
                }
            }
            setError('Mode hors ligne - Affichage des données en cache')
            setIsLoading(false)
            setIsRefreshing(false)
            return
        }

        // Ne pas afficher le loader si on force le rafraîchissement (on utilise isRefreshing)
        if (!forceRefresh) {
            setIsLoading(true)
        } else {
            setIsRefreshing(true)
        }
        setError(null)

        try {
            const cacheKey = getCacheKey(appId, 'generic')

            // Charger depuis le cache si disponible et pas de force refresh (optimistic UI)
            if (!forceRefresh) {
                const cachedData = getCachedData<GenericStats>(cacheKey)
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
            let app: App | undefined
            let templateId = 'generic'
            
            if (appResponse.ok) {
                const apps: App[] = await appResponse.json()
                app = apps.find((a) => a.id === appId)

                if (app) {
                    templateId = app.statsConfig?.templateId || 'generic'

                    if (app.statsConfig?.displayOptions) {
                        // Utiliser les options d'affichage de l'app
                        setDisplayOptions(app.statsConfig.displayOptions)
                    } else if (app.statsConfig?.templateId) {
                        // Utiliser les options par défaut du template
                        const template = getTemplateById(app.statsConfig.templateId)
                        if (template) {
                            setDisplayOptions(template.defaultDisplayOptions)
                        }
                    } else {
                        // Options par défaut
                        setDisplayOptions({
                            showKPIs: true,
                        })
                    }
                }
            }

            // Utiliser le timeout adaptatif selon le type d'API
            const timeout = getAdaptiveTimeout(templateId, app?.statsConfig?.timeout)

            // Récupérer les statistiques depuis l'API
            // Utiliser fetchWithRetry pour réessayer automatiquement en cas d'erreur
            const statsResponse = await fetchWithRetry(
                `/api/apps/${appId}/stats/generic`,
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

            const rawData = await statsResponse.json()
            
            // Valider les données avec Zod
            const data = validateGenericStats(rawData)
            
            setStats(data)
            const now = Date.now()
            setLastUpdated(now)

            // Stocker les métriques numériques dans l'historique pour les graphiques
            // templateId est déjà défini plus haut
            const metricsToStore: Array<{ appId: string; templateId: string; key: string; value: number; timestamp: number }> = []
            
            if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
                Object.entries(data).forEach(([key, value]) => {
                    // Stocker uniquement les valeurs numériques
                    if (typeof value === 'number' && !isNaN(value)) {
                        metricsToStore.push({
                            appId,
                            templateId,
                            key,
                            value,
                            timestamp: now,
                        })
                    }
                })
            }
            
            if (metricsToStore.length > 0) {
                storeMetrics(metricsToStore)
            }

            // Mettre en cache avec TTL de 5 minutes
            setCachedData(cacheKey, data, 300000)
        } catch (err: any) {
            console.error('Erreur lors de la récupération des stats génériques:', err)
            
            // Créer une erreur structurée
            const structuredError = err.type 
                ? err 
                : createStructuredError(
                    err instanceof Error ? err : new Error(String(err))
                  )
            
            // Afficher un message d'erreur approprié
            setError(structuredError.message)
            
            // En cas d'erreur récupérable, essayer d'afficher les données en cache si disponibles
            if (isRecoverableError(structuredError) || !stats) {
                const cacheKey = getCacheKey(appId, 'generic')
                const cachedData = getCachedData<GenericStats>(cacheKey)
                if (cachedData) {
                    setStats(cachedData)
                    const cachedTimestamp = getCacheTimestamp(cacheKey)
                    if (cachedTimestamp) {
                        setLastUpdated(cachedTimestamp)
                    }
                    // Afficher un message indiquant que les données sont en cache
                    if (isRecoverableError(structuredError)) {
                        setError(`Données en cache (${structuredError.message})`)
                    }
                }
            }
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    /**
     * Récupère les statistiques depuis l'API et les options d'affichage depuis l'app
     */
    useEffect(() => {
        if (!open || !appId) return

        fetchData()
    }, [open, appId])

    /**
     * Convertit les données en tableau de KPI pour l'affichage
     */
    const formatStatsAsKPIs = (data: GenericStats): Array<{ label: string; value: any }> => {
        const kpis: Array<{ label: string; value: any }> = []
        
        // Si les données sont un objet, convertir chaque propriété en KPI
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            Object.entries(data).forEach(([key, value]) => {
                // Ignorer les valeurs null/undefined et les objets complexes
                if (value !== null && value !== undefined && typeof value !== 'object') {
                    kpis.push({
                        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                        value: value,
                    })
                }
            })
        }
        
        return kpis
    }

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
                                Statistiques depuis l'API externe
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
                    {/* Alerte mode offline */}
                    {connectivityStatus === 'offline' && (
                        <Alert className="mb-4 border-yellow-500/50 bg-yellow-500/10">
                            <WifiOff className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            <AlertTitle className="text-yellow-600 dark:text-yellow-400">
                                Mode hors ligne
                            </AlertTitle>
                            <AlertDescription className="text-yellow-600/80 dark:text-yellow-400/80">
                                Vous êtes actuellement hors ligne. Les données affichées proviennent du cache.
                                {lastUpdated && (
                                    <span className="block mt-1">
                                        Dernière mise à jour : {formatRelativeTime(lastUpdated)}
                                    </span>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Alerte données obsolètes (plus de 30 minutes) */}
                    {lastUpdated && connectivityStatus === 'online' && (() => {
                        const ageMinutes = (Date.now() - lastUpdated) / 60000
                        return ageMinutes > 30
                    })() && (
                        <Alert className="mb-4 border-orange-500/50 bg-orange-500/10">
                            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            <AlertTitle className="text-orange-600 dark:text-orange-400">
                                Données obsolètes
                            </AlertTitle>
                            <AlertDescription className="text-orange-600/80 dark:text-orange-400/80">
                                Les données affichées sont anciennes (plus de 30 minutes).
                                Cliquez sur le bouton de rafraîchissement pour mettre à jour.
                            </AlertDescription>
                        </Alert>
                    )}
                    {isLoading ? (
                        <div className="space-y-6">
                            {/* Skeleton pour les KPI */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <SkeletonCard key={i} />
                                ))}
                            </div>
                        </div>
                    ) : error ? (
                        <div className="py-8 text-center">
                            <p className="text-destructive font-medium">{error}</p>
                            {error.includes('Données en cache') ? (
                                <p className="text-sm text-muted-foreground mt-2">
                                    Les données affichées peuvent être obsolètes. Réessayez de rafraîchir.
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground mt-2">
                                    Assurez-vous que l'URL de l'API de statistiques est correctement configurée.
                                </p>
                            )}
                        </div>
                    ) : stats ? (
                        <div className="space-y-6">
                            {/* KPI Cards - Afficher les données comme KPI si possible */}
                            {displayOptions?.showKPIs !== false && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {formatStatsAsKPIs(stats).map((kpi, index) => (
                                        <Card key={index}>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
                                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">
                                                    {typeof kpi.value === 'number' 
                                                        ? kpi.value.toLocaleString() 
                                                        : String(kpi.value)}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            {/* Affichage brut des données (pour debug/inspection) */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Données brutes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
                                        {JSON.stringify(stats, null, 2)}
                                    </pre>
                                </CardContent>
                            </Card>
                        </div>
                    ) : null}
                </div>
            </SheetContent>
        </Sheet>
    )
}

