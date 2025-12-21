/**
 * Tests pour le module de cache client
 * 
 * Teste toutes les fonctions de gestion du cache localStorage
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  getCacheKey,
  getCachedData,
  setCachedData,
  isCacheValid,
  clearCachedData,
  getCacheTimestamp,
  cleanExpiredCache,
} from '@/lib/cache-client'
import { createMockLocalStorage, sleep } from '../setup/test-helpers'

describe('cache-client', () => {
  let mockStorage: ReturnType<typeof createMockLocalStorage>
  let originalLocalStorage: Storage | undefined

  beforeEach(() => {
    // Sauvegarder le localStorage original
    originalLocalStorage = global.localStorage

    // Créer un mock localStorage
    mockStorage = createMockLocalStorage()

    // Remplacer global.localStorage par notre mock
    Object.defineProperty(global, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    // Restaurer le localStorage original
    if (originalLocalStorage) {
      Object.defineProperty(global, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
        configurable: true,
      })
    }
    mockStorage.clear()
  })

  describe('getCacheKey', () => {
    it('devrait générer une clé de cache correcte', () => {
      const key = getCacheKey('app1')

      expect(key).toBe('xhell_dash_cache_app1')
    })

    it('devrait inclure le templateId si fourni', () => {
      const key = getCacheKey('app1', 'plex')

      expect(key).toBe('xhell_dash_cache_app1_plex')
    })

    it('devrait inclure la clé supplémentaire si fournie', () => {
      const key = getCacheKey('app1', 'plex', 'stats')

      expect(key).toBe('xhell_dash_cache_app1_plex_stats')
    })
  })

  describe('setCachedData et getCachedData', () => {
    it('devrait stocker et récupérer des données', () => {
      const cacheKey = getCacheKey('app1', 'plex')
      const data = { totalMovies: 100, totalShows: 50 }

      setCachedData(cacheKey, data, 300000) // 5 minutes
      const retrieved = getCachedData<typeof data>(cacheKey)

      expect(retrieved).toEqual(data)
    })

    it('devrait retourner null pour des données expirées', async () => {
      const cacheKey = getCacheKey('app1')
      const data = { value: 'test' }

      setCachedData(cacheKey, data, 100) // 100ms TTL
      await sleep(150) // Attendre plus que le TTL

      const retrieved = getCachedData(cacheKey)

      expect(retrieved).toBeNull()
    })

    it('devrait utiliser un TTL par défaut de 5 minutes', () => {
      const cacheKey = getCacheKey('app1')
      const data = { value: 'test' }

      setCachedData(cacheKey, data) // Pas de TTL spécifié

      const retrieved = getCachedData(cacheKey)

      expect(retrieved).toEqual(data)
    })

    it('devrait retourner null si localStorage n\'est pas disponible', () => {
      // Simuler l'absence de localStorage (SSR)
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const cacheKey = getCacheKey('app1')
      const retrieved = getCachedData(cacheKey)

      expect(retrieved).toBeNull()

      // Restaurer window
      Object.defineProperty(global, 'window', {
        value: global,
        writable: true,
        configurable: true,
      })
    })

    it('devrait gérer les données corrompues', () => {
      const cacheKey = getCacheKey('app1')
      mockStorage.setItem(cacheKey, 'invalid-json')

      const retrieved = getCachedData(cacheKey)

      expect(retrieved).toBeNull()
      // Les données corrompues devraient être supprimées
      expect(mockStorage.getItem(cacheKey)).toBeNull()
    })
  })

  describe('isCacheValid', () => {
    it('devrait retourner true pour des données valides', () => {
      const cacheKey = getCacheKey('app1')
      const data = { value: 'test' }

      setCachedData(cacheKey, data, 300000)
      const isValid = isCacheValid(cacheKey)

      expect(isValid).toBe(true)
    })

    it('devrait retourner false pour des données expirées', async () => {
      const cacheKey = getCacheKey('app1')
      const data = { value: 'test' }

      setCachedData(cacheKey, data, 100)
      await sleep(150)

      const isValid = isCacheValid(cacheKey)

      expect(isValid).toBe(false)
    })

    it('devrait retourner false si le cache n\'existe pas', () => {
      const cacheKey = getCacheKey('nonexistent')

      const isValid = isCacheValid(cacheKey)

      expect(isValid).toBe(false)
    })
  })

  describe('clearCachedData', () => {
    it('devrait supprimer des données du cache', () => {
      const cacheKey = getCacheKey('app1')
      const data = { value: 'test' }

      setCachedData(cacheKey, data)
      clearCachedData(cacheKey)

      const retrieved = getCachedData(cacheKey)

      expect(retrieved).toBeNull()
    })

    it('ne devrait pas échouer si le cache n\'existe pas', () => {
      const cacheKey = getCacheKey('nonexistent')

      expect(() => clearCachedData(cacheKey)).not.toThrow()
    })
  })

  describe('getCacheTimestamp', () => {
    it('devrait retourner le timestamp de la dernière mise à jour', () => {
      const cacheKey = getCacheKey('app1')
      const data = { value: 'test' }
      const beforeSet = Date.now()

      setCachedData(cacheKey, data)
      const timestamp = getCacheTimestamp(cacheKey)

      expect(timestamp).toBeDefined()
      expect(timestamp).toBeGreaterThanOrEqual(beforeSet)
      expect(timestamp).toBeLessThanOrEqual(Date.now())
    })

    it('devrait retourner null si le cache n\'existe pas', () => {
      const cacheKey = getCacheKey('nonexistent')

      const timestamp = getCacheTimestamp(cacheKey)

      expect(timestamp).toBeNull()
    })
  })

  describe('cleanExpiredCache', () => {
    it('devrait nettoyer les entrées expirées', async () => {
      const key1 = getCacheKey('app1')
      const key2 = getCacheKey('app2')
      const key3 = getCacheKey('app3')

      // Données valides
      setCachedData(key1, { value: 'test1' }, 300000)
      // Données expirées
      setCachedData(key2, { value: 'test2' }, 100)
      setCachedData(key3, { value: 'test3' }, 100)

      await sleep(150)

      cleanExpiredCache()

      expect(getCachedData(key1)).not.toBeNull() // Toujours valide
      expect(getCachedData(key2)).toBeNull() // Expiré et supprimé
      expect(getCachedData(key3)).toBeNull() // Expiré et supprimé
    })

    it('devrait gérer les données corrompues', () => {
      const key1 = getCacheKey('app1')
      const key2 = getCacheKey('app2')

      setCachedData(key1, { value: 'test1' }, 300000)
      mockStorage.setItem(key2, 'corrupted-json')

      cleanExpiredCache()

      expect(getCachedData(key1)).not.toBeNull()
      expect(mockStorage.getItem(key2)).toBeNull() // Corrompu et supprimé
    })

    it('ne devrait pas nettoyer les clés qui ne sont pas du cache', () => {
      const cacheKey = getCacheKey('app1')
      const otherKey = 'other_key'

      setCachedData(cacheKey, { value: 'test' }, 300000)
      mockStorage.setItem(otherKey, 'other-value')

      cleanExpiredCache()

      expect(mockStorage.getItem(otherKey)).toBe('other-value') // Non supprimé
    })
  })
})

