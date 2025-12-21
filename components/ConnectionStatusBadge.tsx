/**
 * Composant Badge de statut de connexion
 * 
 * Affiche un badge indiquant le statut de connexion d'une application :
 * - 🟢 En ligne (dernière requête réussie < 1 min)
 * - 🟡 En attente (requête en cours)
 * - 🔴 Hors ligne (dernière requête échouée)
 */

'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { App } from '@/lib/types'
import { getCacheTimestamp, getCacheKey } from '@/lib/cache-client'

/**
 * Type de statut de connexion
 */
export type ConnectionStatus = 'online' | 'pending' | 'offline' | 'unknown'

/**
 * Props pour le composant ConnectionStatusBadge
 */
interface ConnectionStatusBadgeProps {
  /** Application à surveiller */
  app: App
  /** Taille du badge : 'sm' (petit) ou 'md' (moyen) */
  size?: 'sm' | 'md'
  /** Classe CSS supplémentaire */
  className?: string
}

/**
 * Récupère le timestamp le plus récent parmi toutes les clés de cache pour une app
 * 
 * @param appId - ID de l'application
 * @param templateId - ID du template
 * @returns Timestamp le plus récent, ou null si aucune donnée trouvée
 */
function getLatestCacheTimestamp(appId: string, templateId: string): number | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null
    }

    // Préfixe pour les clés avec templateId et key spécifique (se termine par _)
    const prefixWithKey = `xhell_dash_cache_${appId}_${templateId}_`
    // Clé exacte pour les clés avec seulement templateId (sans key supplémentaire)
    const exactKey = `xhell_dash_cache_${appId}_${templateId}`
    
    let latestTimestamp: number | null = null

    // Parcourir toutes les clés de localStorage
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (!key || !key.startsWith('xhell_dash_cache_')) {
        continue
      }

      // Vérifier si cette clé correspond à notre app et template
      // Soit elle commence par appId_templateId_ (avec une key), soit elle est exactement appId_templateId
      const isMatchingKey = key.startsWith(prefixWithKey) || key === exactKey
      
      if (isMatchingKey) {
        try {
          const cached = window.localStorage.getItem(key)
          if (cached) {
            const entry = JSON.parse(cached)
            // Vérifier que les données ont un timestamp
            if (entry.timestamp) {
              const now = Date.now()
              const age = now - entry.timestamp
              const ttl = entry.ttl || 300000 // TTL par défaut de 5 minutes
              
              // Accepter les données si elles ne sont pas expirées OU si elles sont récentes (< 20 minutes)
              // Même si expirées, on les considère pour déterminer le statut de connexion
              if (age <= ttl || age < 1200000) {
                if (latestTimestamp === null || entry.timestamp > latestTimestamp) {
                  latestTimestamp = entry.timestamp
                }
              }
            }
          }
        } catch {
          // Ignorer les clés corrompues
          continue
        }
      }
    }

    return latestTimestamp
  } catch (error) {
    console.warn('Erreur lors de la recherche du cache:', error)
    return null
  }
}

/**
 * Détermine le statut de connexion d'une application
 * 
 * @param app - Application à vérifier
 * @returns Statut de connexion
 */
function getConnectionStatus(app: App): ConnectionStatus {
  const templateId = app.statsConfig?.templateId || 'generic'
  
  // Chercher le timestamp le plus récent parmi toutes les clés de cache pour cette app
  const lastUpdate = getLatestCacheTimestamp(app.id, templateId)

  if (!lastUpdate) {
    return 'unknown'
  }

  const now = Date.now()
  const age = now - lastUpdate
  const ageMinutes = age / 60000

  // Si la dernière mise à jour est très récente (< 1 minute), considérer comme en ligne
  if (ageMinutes < 1) {
    return 'online'
  }

  // Si la dernière mise à jour est récente (< 5 minutes), considérer comme en ligne
  if (ageMinutes < 5) {
    return 'online'
  }

  // Si la dernière mise à jour est ancienne (> 15 minutes), considérer comme hors ligne
  if (ageMinutes > 15) {
    return 'offline'
  }

  // Entre 5 et 15 minutes, considérer comme en ligne (transition)
  return 'online'
}

/**
 * Composant Badge de statut de connexion
 */
export function ConnectionStatusBadge({ app, size = 'sm', className }: ConnectionStatusBadgeProps) {
  const [status, setStatus] = useState<ConnectionStatus>(() => getConnectionStatus(app))
  const [isChecking, setIsChecking] = useState(false)

  // Vérifier périodiquement le statut (toutes les 30 secondes)
  useEffect(() => {
    const updateStatus = () => {
      setIsChecking(true)
      const newStatus = getConnectionStatus(app)
      setStatus(newStatus)
      setIsChecking(false)
    }

    // Vérifier immédiatement
    updateStatus()

    // Vérifier périodiquement
    const interval = setInterval(updateStatus, 30000) // 30 secondes

    return () => clearInterval(interval)
  }, [app.id, app.statsConfig?.templateId])

  // Styles selon le statut
  const statusStyles = {
    online: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    offline: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    unknown: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
  }

  const statusLabels = {
    online: 'En ligne',
    pending: 'En attente',
    offline: 'Hors ligne',
    unknown: 'Inconnu',
  }

  const sizeStyles = {
    sm: 'text-xs px-2 py-1 min-h-[20px]',
    md: 'text-sm px-3 py-1.5 min-h-[28px] shadow-sm',
  }

  const dotSizes = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors',
        statusStyles[status],
        sizeStyles[size],
        isChecking && 'opacity-70',
        className
      )}
      title={statusLabels[status]}
    >
      <span
        className={cn(
          'rounded-full flex-shrink-0',
          dotSizes[size],
          status === 'online' && 'bg-green-500',
          status === 'pending' && 'bg-yellow-500 animate-pulse',
          status === 'offline' && 'bg-red-500',
          status === 'unknown' && 'bg-gray-500'
        )}
      />
      {size === 'md' && <span className="whitespace-nowrap">{statusLabels[status]}</span>}
    </div>
  )
}

