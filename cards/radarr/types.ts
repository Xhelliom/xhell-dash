/**
 * Types TypeScript spécifiques à la carte Radarr
 * 
 * Ces types sont utilisés uniquement par la carte Radarr
 * et peuvent être étendus selon les besoins
 */

/**
 * Interface pour les statistiques Radarr
 */
export interface RadarrStats {
  // KPI principaux
  totalMovies: number
  downloadedMovies: number
  missingMovies: number
  queuePending: number
  queueDownloading: number
  queueCompleted: number
  queueFailed: number
  
  // Statistiques de la queue
  queueStats: {
    total: number
    pending: number
    downloading: number
    completed: number
    failed: number
  }
}

/**
 * Interface pour un élément de la queue Radarr
 */
export interface RadarrQueueItem {
  id: number
  movieId: number
  title: string
  status: string
  size: number
  downloadId: string
  timeleft?: string
}

