/**
 * Types TypeScript spécifiques à la carte Lidarr
 * 
 * Ces types sont utilisés uniquement par la carte Lidarr
 * et peuvent être étendus selon les besoins
 */

/**
 * Interface pour les statistiques Lidarr
 */
export interface LidarrStats {
  // KPI principaux
  totalArtists: number
  totalAlbums: number
  downloadedAlbums: number
  missingAlbums: number
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

