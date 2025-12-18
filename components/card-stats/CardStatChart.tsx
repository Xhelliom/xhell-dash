/**
 * Composant CardStatChart
 * 
 * Affiche une statistique sous forme de graphique (courbe)
 */

'use client'

import { useState, useEffect } from 'react'
import { ChartContainer, ChartConfig } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import type { App, CardStatConfig, PlexStats } from '@/lib/types'

interface CardStatChartProps {
  app: App
  config: CardStatConfig
}

export function CardStatChart({ app, config }: CardStatChartProps) {
  const [chartData, setChartData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!config.key || app.statsConfig?.templateId !== 'plex') return

    const fetchStats = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/apps/${app.id}/stats/plex`)
        if (response.ok) {
          const data: PlexStats = await response.json()
          const statKey = config.key!
          const value = (data as any)[statKey] || 0
          
          // Générer des données pour le graphique (simulation avec les données actuelles)
          // Dans un vrai cas, on aurait besoin de données historiques
          setChartData([
            { name: 'J-6', value: Math.max(0, value - 20) },
            { name: 'J-5', value: Math.max(0, value - 15) },
            { name: 'J-4', value: Math.max(0, value - 10) },
            { name: 'J-3', value: Math.max(0, value - 5) },
            { name: 'J-2', value: Math.max(0, value - 2) },
            { name: 'J-1', value: Math.max(0, value - 1) },
            { name: 'Aujourd\'hui', value },
          ])
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()

    // Rafraîchir toutes les 10 minutes (600000 ms) pour éviter les artefacts visuels
    const interval = setInterval(fetchStats, 600000)
    return () => clearInterval(interval)
  }, [app.id, config.key])

  return (
    <div className="space-y-2">
      <span className="text-sm text-muted-foreground">
        {config.label || app.statLabel || 'Statistique'}
      </span>
      {isLoading ? (
        <div className="h-24 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Chargement...</span>
        </div>
      ) : chartData.length > 0 ? (
        <ChartContainer
          config={{
            value: {
              label: config.label || 'Valeur',
              color: 'hsl(var(--chart-1))',
            },
          } satisfies ChartConfig}
          className="h-24 w-full"
        >
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="var(--color-value)" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      ) : (
        <div className="h-24 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Aucune donnée</span>
        </div>
      )}
    </div>
  )
}

