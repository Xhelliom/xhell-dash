/**
 * Tests pour le module de gestion des tokens
 * 
 * Teste les fonctions de masquage et de détection des champs sensibles
 */

import { describe, it, expect } from 'vitest'
import {
  maskToken,
  isSensitiveField,
  maskSensitiveField,
  maskSensitiveFields,
} from '@/lib/token-utils'

describe('token-utils', () => {
  describe('maskToken', () => {
    it('devrait masquer un token long correctement', () => {
      const token = 'abcdefghijklmnopqrstuvwxyz1234567890'
      const masked = maskToken(token)

      expect(masked).toBeDefined()
      expect(masked).not.toBe(token)
      expect(masked).toMatch(/^abcd.*7890$/) // Début et fin visibles
      expect(masked).toContain('*') // Contient des astérisques
    })

    it('devrait gérer les tokens courts (< visibleChars * 2)', () => {
      const shortToken = 'abc'
      const masked = maskToken(shortToken, 4)

      expect(masked).toBeDefined()
      expect(masked).toMatch(/^\*+$/) // Tous masqués avec des astérisques
      expect(masked.length).toBeLessThanOrEqual(8)
    })

    it('devrait gérer les valeurs vides/null/undefined', () => {
      expect(maskToken('')).toBe('')
      expect(maskToken(null as any)).toBe('')
      expect(maskToken(undefined as any)).toBe('')
    })

    it('devrait utiliser le nombre de caractères visibles par défaut (4)', () => {
      const token = 'abcdefghijklmnopqrstuvwxyz'
      const masked = maskToken(token)

      expect(masked).toMatch(/^.{4}.*.{4}$/) // 4 caractères au début et à la fin
    })

    it('devrait respecter le paramètre visibleChars', () => {
      const token = 'abcdefghijklmnopqrstuvwxyz'
      const masked = maskToken(token, 2)

      expect(masked).toMatch(/^.{2}.*.{2}$/) // 2 caractères au début et à la fin
    })
  })

  describe('isSensitiveField', () => {
    it('devrait détecter les champs sensibles (token)', () => {
      expect(isSensitiveField('token')).toBe(true)
      expect(isSensitiveField('plexToken')).toBe(true)
      expect(isSensitiveField('apiToken')).toBe(true)
    })

    it('devrait détecter les champs sensibles (apiKey)', () => {
      expect(isSensitiveField('apiKey')).toBe(true)
      expect(isSensitiveField('apikey')).toBe(true)
      expect(isSensitiveField('api_key')).toBe(true)
      expect(isSensitiveField('sonarrApiKey')).toBe(true)
    })

    it('devrait détecter les champs sensibles (password)', () => {
      expect(isSensitiveField('password')).toBe(true)
      expect(isSensitiveField('userPassword')).toBe(true)
    })

    it('devrait détecter les champs sensibles (secret)', () => {
      expect(isSensitiveField('secret')).toBe(true)
      expect(isSensitiveField('apiSecret')).toBe(true)
    })

    it('ne devrait pas détecter les champs non sensibles', () => {
      expect(isSensitiveField('name')).toBe(false)
      expect(isSensitiveField('url')).toBe(false)
      expect(isSensitiveField('logo')).toBe(false)
      expect(isSensitiveField('email')).toBe(false)
    })

    it('devrait être insensible à la casse', () => {
      expect(isSensitiveField('TOKEN')).toBe(true)
      expect(isSensitiveField('Token')).toBe(true)
      expect(isSensitiveField('token')).toBe(true)
    })
  })

  describe('maskSensitiveField', () => {
    it('devrait masquer uniquement les champs sensibles', () => {
      const sensitiveValue = 'my-secret-token'
      const publicValue = 'public-value'

      expect(maskSensitiveField('plexToken', sensitiveValue)).not.toBe(sensitiveValue)
      expect(maskSensitiveField('name', publicValue)).toBe(publicValue)
    })

    it('devrait retourner une chaîne vide pour les valeurs vides', () => {
      expect(maskSensitiveField('plexToken', '')).toBe('')
      expect(maskSensitiveField('plexToken', null as any)).toBe('')
      expect(maskSensitiveField('plexToken', undefined as any)).toBe('')
    })

    it('devrait respecter le paramètre visibleChars', () => {
      const token = 'abcdefghijklmnop'
      const masked = maskSensitiveField('plexToken', token, 2)

      expect(masked).toMatch(/^.{2}.*.{2}$/)
    })
  })

  describe('maskSensitiveFields', () => {
    it('devrait masquer récursivement les objets imbriqués', () => {
      const obj = {
        name: 'My App',
        url: 'https://example.com',
        plexToken: 'secret-token-123',
        config: {
          apiKey: 'nested-api-key',
          publicSetting: 'public-value',
        },
      }

      const masked = maskSensitiveFields(obj)

      expect(masked.name).toBe('My App')
      expect(masked.url).toBe('https://example.com')
      expect(masked.plexToken).not.toBe('secret-token-123')
      expect(masked.plexToken).toContain('*')
      expect(masked.config.apiKey).not.toBe('nested-api-key')
      expect(masked.config.apiKey).toContain('*')
      expect(masked.config.publicSetting).toBe('public-value')
    })

    it('ne devrait pas masquer les valeurs vides', () => {
      const obj = {
        name: 'My App',
        plexToken: '',
        apiKey: null,
      }

      const masked = maskSensitiveFields(obj)

      expect(masked.plexToken).toBe('')
      expect(masked.apiKey).toBeNull()
    })

    it('devrait respecter le paramètre visibleChars', () => {
      const obj = {
        plexToken: 'abcdefghijklmnop',
      }

      const masked = maskSensitiveFields(obj, 2)

      expect(masked.plexToken).toMatch(/^.{2}.*.{2}$/)
    })

    it('devrait gérer les tableaux sans les modifier', () => {
      const obj = {
        name: 'My App',
        items: ['item1', 'item2'],
        plexToken: 'secret-token',
      }

      const masked = maskSensitiveFields(obj)

      expect(masked.items).toEqual(['item1', 'item2'])
      expect(masked.plexToken).not.toBe('secret-token')
    })
  })
})

