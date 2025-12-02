/**
 * Types TypeScript pour l'application dashboard
 * 
 * Ce fichier définit les interfaces et types utilisés dans toute l'application
 */

/**
 * Type de logo pour une application
 * - 'icon' : utilise une icône Lucide React
 * - 'url' : utilise une URL d'image
 */
export type LogoType = 'icon' | 'url'

/**
 * Interface représentant une application dans le dashboard
 * 
 * Chaque application contient :
 * - id : identifiant unique généré automatiquement
 * - name : nom affiché de l'application
 * - url : URL de redirection quand on clique sur la card
 * - logo : soit le nom d'une icône Lucide, soit une URL d'image
 * - logoType : indique si le logo est une icône ou une URL
 * - statApiUrl : URL optionnelle pour récupérer les statistiques
 * - statLabel : libellé de la statistique (ex: "Films", "Utilisateurs")
 * - statValue : valeur actuelle de la statistique (mise à jour via API)
 */
export interface App {
  id: string
  name: string
  url: string
  logo: string
  logoType: LogoType
  statApiUrl?: string
  statLabel?: string
  statValue?: string | number
  // Champs spécifiques pour Plex
  plexToken?: string
  plexServerUrl?: string
  // Configuration des statistiques
  statsConfig?: StatsConfig
}

/**
 * Interface pour créer une nouvelle application (sans l'id qui sera généré)
 */
export interface CreateAppInput {
  name: string
  url: string
  logo: string
  logoType: LogoType
  statApiUrl?: string
  statLabel?: string
  plexToken?: string
  plexServerUrl?: string
  statsConfig?: StatsConfig
}

/**
 * Interface pour mettre à jour une application (tous les champs sont optionnels sauf l'id)
 */
export interface UpdateAppInput {
  name?: string
  url?: string
  logo?: string
  logoType?: LogoType
  statApiUrl?: string
  statLabel?: string
  statValue?: string | number
  plexToken?: string
  plexServerUrl?: string
  statsConfig?: StatsConfig
}

/**
 * Types de statistiques supportés par l'application
 */
export type StatsType = 'generic' | 'plex' | 'sonarr'

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

/**
 * Options d'affichage pour les statistiques
 */
export interface StatsDisplayOptions {
  // Afficher les KPI
  showKPIs?: boolean
  // Afficher le graphique des bibliothèques
  showLibraryChart?: boolean
  // Afficher les derniers médias ajoutés
  showRecentMedia?: boolean
  // Options spécifiques pour les KPI (si applicable)
  kpiOptions?: PlexKPIOptions
}

/**
 * Type de statistique à afficher sur la carte
 * - 'number' : affiche simplement un nombre
 * - 'chart' : affiche un graphique (courbe)
 * - 'plex-recent' : pour Plex, affiche les 3 dernières images des médias ajoutés
 */
export type CardStatType = 'number' | 'chart' | 'plex-recent'

/**
 * Configuration de la statistique affichée sur la carte
 */
export interface CardStatConfig {
  // Type de statistique à afficher
  type: CardStatType
  // Clé de la statistique à afficher (ex: 'totalMovies', 'totalShows', etc.)
  // Pour 'plex-recent', cette clé n'est pas utilisée
  key?: string
  // Libellé à afficher (optionnel, utilise statLabel par défaut)
  label?: string
}

/**
 * Configuration des statistiques pour une application
 */
export interface StatsConfig {
  // Template de stats utilisé (ex: 'plex', 'sonarr', 'generic')
  templateId?: string
  // Options d'affichage personnalisées
  displayOptions?: StatsDisplayOptions
  // Configuration de la statistique affichée sur la carte
  cardStat?: CardStatConfig
}

