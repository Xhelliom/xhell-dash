/**
 * Utilitaires pour gérer les thèmes de couleurs
 * 
 * Permet d'appliquer des thèmes prédéfinis en modifiant les variables CSS
 */

import type { ColorTheme } from './themes'

/**
 * Applique un thème de couleur au document
 * Modifie les variables CSS dans :root pour le mode light
 * et dans .dark pour le mode dark
 * 
 * @param theme - Le thème à appliquer
 */
export function applyTheme(theme: ColorTheme): void {
  if (typeof document === 'undefined') {
    // Côté serveur, on ne peut pas modifier le DOM
    return
  }

  const root = document.documentElement

  // Appliquer les variables CSS pour le mode light (:root)
  Object.entries(theme.light).forEach(([property, value]) => {
    root.style.setProperty(property, value)
  })

  // Créer ou mettre à jour le style pour .dark
  let darkStyleElement = document.getElementById('theme-dark-styles')
  
  if (!darkStyleElement) {
    // Créer un élément <style> pour les styles dark si il n'existe pas
    darkStyleElement = document.createElement('style')
    darkStyleElement.id = 'theme-dark-styles'
    document.head.appendChild(darkStyleElement)
  }

  // Construire le CSS pour .dark
  const darkStyles = Object.entries(theme.dark)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join('\n')

  darkStyleElement.textContent = `.dark {\n${darkStyles}\n}`
}

/**
 * Réinitialise le thème au thème par défaut
 * Supprime les styles personnalisés appliqués
 */
export function resetTheme(): void {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement

  // Liste des propriétés CSS custom à supprimer
  const cssProperties = [
    '--background',
    '--foreground',
    '--card',
    '--card-foreground',
    '--popover',
    '--popover-foreground',
    '--primary',
    '--primary-foreground',
    '--secondary',
    '--secondary-foreground',
    '--muted',
    '--muted-foreground',
    '--accent',
    '--accent-foreground',
    '--destructive',
    '--destructive-foreground',
    '--border',
    '--input',
    '--ring',
    '--chart-1',
    '--chart-2',
    '--chart-3',
    '--chart-4',
    '--chart-5',
    '--sidebar',
    '--sidebar-foreground',
    '--sidebar-primary',
    '--sidebar-primary-foreground',
    '--sidebar-accent',
    '--sidebar-accent-foreground',
    '--sidebar-border',
    '--sidebar-ring',
  ]

  // Supprimer toutes les propriétés personnalisées de :root
  cssProperties.forEach((property) => {
    root.style.removeProperty(property)
  })

  // Supprimer l'élément style pour .dark
  const darkStyleElement = document.getElementById('theme-dark-styles')
  if (darkStyleElement) {
    darkStyleElement.remove()
  }
}

/**
 * Vérifie si un thème personnalisé est actuellement appliqué
 * 
 * @returns true si un thème personnalisé est appliqué, false sinon
 */
export function isCustomThemeApplied(): boolean {
  if (typeof document === 'undefined') {
    return false
  }

  const root = document.documentElement
  // Si on trouve des propriétés CSS personnalisées sur :root, c'est qu'un thème est appliqué
  return root.style.getPropertyValue('--primary') !== ''
}

