/**
 * Schémas de validation Zod pour les données Plex
 * 
 * Ces schémas permettent de valider strictement les données reçues
 * depuis l'API Plex et de gérer gracieusement les données invalides.
 */

import { z } from 'zod'
import type { PlexStats, PlexRecentMedia, PlexLibraryStat } from './types'

/**
 * Schéma pour un média récemment ajouté
 */
const PlexRecentMediaSchema = z.object({
  title: z.string(),
  type: z.enum(['movie', 'episode']),
  library: z.string(),
  addedAt: z.string(),
  year: z.number().optional(),
  thumb: z.string().optional(),
  ratingKey: z.string(),
})

/**
 * Schéma pour les statistiques d'une bibliothèque
 */
const PlexLibraryStatSchema = z.object({
  name: z.string(),
  type: z.enum(['movie', 'show', 'music', 'photo']),
  count: z.number().int().min(0),
})

/**
 * Schéma pour les statistiques Plex complètes
 */
export const PlexStatsSchema = z.object({
  totalMovies: z.number().int().min(0).default(0),
  totalShows: z.number().int().min(0).default(0),
  totalEpisodes: z.number().int().min(0).default(0),
  totalUsers: z.number().int().min(0).default(0),
  totalLibraries: z.number().int().min(0).default(0),
  recentMedia: z.array(PlexRecentMediaSchema).default([]),
  libraryStats: z.array(PlexLibraryStatSchema).default([]),
})

/**
 * Valide et normalise les données Plex
 * 
 * @param data - Données brutes à valider
 * @returns Données validées et normalisées
 */
export function validatePlexStats(data: unknown): PlexStats {
  try {
    // Utiliser safeParse pour gérer les erreurs gracieusement
    const result = PlexStatsSchema.safeParse(data)
    
    if (result.success) {
      return result.data
    }
    
    // Si la validation échoue, logger les erreurs et retourner des valeurs par défaut
    console.warn('Validation PlexStats échouée:', result.error.issues)
    
    // Retourner des valeurs par défaut avec les données partiellement valides si possible
    const partial = result.error.issues.reduce((acc, err) => {
      // Essayer de récupérer les valeurs valides
      if (typeof data === 'object' && data !== null) {
        const obj = data as Record<string, unknown>
        if (err.path.length > 0) {
          const key = err.path[0] as string
          if (key in obj) {
            acc[key] = obj[key]
          }
        }
      }
      return acc
    }, {} as Record<string, unknown>)
    
    // Fusionner avec les valeurs par défaut
    return {
      totalMovies: (partial.totalMovies as number) ?? 0,
      totalShows: (partial.totalShows as number) ?? 0,
      totalEpisodes: (partial.totalEpisodes as number) ?? 0,
      totalUsers: (partial.totalUsers as number) ?? 0,
      totalLibraries: (partial.totalLibraries as number) ?? 0,
      recentMedia: Array.isArray(partial.recentMedia) 
        ? (partial.recentMedia as PlexRecentMedia[]) 
        : [],
      libraryStats: Array.isArray(partial.libraryStats)
        ? (partial.libraryStats as PlexLibraryStat[])
        : [],
    }
  } catch (error) {
    console.error('Erreur lors de la validation PlexStats:', error)
    // En cas d'erreur critique, retourner des valeurs par défaut complètes
    return {
      totalMovies: 0,
      totalShows: 0,
      totalEpisodes: 0,
      totalUsers: 0,
      totalLibraries: 0,
      recentMedia: [],
      libraryStats: [],
    }
  }
}

