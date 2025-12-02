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
import { Film, Tv, Users, Library, Calendar, Loader2 } from 'lucide-react'
import type { PlexStats, PlexRecentMedia, StatsDisplayOptions, App } from '@/lib/types'
import { getTemplateById } from '@/lib/stats-templates'

interface PlexStatsPanelProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    appId: string
    appName: string
}

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

export function PlexStatsPanel({ open, onOpenChange, appId, appName }: PlexStatsPanelProps) {
    const [stats, setStats] = useState<PlexStats | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [displayOptions, setDisplayOptions] = useState<StatsDisplayOptions | null>(null)

    /**
     * Récupère les statistiques Plex depuis l'API et les options d'affichage depuis l'app
     */
    useEffect(() => {
        if (!open || !appId) return

        const fetchData = async () => {
            setIsLoading(true)
            setError(null)

            try {
                // Récupérer l'app pour avoir accès aux options d'affichage et au templateId
                let appTemplateId = 'plex' // Par défaut pour Plex (rétrocompatibilité)
                const appResponse = await fetch(`/api/apps`)
                if (appResponse.ok) {
                    const apps: App[] = await appResponse.json()
                    const app = apps.find((a) => a.id === appId)

                    if (app) {
                        // Récupérer le templateId
                        appTemplateId = app.statsConfig?.templateId || 'plex'

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
                const statsResponse = await fetch(`/api/apps/${appId}/stats/${appTemplateId}`)

                if (!statsResponse.ok) {
                    const errorData = await statsResponse.json()
                    throw new Error(errorData.error || 'Erreur lors de la récupération des statistiques')
                }

                const data = await statsResponse.json()
                setStats(data)
            } catch (err: any) {
                console.error('Erreur lors de la récupération des stats Plex:', err)
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
                        Vue d'ensemble de votre bibliothèque Plex
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
                            <p className="text-destructive">{error}</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Assurez-vous que le token Plex est correctement configuré dans les paramètres de l'application.
                            </p>
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
                                                            className="w-16 h-24 object-cover rounded"
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

