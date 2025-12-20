/**
 * Types TypeScript spécifiques à la carte Plex
 * 
 * Ces types sont utilisés uniquement par la carte Plex
 * et peuvent être étendus selon les besoins
 */

/**
 * Interface pour les statistiques Plex
 */
export interface PlexStats {
  // KPI principaux
  totalMovies: number
  totalShows: number
  totalEpisodes: number
  totalUsers: number
  totalLibraries: number
  
  // Derniers médias ajoutés
  recentMedia: PlexRecentMedia[]
  
  // Statistiques par type de bibliothèque
  libraryStats: PlexLibraryStat[]
}

/**
 * Interface pour un média récemment ajouté dans Plex
 */
export interface PlexRecentMedia {
  title: string
  type: 'movie' | 'episode'
  library: string
  addedAt: string
  year?: number
  thumb?: string
  ratingKey: string
}

/**
 * Interface pour les statistiques d'une bibliothèque Plex
 */
export interface PlexLibraryStat {
  name: string
  type: 'movie' | 'show' | 'music' | 'photo'
  count: number
}

/**
 * Options d'affichage pour les KPI Plex
 */
export interface PlexKPIOptions {
  showMovies?: boolean
  showShows?: boolean
  showEpisodes?: boolean
  showUsers?: boolean
  showLibraries?: boolean
}

