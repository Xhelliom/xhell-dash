/**
 * Types TypeScript spécifiques à la carte générique
 * 
 * La carte générique utilise les données brutes de l'API externe
 * sans structure spécifique, donc les types sont minimaux
 */

/**
 * Interface pour les statistiques génériques
 * 
 * Les données peuvent être de n'importe quelle structure
 * selon l'API externe utilisée
 */
export interface GenericStats {
  // Les données sont dynamiques selon l'API
  // On accepte n'importe quelle structure
  [key: string]: any
}

/**
 * Format standardisé pour l'affichage des KPI
 * 
 * Si l'API retourne des données dans ce format, elles seront affichées comme KPI
 */
export interface GenericKPI {
  label: string
  value: number | string
  icon?: string
}

