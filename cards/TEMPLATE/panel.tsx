/**
 * Composant Panel pour les statistiques détaillées
 * 
 * Remplacez "Template" par le nom de votre carte
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
import { Loader2 } from 'lucide-react'
import type { TemplateStats } from './types'
import type { StatsDisplayOptions, App } from '@/lib/types'
import type { StatsPanelProps } from '@/lib/card-registry'
import { getTemplateById } from '@/lib/stats-templates'

/**
 * Composant du panneau de statistiques
 * 
 * Affiche les statistiques détaillées dans un Sheet (panneau latéral)
 */
export function TemplateStatsPanel({ open, onOpenChange, appId, appName }: StatsPanelProps) {
    const [stats, setStats] = useState<TemplateStats | null>(null)
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
                        const templateId = app.statsConfig?.templateId || 'template'

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

                // Récupérer les statistiques depuis l'API
                const statsResponse = await fetch(`/api/apps/${appId}/stats/template`)

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
                        Vue d'ensemble de vos statistiques
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
                        </div>
                    ) : stats ? (
                        <div className="space-y-6">
                            {/* Exemple : KPI Cards */}
                            {displayOptions?.showKPIs !== false && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Total</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{stats.totalItems}</div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">En attente</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{stats.pendingItems}</div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Ajoutez d'autres sections selon vos besoins */}
                        </div>
                    ) : null}
                </div>
            </SheetContent>
        </Sheet>
    )
}

