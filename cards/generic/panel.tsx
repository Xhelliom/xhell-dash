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
import { Loader2, BarChart3 } from 'lucide-react'
import type { GenericStats } from './types'
import type { StatsDisplayOptions, App } from '@/lib/types'
import type { StatsPanelProps } from '@/lib/card-registry'
import { getTemplateById } from '@/lib/stats-templates'

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
                        const templateId = app.statsConfig?.templateId || 'generic'

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
                const statsResponse = await fetch(`/api/apps/${appId}/stats/generic`)

                if (!statsResponse.ok) {
                    const errorData = await statsResponse.json()
                    throw new Error(errorData.error || 'Erreur lors de la récupération des statistiques')
                }

                const data = await statsResponse.json()
                setStats(data)
            } catch (err: any) {
                console.error('Erreur lors de la récupération des stats génériques:', err)
                setError(err.message || 'Impossible de charger les statistiques')
            } finally {
                setIsLoading(false)
            }
        }

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
                    <SheetTitle className="text-2xl">Statistiques {appName}</SheetTitle>
                    <SheetDescription>
                        Statistiques depuis l'API externe
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
                                Assurez-vous que l'URL de l'API de statistiques est correctement configurée.
                            </p>
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

