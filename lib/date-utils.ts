/**
 * Utilitaires pour le formatage des dates
 * 
 * Fonctions pour formater les dates de manière lisible en français
 */

/**
 * Formate une date en format relatif (ex: "Il y a 2 minutes", "Il y a 1 heure")
 * 
 * @param timestamp - Timestamp en millisecondes
 * @returns Chaîne formatée en français
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diffMs = now - timestamp

  // Moins d'une minute
  if (diffMs < 60000) {
    const seconds = Math.floor(diffMs / 1000)
    if (seconds < 10) {
      return "À l'instant"
    }
    return `Il y a ${seconds} seconde${seconds > 1 ? 's' : ''}`
  }

  // Moins d'une heure
  if (diffMs < 3600000) {
    const minutes = Math.floor(diffMs / 60000)
    if (minutes === 1) {
      return "Il y a 1 minute"
    }
    return `Il y a ${minutes} minutes`
  }

  // Moins d'un jour
  if (diffMs < 86400000) {
    const hours = Math.floor(diffMs / 3600000)
    if (hours === 1) {
      return "Il y a 1 heure"
    }
    return `Il y a ${hours} heures`
  }

  // Moins d'une semaine
  if (diffMs < 604800000) {
    const days = Math.floor(diffMs / 86400000)
    if (days === 1) {
      return "Hier"
    }
    return `Il y a ${days} jours`
  }

  // Moins d'un mois
  if (diffMs < 2592000000) {
    const weeks = Math.floor(diffMs / 604800000)
    if (weeks === 1) {
      return "Il y a 1 semaine"
    }
    return `Il y a ${weeks} semaines`
  }

  // Moins d'un an
  if (diffMs < 31536000000) {
    const months = Math.floor(diffMs / 2592000000)
    if (months === 1) {
      return "Il y a 1 mois"
    }
    return `Il y a ${months} mois`
  }

  // Plus d'un an
  const years = Math.floor(diffMs / 31536000000)
  if (years === 1) {
    return "Il y a 1 an"
  }
  return `Il y a ${years} ans`
}

/**
 * Formate une date complète en format français
 * 
 * @param timestamp - Timestamp en millisecondes ou string ISO
 * @returns Date formatée (ex: "15 janvier 2024")
 */
export function formatFullDate(timestamp: number | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Formate une date avec l'heure en format français
 * 
 * @param timestamp - Timestamp en millisecondes ou string ISO
 * @returns Date et heure formatées (ex: "15 janvier 2024 à 14:30")
 */
export function formatDateTime(timestamp: number | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp)
  const dateStr = date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const timeStr = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${dateStr} à ${timeStr}`
}

/**
 * Détermine la couleur du badge selon l'ancienneté des données
 * 
 * @param timestamp - Timestamp en millisecondes
 * @returns Couleur du badge : 'green' (< 5min), 'orange' (< 15min), 'red' (> 15min)
 */
export function getDataAgeColor(timestamp: number): 'green' | 'orange' | 'red' {
  const now = Date.now()
  const diffMs = now - timestamp
  const diffMinutes = diffMs / 60000

  if (diffMinutes < 5) {
    return 'green'
  } else if (diffMinutes < 15) {
    return 'orange'
  } else {
    return 'red'
  }
}

