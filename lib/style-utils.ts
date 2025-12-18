/**
 * Utilitaires pour gérer les presets de style
 * 
 * Permet d'appliquer des presets de style (radius, shadows, fonts, density) en modifiant les variables CSS
 */

import type { StylePreset } from './style-presets'
import { radiusValues, shadowValues, fontValues, densityValues } from './style-presets'

/**
 * Applique un preset de style au document
 * Modifie les variables CSS pour radius, shadows, fonts et density
 * 
 * @param preset - Le preset de style à appliquer
 */
export function applyStylePreset(preset: StylePreset): void {
  if (typeof document === 'undefined') {
    // Côté serveur, on ne peut pas modifier le DOM
    return
  }

  const root = document.documentElement

  // Appliquer le radius
  root.style.setProperty('--radius', radiusValues[preset.radius])

  // Appliquer les shadows
  const shadow = shadowValues[preset.shadow]
  root.style.setProperty('--shadow-opacity', shadow.opacity)
  root.style.setProperty('--shadow-blur', shadow.blur)
  root.style.setProperty('--shadow-offset-y', shadow.offsetY)
  
  // Mettre à jour toutes les variables shadow-* pour refléter les nouvelles valeurs
  // On utilise les formules existantes mais avec les nouvelles valeurs
  const shadowBase = `${shadow.offsetY}px ${shadow.blur} -${parseInt(shadow.blur) / 4}px`
  root.style.setProperty('--shadow-2xs', `${shadowBase} hsl(0 0% 0% / ${parseFloat(shadow.opacity) * 0.25})`)
  root.style.setProperty('--shadow-xs', `${shadowBase} hsl(0 0% 0% / ${parseFloat(shadow.opacity) * 0.25})`)
  root.style.setProperty('--shadow-sm', `${shadowBase} hsl(0 0% 0% / ${shadow.opacity}), ${shadow.offsetY}px 1px 2px -5px hsl(0 0% 0% / ${shadow.opacity})`)
  root.style.setProperty('--shadow', `${shadowBase} hsl(0 0% 0% / ${shadow.opacity}), ${shadow.offsetY}px 1px 2px -5px hsl(0 0% 0% / ${shadow.opacity})`)
  root.style.setProperty('--shadow-md', `${shadowBase} hsl(0 0% 0% / ${shadow.opacity}), ${shadow.offsetY}px 2px 4px -5px hsl(0 0% 0% / ${shadow.opacity})`)
  root.style.setProperty('--shadow-lg', `${shadowBase} hsl(0 0% 0% / ${shadow.opacity}), ${shadow.offsetY}px 4px 6px -5px hsl(0 0% 0% / ${shadow.opacity})`)
  root.style.setProperty('--shadow-xl', `${shadowBase} hsl(0 0% 0% / ${shadow.opacity}), ${shadow.offsetY}px 8px 10px -5px hsl(0 0% 0% / ${shadow.opacity})`)
  root.style.setProperty('--shadow-2xl', `${shadowBase} hsl(0 0% 0% / ${parseFloat(shadow.opacity) * 2.5})`)

  // Appliquer les fonts
  root.style.setProperty('--font-sans', fontValues[preset.font] === fontValues.sans ? fontValues[preset.font] : fontValues.sans)
  root.style.setProperty('--font-serif', fontValues[preset.font] === fontValues.serif ? fontValues[preset.font] : fontValues.serif)
  root.style.setProperty('--font-mono', fontValues[preset.font] === fontValues.mono ? fontValues[preset.font] : fontValues.mono)
  
  // Appliquer la font sélectionnée sur le body
  if (typeof document.body !== 'undefined') {
    document.body.style.fontFamily = fontValues[preset.font]
  }

  // Appliquer la densité comme variable CSS pour utilisation dans les composants
  // La densité est un multiplicateur qui peut être utilisé pour ajuster gaps, paddings, etc.
  root.style.setProperty('--density', densityValues[preset.density].toString())
  
  // Calculer les gaps en fonction de la densité
  // Gap de base pour les cards : 1.5rem (24px) en normal (équivalent à gap-6 de Tailwind)
  // Gap de base pour les widgets : 1rem (16px) en normal (équivalent à gap-4 de Tailwind)
  const baseGapCards = 1.5 // 1.5rem
  const baseGapWidgets = 1.0 // 1rem
  const densityMultiplier = densityValues[preset.density]
  
  root.style.setProperty('--gap-cards', `${baseGapCards * densityMultiplier}rem`)
  root.style.setProperty('--gap-widgets', `${baseGapWidgets * densityMultiplier}rem`)
}

/**
 * Réinitialise les styles au défaut
 * Supprime les styles personnalisés appliqués
 */
export function resetStyle(): void {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement

  // Liste des propriétés CSS custom à supprimer
  const cssProperties = [
    '--radius',
    '--shadow-opacity',
    '--shadow-blur',
    '--shadow-offset-y',
    '--shadow-2xs',
    '--shadow-xs',
    '--shadow-sm',
    '--shadow',
    '--shadow-md',
    '--shadow-lg',
    '--shadow-xl',
    '--shadow-2xl',
    '--font-sans',
    '--font-serif',
    '--font-mono',
    '--density',
    '--gap-cards',
    '--gap-widgets',
    '--padding-card',
  ]

  // Supprimer toutes les propriétés personnalisées
  cssProperties.forEach((property) => {
    root.style.removeProperty(property)
  })

  // Réinitialiser la font du body
  if (typeof document.body !== 'undefined') {
    document.body.style.fontFamily = ''
  }
}

/**
 * Vérifie si un preset de style personnalisé est actuellement appliqué
 * 
 * @returns true si un preset personnalisé est appliqué, false sinon
 */
export function isCustomStyleApplied(): boolean {
  if (typeof document === 'undefined') {
    return false
  }

  const root = document.documentElement
  // Si on trouve des propriétés CSS personnalisées sur :root, c'est qu'un preset est appliqué
  return root.style.getPropertyValue('--radius') !== ''
}

