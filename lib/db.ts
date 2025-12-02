/**
 * Système de persistance JSONDB
 * 
 * Ce module gère la lecture et l'écriture des applications dans un fichier JSON
 * situé dans le dossier data/apps.json
 */

import { promises as fs } from 'fs'
import path from 'path'
import type { App, Widget } from './types'

// Chemin vers le fichier de données
const DATA_DIR = path.join(process.cwd(), 'data')
const APPS_FILE = path.join(DATA_DIR, 'apps.json')
const WIDGETS_FILE = path.join(DATA_DIR, 'widgets.json')

/**
 * Lit la liste des applications depuis le fichier JSON
 * 
 * @returns Promise<App[]> - Liste des applications triée par ordre
 * @throws Error si le fichier ne peut pas être lu ou si les données sont invalides
 */
export async function readApps(): Promise<App[]> {
  try {
    // Vérifier si le fichier existe
    await fs.access(APPS_FILE)
    
    // Lire le contenu du fichier
    const fileContent = await fs.readFile(APPS_FILE, 'utf-8')
    
    // Parser le JSON
    const apps = JSON.parse(fileContent) as App[]
    
    // Valider que c'est bien un tableau
    if (!Array.isArray(apps)) {
      throw new Error('Les données doivent être un tableau')
    }
    
    // Trier les apps par ordre (si défini), sinon garder l'ordre d'origine
    return apps.sort((a, b) => {
      // Si les deux ont un ordre, trier par ordre
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order
      }
      // Si seul a a un ordre, il vient en premier
      if (a.order !== undefined) {
        return -1
      }
      // Si seul b a un ordre, il vient en premier
      if (b.order !== undefined) {
        return 1
      }
      // Sinon, garder l'ordre d'origine
      return 0
    })
  } catch (error: any) {
    // Si le fichier n'existe pas, retourner un tableau vide
    if (error.code === 'ENOENT') {
      return []
    }
    
    // Pour les autres erreurs, les propager
    throw error
  }
}

/**
 * Écrit la liste des applications dans le fichier JSON
 * 
 * @param apps - Liste des applications à sauvegarder
 * @throws Error si le fichier ne peut pas être écrit
 */
export async function writeApps(apps: App[]): Promise<void> {
  try {
    // Créer le dossier data s'il n'existe pas
    await fs.mkdir(DATA_DIR, { recursive: true })
    
    // Convertir en JSON avec indentation pour la lisibilité
    const jsonContent = JSON.stringify(apps, null, 2)
    
    // Écrire dans le fichier
    await fs.writeFile(APPS_FILE, jsonContent, 'utf-8')
  } catch (error) {
    // Propager l'erreur avec un message plus clair
    throw new Error(`Impossible d'écrire les données : ${error}`)
  }
}

/**
 * Génère un identifiant unique pour une nouvelle application
 * 
 * @returns string - Identifiant unique basé sur le timestamp et un nombre aléatoire
 */
export function generateAppId(): string {
  return `app_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Lit la liste des widgets depuis le fichier JSON
 * 
 * @returns Promise<Widget[]> - Liste des widgets triée par ordre
 * @throws Error si le fichier ne peut pas être lu ou si les données sont invalides
 */
export async function readWidgets(): Promise<Widget[]> {
  try {
    // Vérifier si le fichier existe
    await fs.access(WIDGETS_FILE)
    
    // Lire le contenu du fichier
    const fileContent = await fs.readFile(WIDGETS_FILE, 'utf-8')
    
    // Parser le JSON
    const widgets = JSON.parse(fileContent) as Widget[]
    
    // Valider que c'est bien un tableau
    if (!Array.isArray(widgets)) {
      throw new Error('Les données doivent être un tableau')
    }
    
    // Trier les widgets par ordre (si défini), sinon garder l'ordre d'origine
    return widgets.sort((a, b) => {
      // Si les deux ont un ordre, trier par ordre
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order
      }
      // Si seul a a un ordre, il vient en premier
      if (a.order !== undefined) {
        return -1
      }
      // Si seul b a un ordre, il vient en premier
      if (b.order !== undefined) {
        return 1
      }
      // Sinon, garder l'ordre d'origine
      return 0
    })
  } catch (error: any) {
    // Si le fichier n'existe pas, retourner un tableau vide
    if (error.code === 'ENOENT') {
      return []
    }
    
    // Pour les autres erreurs, les propager
    throw error
  }
}

/**
 * Écrit la liste des widgets dans le fichier JSON
 * 
 * @param widgets - Liste des widgets à sauvegarder
 * @throws Error si le fichier ne peut pas être écrit
 */
export async function writeWidgets(widgets: Widget[]): Promise<void> {
  try {
    // Créer le dossier data s'il n'existe pas
    await fs.mkdir(DATA_DIR, { recursive: true })
    
    // Convertir en JSON avec indentation pour la lisibilité
    const jsonContent = JSON.stringify(widgets, null, 2)
    
    // Écrire dans le fichier
    await fs.writeFile(WIDGETS_FILE, jsonContent, 'utf-8')
  } catch (error) {
    // Propager l'erreur avec un message plus clair
    throw new Error(`Impossible d'écrire les données : ${error}`)
  }
}

/**
 * Génère un identifiant unique pour un nouveau widget
 * 
 * @returns string - Identifiant unique basé sur le timestamp et un nombre aléatoire
 */
export function generateWidgetId(): string {
  return `widget_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

