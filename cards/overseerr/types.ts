/**
 * Types TypeScript spécifiques à la carte Overseerr
 * 
 * Ces types sont utilisés uniquement par la carte Overseerr
 * et peuvent être étendus selon les besoins
 */

/**
 * Interface pour les statistiques Overseerr
 */
export interface OverseerrStats {
  // KPI principaux
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  declinedRequests: number
  processingRequests: number
  availableMedia: number
  totalMovies: number
  totalTvShows: number
  totalUsers: number
  
  // Statistiques de demandes
  requestStats: {
    total: number
    pending: number
    approved: number
    declined: number
    processing: number
    available: number
  }
}

