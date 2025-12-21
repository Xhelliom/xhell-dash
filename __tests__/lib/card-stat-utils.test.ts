/**
 * Tests pour le module de normalisation des configurations de statistiques
 */

import { describe, it, expect } from 'vitest'
import { normalizeCardStatConfig } from '@/lib/card-stat-utils'
import type { CardStatConfig } from '@/lib/types'

describe('card-stat-utils', () => {
  describe('normalizeCardStatConfig', () => {
    it('devrait retourner undefined pour config null/undefined', () => {
      expect(normalizeCardStatConfig(null)).toBeUndefined()
      expect(normalizeCardStatConfig(undefined)).toBeUndefined()
    })

    it('devrait retourner tel quel un config déjà normalisé (type: number)', () => {
      const config: CardStatConfig = {
        type: 'number',
        key: 'totalMovies',
        label: 'Films',
      }

      const result = normalizeCardStatConfig(config)

      expect(result).toEqual(config)
    })

    it('devrait retourner tel quel un config déjà normalisé (type: chart)', () => {
      const config: CardStatConfig = {
        type: 'chart',
        key: 'libraryStats',
        label: 'Bibliothèques',
      }

      const result = normalizeCardStatConfig(config)

      expect(result).toEqual(config)
    })

    it('devrait retourner tel quel un config déjà normalisé (type: custom)', () => {
      const config: CardStatConfig = {
        type: 'custom',
        customType: 'plex-recent',
        key: 'recentMedia',
        label: 'Derniers médias',
      }

      const result = normalizeCardStatConfig(config)

      expect(result).toEqual(config)
    })

    it('devrait migrer l\'ancien format plex-recent vers custom', () => {
      const oldConfig = {
        type: 'plex-recent',
        key: 'recentMedia',
        label: 'Derniers médias',
      }

      const result = normalizeCardStatConfig(oldConfig)

      expect(result).toBeDefined()
      expect(result?.type).toBe('custom')
      expect(result?.customType).toBe('plex-recent')
      expect(result?.key).toBe('recentMedia')
      expect(result?.label).toBe('Derniers médias')
    })

    it('devrait retourner undefined pour type non reconnu', () => {
      const invalidConfig = {
        type: 'unknown-type',
        key: 'someKey',
      }

      const result = normalizeCardStatConfig(invalidConfig)

      expect(result).toBeUndefined()
    })

    it('devrait gérer les configs sans label', () => {
      const config: CardStatConfig = {
        type: 'number',
        key: 'totalMovies',
      }

      const result = normalizeCardStatConfig(config)

      expect(result).toEqual(config)
    })
  })
})

