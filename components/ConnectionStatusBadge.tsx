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
 * Détermine le statut de connexion d'une application
 * 
 * @param app - Application à vérifier
 * @returns Statut de connexion
 */
function getConnectionStatus(app: App): ConnectionStatus {
  const templateId = app.statsConfig?.templateId || 'generic'
  const cacheKey = getCacheKey(app.id, templateId)
  const lastUpdate = getCacheTimestamp(cacheKey)

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

  // Sinon, statut inconnu
  return 'unknown'
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
    sm: 'h-2 w-2 text-xs px-1.5 py-0.5',
    md: 'h-2.5 w-2.5 text-sm px-2 py-1',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors',
        statusStyles[status],
        sizeStyles[size],
        isChecking && 'opacity-70',
        className
      )}
      title={statusLabels[status]}
    >
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          status === 'online' && 'bg-green-500',
          status === 'pending' && 'bg-yellow-500 animate-pulse',
          status === 'offline' && 'bg-red-500',
          status === 'unknown' && 'bg-gray-500'
        )}
      />
      {size === 'md' && <span>{statusLabels[status]}</span>}
    </div>
  )
}

