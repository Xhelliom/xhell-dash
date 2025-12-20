/**
 * Types TypeScript spécifiques à votre carte
 * 
 * Remplacez "Template" par le nom de votre carte (ex: "Sonarr", "Radarr")
 * 
 * Définissez ici tous les types TypeScript nécessaires pour votre carte :
 * - Interfaces pour les données de l'API
 * - Types pour les statistiques
 * - Types pour les options de configuration
 */

/**
 * Interface pour les statistiques de votre carte
 * 
 * Adaptez cette interface selon les données que votre API retourne
 */
export interface TemplateStats {
  // Exemple : nombre total d'éléments
  totalItems: number
  
  // Exemple : nombre d'éléments en attente
  pendingItems: number
  
  // Exemple : liste des éléments récents
  recentItems: TemplateRecentItem[]
  
  // Ajoutez d'autres champs selon vos besoins
}

/**
 * Interface pour un élément récent
 * 
 * Adaptez selon la structure de vos données
 */
export interface TemplateRecentItem {
  title: string
  type: string
  addedAt: string
  // Ajoutez d'autres champs selon vos besoins
}

/**
 * Options d'affichage spécifiques à votre carte
 * 
 * Définissez les options que l'utilisateur peut configurer
 */
export interface TemplateDisplayOptions {
  showTotalItems?: boolean
  showPendingItems?: boolean
  showRecentItems?: boolean
  // Ajoutez d'autres options selon vos besoins
}

