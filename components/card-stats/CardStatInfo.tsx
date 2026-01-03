/**
 * Composant CardStatInfo
 * 
 * Affiche une statistique sous forme d'information textuelle
 * Idéal pour afficher des informations comme le prochain épisode à télécharger,
 * le dernier film ajouté, etc.
 * 
 * Utilise le cache côté client pour améliorer les performances
 */

'use client'

import { useState, useEffect } from 'react'
import { SkeletonStat } from '@/components/ui/skeleton'
import type { App, CardStatConfig } from '@/lib/types'
import { getCachedData, setCachedData, getCacheKey, getCacheTimestamp } from '@/lib/cache-client'
import { formatRelativeTime } from '@/lib/date-utils'
import { fetchWithRetry } from '@/lib/api-retry'
import { createStructuredError, isRecoverableError } from '@/lib/error-handler'
import { getTimeoutFromApp } from '@/lib/timeout-config'

interface CardStatInfoProps {
  app: App
  config: CardStatConfig
}

/**
 * Interface pour une information structurée (comme un épisode à venir)
 * Le composant peut recevoir soit une string simple, soit un objet avec ces propriétés
 */
interface InfoData {
  // Titre principal (ex: nom de la série)
  title?: string
  // Sous-titre ou détail (ex: titre de l'épisode)
  subtitle?: string
  // Information secondaire (ex: S01E05)
  badge?: string
  // Date associée (ex: date de diffusion)
  date?: string
}

/**
 * Formate une date ISO en format lisible
 * @param dateString - Date au format ISO
 * @returns Date formatée en français (ex: "Lun. 15 janv.")
 */
function formatInfoDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    // Vérifier si c'est aujourd'hui
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    
    // Vérifier si c'est demain
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const isTomorrow = date.toDateString() === tomorrow.toDateString()
    
    if (isToday) {
      return "Aujourd'hui"
    }
    if (isTomorrow) {
      return 'Demain'
    }
    
    // Format court avec jour et date
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return dateString
  }
}

/**
 * Extrait les données d'information depuis les données API
 * Gère différents formats de données selon le template
 */
function extractInfoData(data: any, key: string): InfoData | string | null {
  // Si la clé pointe vers un tableau (comme upcomingEpisodes), prendre le premier élément
  const value = data[key]
  
  if (!value) {
    return null
  }
  
  // Si c'est un tableau, prendre le premier élément
  const item = Array.isArray(value) ? value[0] : value
  
  if (!item) {
    return null
  }
  
  // Si c'est une string simple
  if (typeof item === 'string') {
    return item
  }
  
  // Si c'est un objet avec des propriétés connues (format Sonarr/Radarr)
  if (typeof item === 'object') {
    // Format pour les épisodes Sonarr
    if ('seriesTitle' in item || 'episodeTitle' in item) {
      return {
        title: item.seriesTitle || item.title || 'Inconnu',
        subtitle: item.episodeTitle || item.subtitle,
        badge: item.seasonNumber !== undefined && item.episodeNumber !== undefined
          ? `S${String(item.seasonNumber).padStart(2, '0')}E${String(item.episodeNumber).padStart(2, '0')}`
          : undefined,
        date: item.airDate || item.airDateUtc || item.date,
      }
    }
    
    // Format pour les films Radarr
    if ('movieTitle' in item || 'releaseDate' in item) {
      return {
        title: item.movieTitle || item.title || 'Inconnu',
        subtitle: item.quality || item.subtitle,
        date: item.releaseDate || item.date,
      }
    }
    
    // Format générique - essayer de trouver des propriétés communes
    return {
      title: item.title || item.name || item.seriesTitle || 'Inconnu',
      subtitle: item.subtitle || item.description || item.episodeTitle,
      badge: item.badge || item.label,
      date: item.date || item.airDate || item.releaseDate,
    }
  }
  
  return String(item)
}

export function CardStatInfo({ app, config }: CardStatInfoProps) {
  const [infoData, setInfoData] = useState<InfoData | string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  // Intervalle de rafraîchissement configurable (défaut : 10 minutes)
  const refreshInterval = app.statsConfig?.refreshInterval || 600000
  // Extraire les valeurs de configuration pour les utiliser dans l'effet
  const templateId = app.statsConfig?.templateId
  const appId = app.id
  // Timeout adaptatif selon le type d'API
  const timeout = getTimeoutFromApp(app)
  
  // Déterminer la clé à utiliser
  // Si aucune clé n'est spécifiée, utiliser une clé par défaut selon le template
  const defaultKeys: Record<string, string> = {
    'sonarr': 'upcomingEpisodes',
    'radarr': 'upcomingMovies',
  }
  const statKey = config.key || defaultKeys[templateId || ''] || 'info'

  useEffect(() => {
    // Utiliser la clé par défaut si non spécifiée
    if (!statKey) {
      return
    }

    const cacheKey = getCacheKey(appId, templateId, statKey)

    // Charger les données depuis le cache si disponibles (optimistic UI)
    const cachedData = getCachedData<any>(cacheKey)
    if (cachedData) {
      const extracted = extractInfoData(cachedData, statKey)
      setInfoData(extracted)
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
          ? `/api/apps/${appId}/stats/${templateId}`
          : `/api/apps/${appId}/stats`
        
        const response = await fetchWithRetry(endpoint, {
          signal: AbortSignal.timeout(timeout),
        }, {
          maxRetries: 3,
          baseDelay: 1000,
        })
        
        if (response.ok) {
          const data = await response.json()
          const extracted = extractInfoData(data, statKey)
          setInfoData(extracted)
          setLastUpdated(Date.now())

          // Mettre en cache les données complètes avec TTL de 5 minutes
          setCachedData(cacheKey, data, 300000)
        } else {
          // Gérer les erreurs HTTP
          let errorMessage = `HTTP ${response.status}`
          try {
            const errorData = await response.json().catch(() => ({}))
            if (errorData.error) {
              errorMessage = errorData.error
            }
          } catch {
            // Si le parsing JSON échoue, utiliser le message par défaut
          }
          
          const error = new Error(errorMessage)
          const structuredError = createStructuredError(error, response)
          
          if (!isRecoverableError(structuredError)) {
            console.error('Erreur non récupérable:', structuredError.message)
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des infos:', error)
        const structuredError = createStructuredError(
          error instanceof Error ? error : new Error(String(error))
        )
        
        if (!isRecoverableError(structuredError)) {
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
  }, [appId, statKey, templateId, refreshInterval, timeout])

  // Rendu pour une string simple
  const renderSimpleInfo = (info: string) => (
    <span className="text-sm font-medium truncate" title={info}>
      {info}
    </span>
  )

  // Rendu pour des données structurées (épisode, film, etc.)
  const renderStructuredInfo = (info: InfoData) => (
    <div className="flex flex-col gap-0.5 min-w-0">
      {/* Ligne principale : badge + titre */}
      <div className="flex items-center gap-1.5 min-w-0">
        {info.badge && (
          <span className="text-xs font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">
            {info.badge}
          </span>
        )}
        <span className="text-sm font-medium truncate" title={info.title}>
          {info.title}
        </span>
      </div>
      {/* Ligne secondaire : sous-titre + date */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
        {info.subtitle && (
          <span className="truncate" title={info.subtitle}>
            {info.subtitle}
          </span>
        )}
        {info.date && (
          <span className="shrink-0 text-primary/80">
            {formatInfoDate(info.date)}
          </span>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-1 min-w-0">
      {/* Libellé */}
      <span className="text-xs text-muted-foreground">
        {config.label || app.statLabel || 'Information'}
      </span>
      
      {/* Contenu */}
      {isLoading && !infoData ? (
        <SkeletonStat />
      ) : infoData ? (
        typeof infoData === 'string'
          ? renderSimpleInfo(infoData)
          : renderStructuredInfo(infoData)
      ) : (
        <span className="text-sm text-muted-foreground italic">
          Aucune information disponible
        </span>
      )}
      
      {/* Dernière mise à jour */}
      {lastUpdated && (
        <span className="text-xs text-muted-foreground">
          Mis à jour {formatRelativeTime(lastUpdated)}
        </span>
      )}
    </div>
  )
}
