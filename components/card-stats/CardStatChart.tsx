/**
 * Composant CardStatChart
 * 
 * Affiche une statistique sous forme de graphique (courbe)
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { ChartContainer, ChartConfig } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { SkeletonChart } from '@/components/ui/skeleton'
import type { App, CardStatConfig, PlexStats } from '@/lib/types'
import { getCachedData, setCachedData, getCacheKey, getCacheTimestamp } from '@/lib/cache-client'
import { formatRelativeTime } from '@/lib/date-utils'
import { fetchWithRetry } from '@/lib/api-retry'
import { createStructuredError, isRecoverableError } from '@/lib/error-handler'
import { storeMetric, getDailyAggregatedMetrics } from '@/lib/metrics-storage'
import { getTimeoutFromApp } from '@/lib/timeout-config'

interface CardStatChartProps {
  app: App
  config: CardStatConfig
}

export function CardStatChart({ app, config }: CardStatChartProps) {
  const [chartData, setChartData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const shouldRetryRef = useRef(true)

  // Intervalle de rafraîchissement configurable (défaut : 10 minutes)
  const refreshInterval = app.statsConfig?.refreshInterval || 600000
  const templateId = app.statsConfig?.templateId
  // Période d'historique configurable (défaut : 7 jours)
  const historyPeriod = app.statsConfig?.historyPeriod || 7

  useEffect(() => {
    // Réinitialiser shouldRetry quand les dépendances changent
    shouldRetryRef.current = true
    setError(null)
    
    // Vérifier que toutes les informations nécessaires sont présentes
    if (!config.key || !templateId || typeof templateId !== 'string' || templateId.trim() === '') {
      return
    }

    const cacheKey = getCacheKey(app.id, templateId, config.key)

    // Fonction pour charger les données historiques depuis le stockage
    const loadHistoricalData = () => {
      if (!config.key || !templateId) return
      
      const dailyMetrics = getDailyAggregatedMetrics(
        app.id,
        templateId,
        config.key,
        historyPeriod
      )
      
      if (dailyMetrics.length > 0) {
        // Formater les données pour le graphique
        const formattedData = dailyMetrics.map((entry, index) => {
          const date = new Date(entry.date)
          const dayName = index === dailyMetrics.length - 1 
            ? 'Aujourd\'hui' 
            : date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
          
          return {
            name: dayName,
            value: entry.value,
            date: entry.date,
          }
        })
        
        setChartData(formattedData)
        
        // Utiliser le timestamp de la dernière métrique
        if (dailyMetrics.length > 0) {
          setLastUpdated(dailyMetrics[dailyMetrics.length - 1].timestamp)
        }
      } else {
        // Si pas de données historiques, afficher un message ou des données vides
        setChartData([])
      }
    }
    
    // Charger les données historiques immédiatement
    loadHistoricalData()
    
    // Charger les données depuis le cache si disponibles (optimistic UI)
    const cachedData = getCachedData<any>(cacheKey)
    if (cachedData) {
      const cachedTimestamp = getCacheTimestamp(cacheKey)
      if (cachedTimestamp) {
        setLastUpdated(cachedTimestamp)
      }
    }

    const fetchStats = async () => {
      // Si on ne doit plus réessayer (erreur de configuration), ne rien faire
      if (!shouldRetryRef.current) return
      
      setIsLoading(true)
      setError(null)
      try {
        const endpoint = `/api/apps/${app.id}/stats/${templateId}`
        // Utiliser le timeout adaptatif selon le type d'API
        const timeout = getTimeoutFromApp(app)
        
        // Utiliser fetchWithRetry pour réessayer automatiquement en cas d'erreur
        const response = await fetchWithRetry(endpoint, {
          signal: AbortSignal.timeout(timeout),
        }, {
          maxRetries: 3,
          baseDelay: 1000,
        })
        
        if (response.ok) {
          const data: PlexStats = await response.json()
          const statKey = config.key!
          const value = (data as any)[statKey] || 0
          
          // Stocker la métrique dans l'historique
          if (templateId && config.key && typeof value === 'number') {
            storeMetric({
              appId: app.id,
              templateId: templateId,
              key: config.key,
              value: value,
              timestamp: Date.now(),
            })
          }
          
          // Recharger les données historiques pour mettre à jour le graphique
          loadHistoricalData()
          
          setLastUpdated(Date.now())

          // Mettre en cache avec TTL de 5 minutes
          setCachedData(cacheKey, data, 300000)
          // Réinitialiser l'état d'erreur si la requête réussit
          setError(null)
          shouldRetryRef.current = true
        } else {
          // Essayer d'extraire le message d'erreur depuis le body de la réponse
          let errorMessage = `HTTP ${response.status}`
          let errorHint: string | undefined
          try {
            const errorData = await response.json().catch(() => ({}))
            if (errorData.error) {
              errorMessage = errorData.error
            }
            if (errorData.hint) {
              errorHint = errorData.hint
            }
          } catch {
            // Si le parsing JSON échoue, utiliser le message par défaut
          }
          
          // Gérer les erreurs HTTP avec le message extrait
          const error = new Error(errorMessage)
          const structuredError = createStructuredError(error, response, errorHint)
          
          // Si c'est une erreur 400 (configuration), arrêter les tentatives futures
          if (response.status === 400) {
            setError(errorMessage)
            shouldRetryRef.current = false
            console.error('Erreur de configuration:', errorMessage)
            if (errorHint) {
              console.error('Conseil:', errorHint)
            }
          } else if (!isRecoverableError(structuredError)) {
            console.error('Erreur non récupérable:', structuredError.message)
            if (structuredError.hint) {
              console.error('Conseil:', structuredError.hint)
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des stats:', error)
        const structuredError = createStructuredError(
          error instanceof Error ? error : new Error(String(error))
        )
        
        // En cas d'erreur récupérable, garder les données en cache affichées
        if (!isRecoverableError(structuredError)) {
          console.warn('Erreur non récupérable:', structuredError.message)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()

    // Rafraîchir selon l'intervalle configuré
    // L'intervalle sera vérifié dans fetchStats grâce à shouldRetryRef
    const interval = setInterval(() => {
      if (shouldRetryRef.current) {
        fetchStats()
      }
    }, refreshInterval)
    return () => clearInterval(interval)
  }, [app.id, config.key, templateId, refreshInterval, historyPeriod])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {config.label || app.statLabel || 'Statistique'}
        </span>
        {lastUpdated && (
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(lastUpdated)}
          </span>
        )}
      </div>
      {isLoading ? (
        <SkeletonChart />
      ) : error ? (
        <div className="h-24 flex items-center justify-center px-2">
          <span className="text-xs text-muted-foreground text-center">{error}</span>
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

