/**
 * Définitions des thèmes de couleurs prédéfinis
 * 
 * Chaque thème contient les variables CSS pour le mode light et dark
 */

/**
 * Interface pour un thème de couleur
 * Contient les variables CSS pour les modes light et dark
 */
export interface ColorTheme {
  /** Nom du thème (identifiant unique) */
  id: string
  /** Nom d'affichage du thème */
  name: string
  /** Description du thème */
  description: string
  /** Variables CSS pour le mode light (appliquées à :root) */
  light: Record<string, string>
  /** Variables CSS pour le mode dark (appliquées à .dark) */
  dark: Record<string, string>
}

/**
 * Thème Violet (violet/purple)
 * Inspiré par les couleurs violettes avec un style moderne
 */
export const violetTheme: ColorTheme = {
  id: 'violet',
  name: 'Violet',
  description: 'Palette violette moderne et élégante',
  light: {
    '--background': '#ffffff',
    '--foreground': '#312e81',
    '--card': '#ffffff',
    '--card-foreground': '#312e81',
    '--popover': '#ffffff',
    '--popover-foreground': '#312e81',
    '--primary': '#8b5cf6',
    '--primary-foreground': '#ffffff',
    '--secondary': '#f3f0ff',
    '--secondary-foreground': '#4338ca',
    '--muted': '#f5f3ff',
    '--muted-foreground': '#7c3aed',
    '--accent': '#dbeafe',
    '--accent-foreground': '#1e40af',
    '--destructive': '#ef4444',
    '--destructive-foreground': '#ffffff',
    '--border': '#e0e7ff',
    '--input': '#e0e7ff',
    '--ring': '#8b5cf6',
    '--chart-1': '#8b5cf6',
    '--chart-2': '#7c3aed',
    '--chart-3': '#6d28d9',
    '--chart-4': '#5b21b6',
    '--chart-5': '#4c1d95',
    '--sidebar': '#f5f3ff',
    '--sidebar-foreground': '#312e81',
    '--sidebar-primary': '#8b5cf6',
    '--sidebar-primary-foreground': '#ffffff',
    '--sidebar-accent': '#dbeafe',
    '--sidebar-accent-foreground': '#1e40af',
    '--sidebar-border': '#e0e7ff',
    '--sidebar-ring': '#8b5cf6',
  },
  dark: {
    '--background': '#0f172a',
    '--foreground': '#e0e7ff',
    '--card': '#1e1b4b',
    '--card-foreground': '#e0e7ff',
    '--popover': '#1e1b4b',
    '--popover-foreground': '#e0e7ff',
    '--primary': '#8b5cf6',
    '--primary-foreground': '#ffffff',
    '--secondary': '#1e1b4b',
    '--secondary-foreground': '#e0e7ff',
    '--muted': '#171447',
    '--muted-foreground': '#c4b5fd',
    '--accent': '#4338ca',
    '--accent-foreground': '#e0e7ff',
    '--destructive': '#ef4444',
    '--destructive-foreground': '#ffffff',
    '--border': '#2e1065',
    '--input': '#2e1065',
    '--ring': '#8b5cf6',
    '--chart-1': '#a78bfa',
    '--chart-2': '#8b5cf6',
    '--chart-3': '#7c3aed',
    '--chart-4': '#6d28d9',
    '--chart-5': '#5b21b6',
    '--sidebar': '#0f172a',
    '--sidebar-foreground': '#e0e7ff',
    '--sidebar-primary': '#8b5cf6',
    '--sidebar-primary-foreground': '#ffffff',
    '--sidebar-accent': '#4338ca',
    '--sidebar-accent-foreground': '#e0e7ff',
    '--sidebar-border': '#2e1065',
    '--sidebar-ring': '#8b5cf6',
  },
}

/**
 * Thème Caramel (caramel/chaud)
 * Palette de couleurs chaudes et terreuses
 */
export const caramelTheme: ColorTheme = {
  id: 'caramel',
  name: 'Caramel',
  description: 'Palette chaude et terreuse inspirée du caramel',
  light: {
    '--background': '#f9f9f9',
    '--foreground': '#202020',
    '--card': '#fcfcfc',
    '--card-foreground': '#202020',
    '--popover': '#fcfcfc',
    '--popover-foreground': '#202020',
    '--primary': '#644a40',
    '--primary-foreground': '#ffffff',
    '--secondary': '#ffdfb5',
    '--secondary-foreground': '#582d1d',
    '--muted': '#efefef',
    '--muted-foreground': '#646464',
    '--accent': '#e8e8e8',
    '--accent-foreground': '#202020',
    '--destructive': '#e54d2e',
    '--destructive-foreground': '#ffffff',
    '--border': '#d8d8d8',
    '--input': '#d8d8d8',
    '--ring': '#644a40',
    '--chart-1': '#644a40',
    '--chart-2': '#ffdfb5',
    '--chart-3': '#e8e8e8',
    '--chart-4': '#ffe6c4',
    '--chart-5': '#66493e',
    '--sidebar': '#fbfbfb',
    '--sidebar-foreground': '#252525',
    '--sidebar-primary': '#343434',
    '--sidebar-primary-foreground': '#fbfbfb',
    '--sidebar-accent': '#f7f7f7',
    '--sidebar-accent-foreground': '#343434',
    '--sidebar-border': '#ebebeb',
    '--sidebar-ring': '#b5b5b5',
  },
  dark: {
    '--background': '#111111',
    '--foreground': '#eeeeee',
    '--card': '#191919',
    '--card-foreground': '#eeeeee',
    '--popover': '#191919',
    '--popover-foreground': '#eeeeee',
    '--primary': '#ffe0c2',
    '--primary-foreground': '#081a1b',
    '--secondary': '#393028',
    '--secondary-foreground': '#ffe0c2',
    '--muted': '#222222',
    '--muted-foreground': '#b4b4b4',
    '--accent': '#2a2a2a',
    '--accent-foreground': '#eeeeee',
    '--destructive': '#e54d2e',
    '--destructive-foreground': '#ffffff',
    '--border': '#201e18',
    '--input': '#484848',
    '--ring': '#ffe0c2',
    '--chart-1': '#ffe0c2',
    '--chart-2': '#393028',
    '--chart-3': '#2a2a2a',
    '--chart-4': '#42382e',
    '--chart-5': '#ffe0c1',
    '--sidebar': '#18181b',
    '--sidebar-foreground': '#f4f4f5',
    '--sidebar-primary': '#1d4ed8',
    '--sidebar-primary-foreground': '#ffffff',
    '--sidebar-accent': '#27272a',
    '--sidebar-accent-foreground': '#f4f4f5',
    '--sidebar-border': '#27272a',
    '--sidebar-ring': '#d4d4d8',
  },
}

/**
 * Liste de tous les thèmes disponibles
 */
export const themes: ColorTheme[] = [violetTheme, caramelTheme]

/**
 * Récupère un thème par son ID
 */
export function getThemeById(id: string): ColorTheme | undefined {
  return themes.find((theme) => theme.id === id)
}

/**
 * Récupère le thème par défaut (violet)
 */
export function getDefaultTheme(): ColorTheme {
  return violetTheme
}

