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
}

