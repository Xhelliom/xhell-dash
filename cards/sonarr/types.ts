/**
 * Types TypeScript spécifiques à la carte Sonarr
 * 
 * Ces types sont utilisés uniquement par la carte Sonarr
 * et peuvent être étendus selon les besoins
 */

/**
 * Interface pour les statistiques Sonarr
 */
export interface SonarrStats {
  // KPI principaux
  totalSeries: number
  totalEpisodes: number
  queuePending: number
  queueDownloading: number
  queueCompleted: number
  queueFailed: number
  
  // Prochains épisodes à venir
  upcomingEpisodes: SonarrUpcomingEpisode[]
  
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
 * Interface pour un épisode à venir
 */
export interface SonarrUpcomingEpisode {
  seriesTitle: string
  episodeTitle: string
  seasonNumber: number
  episodeNumber: number
  airDate: string
  airDateUtc: string
}

/**
 * Interface pour un élément de la queue Sonarr
 */
export interface SonarrQueueItem {
  id: number
  seriesId: number
  episodeId: number
  title: string
  status: string
  size: number
  downloadId: string
  timeleft?: string
}

