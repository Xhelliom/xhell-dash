/**
 * Composant PlexStatsPanel
 * 
 * Affiche un panneau modal avec les statistiques détaillées de Plex :
 * - KPI (nombre de films, séries, utilisateurs, etc.)
 * - Graphiques simples pour visualiser les données
 * - Liste des derniers médias ajoutés
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
import { Film, Tv, Users, Library, Calendar, Loader2, RefreshCw } from 'lucide-react'
import { SkeletonCard, SkeletonList } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import type { PlexStats, PlexRecentMedia } from './types'
import type { StatsDisplayOptions, App } from '@/lib/types'
import type { StatsPanelProps } from '@/lib/card-registry'
import { getTemplateById } from '@/lib/stats-templates'
import { getCachedData, setCachedData, getCacheKey, getCacheTimestamp } from '@/lib/cache-client'
import { formatRelativeTime, formatDateTime, getDataAgeColor } from '@/lib/date-utils'
import { fetchWithRetry } from '@/lib/api-retry'
import { createStructuredError, isRecoverableError } from '@/lib/error-handler'
import { validatePlexStats } from './validation'
import { useConnectivity } from '@/lib/connectivity'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { WifiOff, AlertTriangle } from 'lucide-react'
import { storeMetrics } from '@/lib/metrics-storage'

/**
 * Formate une date en format lisible (ex: "Il y a 2 jours")
 */
function formatRelativeDate(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
        return "Aujourd'hui"
    } else if (diffDays === 1) {
        return "Hier"
    } else if (diffDays < 7) {
        return `Il y a ${diffDays} jours`
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7)
        return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`
    } else {
        const months = Math.floor(diffDays / 30)
        return `Il y a ${months} mois`
    }
}

/**
 * Formate une date complète en format français
 */
function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

export function PlexStatsPanel({ open, onOpenChange, appId, appName }: StatsPanelProps) {
    const [stats, setStats] = useState<PlexStats | null>(null)
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
            const cacheKey = getCacheKey(appId, 'plex')
            const cachedData = getCachedData<PlexStats>(cacheKey)
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
            // Récupérer l'app pour avoir accès aux options d'affichage et au templateId
            let appTemplateId = 'plex' // Par défaut pour Plex (rétrocompatibilité)
            const cacheKey = getCacheKey(appId, 'plex')

            // Charger depuis le cache si disponible et pas de force refresh (optimistic UI)
            if (!forceRefresh) {
                const cachedData = getCachedData<PlexStats>(cacheKey)
                if (cachedData) {
                    setStats(cachedData)
                    const cachedTimestamp = getCacheTimestamp(cacheKey)
                    if (cachedTimestamp) {
                        setLastUpdated(cachedTimestamp)
                    }
                }
            }

            const appResponse = await fetch(`/api/apps`)
            let app: App | undefined
            let timeout = 10000 // Défaut : 10 secondes
            
            if (appResponse.ok) {
                const apps: App[] = await appResponse.json()
                app = apps.find((a) => a.id === appId)

                if (app) {
                    // Récupérer le templateId
                    appTemplateId = app.statsConfig?.templateId || 'plex'
                    
                    // Récupérer le timeout configuré
                    if (app.statsConfig?.timeout) {
                        timeout = app.statsConfig.timeout
                    }

                    if (app.statsConfig?.displayOptions) {
                        // Utiliser les options d'affichage de l'app
                        setDisplayOptions(app.statsConfig.displayOptions)
                    } else if (app.statsConfig?.templateId) {
                        // Si un template est défini mais pas d'options, utiliser les options par défaut du template
                        const template = getTemplateById(app.statsConfig.templateId)
                        if (template) {
                            setDisplayOptions(template.defaultDisplayOptions)
                        }
                    } else {
                        // Options par défaut si rien n'est configuré
                        setDisplayOptions({
                            showKPIs: true,
                            showLibraryChart: true,
                            showRecentMedia: true,
                            kpiOptions: {
                                showMovies: true,
                                showShows: true,
                                showEpisodes: true,
                                showUsers: true,
                                showLibraries: true,
                            },
                        })
                    }
                }
            }

            // Récupérer les statistiques depuis l'API spécialisée selon le templateId
            // Utiliser fetchWithRetry pour réessayer automatiquement en cas d'erreur
            const statsResponse = await fetchWithRetry(
                `/api/apps/${appId}/stats/${appTemplateId}`,
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
            const data = validatePlexStats(rawData)
            
            setStats(data)
            const now = Date.now()
            setLastUpdated(now)

            // Stocker les métriques dans l'historique pour les graphiques
            const metricsToStore = [
                { appId, templateId: appTemplateId, key: 'totalMovies', value: data.totalMovies, timestamp: now },
                { appId, templateId: appTemplateId, key: 'totalShows', value: data.totalShows, timestamp: now },
                { appId, templateId: appTemplateId, key: 'totalEpisodes', value: data.totalEpisodes, timestamp: now },
                { appId, templateId: appTemplateId, key: 'totalUsers', value: data.totalUsers, timestamp: now },
                { appId, templateId: appTemplateId, key: 'totalLibraries', value: data.totalLibraries, timestamp: now },
            ]
            storeMetrics(metricsToStore)

            // Mettre en cache avec TTL de 5 minutes
            setCachedData(cacheKey, data, 300000)
        } catch (err: any) {
            console.error('Erreur lors de la récupération des stats Plex:', err)
            
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
                const cacheKey = getCacheKey(appId, 'plex')
                const cachedData = getCachedData<PlexStats>(cacheKey)
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
     * Récupère les statistiques Plex depuis l'API et les options d'affichage depuis l'app
     */
    useEffect(() => {
        if (!open || !appId) return

        fetchData()
    }, [open, appId])

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
                                Vue d'ensemble de votre bibliothèque Plex
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
                            {/* Skeleton pour la liste des médias récents */}
                            <SkeletonList count={5} />
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
                                    Assurez-vous que le token Plex est correctement configuré dans les paramètres de l'application.
                                </p>
                            )}
                        </div>
                    ) : stats ? (
                        <div className="space-y-6">
                            {/* KPI Cards - Affichage conditionnel selon les options */}
                            {displayOptions?.showKPIs !== false && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {displayOptions?.kpiOptions?.showMovies !== false && (
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Films</CardTitle>
                                                <Film className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{stats.totalMovies}</div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {displayOptions?.kpiOptions?.showShows !== false && (
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Séries</CardTitle>
                                                <Tv className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{stats.totalShows}</div>
                                                {displayOptions?.kpiOptions?.showEpisodes !== false && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {stats.totalEpisodes} épisodes
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}

                                    {displayOptions?.kpiOptions?.showUsers !== false && (
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {displayOptions?.kpiOptions?.showLibraries !== false && (
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Bibliothèques</CardTitle>
                                                <Library className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{stats.totalLibraries}</div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}

                            {/* Graphique des bibliothèques - Affichage conditionnel */}
                            {displayOptions?.showLibraryChart !== false && stats.libraryStats && stats.libraryStats.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Répartition par bibliothèque</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {stats.libraryStats.map((lib) => {
                                                const total = stats.libraryStats.reduce((sum, l) => sum + l.count, 0)
                                                const percentage = total > 0 ? (lib.count / total) * 100 : 0

                                                return (
                                                    <div key={lib.name} className="space-y-1">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="font-medium">{lib.name}</span>
                                                            <span className="text-muted-foreground">
                                                                {lib.count} {lib.type === 'movie' ? 'films' : lib.type === 'show' ? 'séries' : 'éléments'}
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-muted rounded-full h-2">
                                                            <div
                                                                className="bg-primary h-2 rounded-full transition-all"
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Derniers médias ajoutés - Affichage conditionnel */}
                            {displayOptions?.showRecentMedia !== false && stats.recentMedia && stats.recentMedia.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="h-5 w-5" />
                                            Derniers médias ajoutés
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {stats.recentMedia.map((media, index) => (
                                                <div
                                                    key={`${media.ratingKey}-${index}`}
                                                    className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                                >
                                                    {/* Miniature */}
                                                    {media.thumb && (
                                                        <img
                                                            src={media.thumb}
                                                            alt={media.title}
                                                            className="w-16 h-24 object-cover rounded-sm"
                                                            onError={(e) => {
                                                                // Cacher l'image en cas d'erreur
                                                                e.currentTarget.style.display = 'none'
                                                            }}
                                                        />
                                                    )}

                                                    {/* Informations */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-semibold truncate">{media.title}</h4>
                                                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                                    <span className="capitalize">
                                                                        {media.type === 'movie' ? 'Film' : 'Épisode'}
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span>{media.library}</span>
                                                                    {media.year && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span>{media.year}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                                                                <div>{formatRelativeDate(media.addedAt)}</div>
                                                                <div className="text-xs mt-1">{formatDate(media.addedAt)}</div>
                                                            </div>
                                                        </div>
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

