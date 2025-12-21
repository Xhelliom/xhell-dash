/**
 * Composant CardStatNumber
 * 
 * Affiche une statistique sous forme de nombre simple
 * Utilise le cache côté client pour améliorer les performances
 */

'use client'

import { useState, useEffect } from 'react'
import { SkeletonStat } from '@/components/ui/skeleton'
import type { App, CardStatConfig, PlexStats } from '@/lib/types'
import { getCachedData, setCachedData, getCacheKey, getCacheTimestamp } from '@/lib/cache-client'
import { formatRelativeTime } from '@/lib/date-utils'
import { fetchWithRetry } from '@/lib/api-retry'
import { createStructuredError, isRecoverableError } from '@/lib/error-handler'
import { getTimeoutFromApp } from '@/lib/timeout-config'

interface CardStatNumberProps {
  app: App
  config: CardStatConfig
}

export function CardStatNumber({ app, config }: CardStatNumberProps) {
  const [statValue, setStatValue] = useState<string | number | undefined>(app.statValue)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  // Intervalle de rafraîchissement configurable (défaut : 10 minutes)
  const refreshInterval = app.statsConfig?.refreshInterval || 600000

  useEffect(() => {
    if (!config.key) return

    const templateId = app.statsConfig?.templateId
    const cacheKey = getCacheKey(app.id, templateId, config.key)

    // Charger les données depuis le cache si disponibles (optimistic UI)
    const cachedData = getCachedData<any>(cacheKey)
    if (cachedData) {
      const value = cachedData[config.key] || 
                   (typeof cachedData === 'number' ? cachedData : 
                   cachedData.value || cachedData.count || cachedData.total)
      setStatValue(value)
      const cachedTimestamp = getCacheTimestamp(cacheKey)
      if (cachedTimestamp) {
        setLastUpdated(cachedTimestamp)
      }
    }

    const fetchStats = async () => {
      setIsLoading(true)
      try {
        // Utiliser l'API générique ou selon le template
        const endpoint = templateId
          ? `/api/apps/${app.id}/stats/${templateId}`
          : `/api/apps/${app.id}/stats`
        
        // Utiliser le timeout adaptatif selon le type d'API
        const timeout = getTimeoutFromApp(app)
        const response = await fetchWithRetry(endpoint, {
          signal: AbortSignal.timeout(timeout),
        }, {
          maxRetries: 3,
          baseDelay: 1000,
        })
        
        if (response.ok) {
          const data = await response.json()
          const value = (data as any)[config.key!] || 
                       (typeof data === 'number' ? data : 
                       data.value || data.count || data.total)
          setStatValue(value)
          setLastUpdated(Date.now())

          // Mettre en cache les données complètes avec TTL de 5 minutes
          setCachedData(cacheKey, data, 300000)
        } else {
          // Gérer les erreurs HTTP
          const error = new Error(`HTTP ${response.status}`)
          const structuredError = createStructuredError(error, response)
          
          // Si l'erreur est récupérable, garder les données en cache
          if (!isRecoverableError(structuredError)) {
            console.error('Erreur non récupérable:', structuredError.message)
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des stats:', error)
        const structuredError = createStructuredError(
          error instanceof Error ? error : new Error(String(error))
        )
        
        // En cas d'erreur récupérable, garder les données en cache affichées
        if (!isRecoverableError(structuredError)) {
          // Erreur non récupérable, on pourrait afficher un message à l'utilisateur
          console.warn('Erreur non récupérable:', structuredError.message)
        }
      } finally {
        setIsLoading(false)
      }
    }

    // Charger immédiatement
    fetchStats()

    // Rafraîchir selon l'intervalle configuré
    const interval = setInterval(fetchStats, refreshInterval)
    return () => clearInterval(interval)
  }, [app.id, config.key, app.statsConfig?.templateId, refreshInterval])

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="text-sm text-muted-foreground">
          {config.label || app.statLabel || 'Statistique'}:
        </span>
      {isLoading ? (
        <SkeletonStat />
      ) : (
        <span className="text-lg font-semibold">{statValue ?? 'N/A'}</span>
      )}
      </div>
      {lastUpdated && (
        <span className="text-xs text-muted-foreground">
          Mis à jour {formatRelativeTime(lastUpdated)}
        </span>
      )}
    </div>
  )
}

