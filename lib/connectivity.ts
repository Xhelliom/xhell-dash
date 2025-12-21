/**
 * Utilitaires pour la détection de connectivité réseau
 * 
 * Ce module fournit des fonctions pour détecter l'état de la connexion réseau
 * et adapter le comportement de l'application en conséquence.
 */

'use client'

import { useState, useEffect } from 'react'

/**
 * Type d'état de connectivité
 */
export type ConnectivityStatus = 'online' | 'offline' | 'unknown'

/**
 * Hook React pour surveiller l'état de connectivité
 * 
 * @returns État actuel de la connectivité
 * 
 * @example
 * ```tsx
 * const isOnline = useConnectivity()
 * if (!isOnline) {
 *   return <OfflineMessage />
 * }
 * ```
 */
export function useConnectivity(): ConnectivityStatus {
  const [status, setStatus] = useState<ConnectivityStatus>(() => {
    // Vérifier l'état initial
    if (typeof window !== 'undefined' && 'navigator' in window) {
      return navigator.onLine ? 'online' : 'offline'
    }
    return 'unknown'
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !('navigator' in window)) {
      return
    }

    // Fonction pour mettre à jour le statut
    const updateStatus = () => {
      setStatus(navigator.onLine ? 'online' : 'offline')
    }

    // Écouter les événements de changement de connectivité
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)

    // Vérifier périodiquement (toutes les 30 secondes) pour les cas où
    // l'API navigator.onLine n'est pas fiable
    const interval = setInterval(() => {
      updateStatus()
    }, 30000)

    // Nettoyer les listeners
    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
      clearInterval(interval)
    }
  }, [])

  return status
}

/**
 * Vérifie si l'application est en ligne
 * 
 * @returns true si en ligne, false sinon
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined' || !('navigator' in window)) {
    return true // Par défaut, considérer comme en ligne côté serveur
  }
  return navigator.onLine
}

/**
 * Vérifie si l'application est hors ligne
 * 
 * @returns true si hors ligne, false sinon
 */
export function isOffline(): boolean {
  return !isOnline()
}

/**
 * Obtient un message d'état de connectivité en français
 * 
 * @param status - Statut de connectivité
 * @returns Message descriptif
 */
export function getConnectivityMessage(status: ConnectivityStatus): string {
  switch (status) {
    case 'online':
      return 'En ligne'
    case 'offline':
      return 'Hors ligne'
    case 'unknown':
      return 'État inconnu'
    default:
      return 'État inconnu'
  }
}

