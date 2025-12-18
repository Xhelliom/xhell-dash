/**
 * Définitions des presets de style prédéfinis
 * 
 * Contient les types et valeurs pour radius, shadows, fonts et density (densité)
 */

/**
 * Preset pour les coins arrondis (border-radius)
 */
export type RadiusPreset = 'small' | 'medium' | 'large'

/**
 * Preset pour les ombres (shadows)
 */
export type ShadowPreset = 'subtle' | 'pronounced'

/**
 * Preset pour les polices (font families)
 */
export type FontPreset = 'sans' | 'serif' | 'mono'

/**
 * Preset pour la densité d'affichage
 */
export type DensityPreset = 'compact' | 'normal' | 'comfortable'

/**
 * Interface pour un preset de style complet
 */
export interface StylePreset {
  /** Niveau d'arrondi des coins */
  radius: RadiusPreset
  /** Intensité des ombres */
  shadow: ShadowPreset
  /** Famille de police */
  font: FontPreset
  /** Niveau de densité d'affichage */
  density: DensityPreset
}

/**
 * Valeurs CSS pour les radius (en rem)
 */
export const radiusValues: Record<RadiusPreset, string> = {
  small: '0.5rem',
  medium: '1rem',
  large: '1.5rem',
}

/**
 * Valeurs CSS pour les ombres
 * Contient l'opacité et le blur pour générer les shadows
 */
export const shadowValues: Record<ShadowPreset, { 
  opacity: string
  blur: string
  offsetY: string
}> = {
  subtle: { 
    opacity: '0.04', 
    blur: '8px',
    offsetY: '4px'
  },
  pronounced: { 
    opacity: '0.12', 
    blur: '16px',
    offsetY: '8px'
  },
}

/**
 * Valeurs CSS pour les familles de polices
 */
export const fontValues: Record<FontPreset, string> = {
  sans: 'Open Sans, sans-serif',
  serif: 'Source Serif 4, serif',
  mono: 'IBM Plex Mono, monospace',
}

/**
 * Valeurs CSS pour la densité d'affichage
 * Ces valeurs sont utilisées comme multiplicateur pour ajuster la taille globale des éléments
 */
export const densityValues: Record<DensityPreset, number> = {
  compact: 0.9,      // 90% de la taille normale (un peu plus serré)
  normal: 1.0,       // 100% - taille normale
  comfortable: 1.1,  // 110% de la taille normale (un peu plus espacé)
}

/**
 * Preset de style par défaut
 */
export const defaultStylePreset: StylePreset = {
  radius: 'medium',
  shadow: 'subtle',
  font: 'sans',
  density: 'normal',
}

