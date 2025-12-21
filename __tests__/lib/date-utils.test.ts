/**
 * Tests pour le module de formatage des dates
 * 
 * Teste toutes les fonctions de formatage de dates et de calcul de couleurs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatRelativeTime,
  formatFullDate,
  formatDateTime,
  getDataAgeColor,
} from '@/lib/date-utils'

describe('date-utils', () => {
  let mockNow: number

  beforeEach(() => {
    // Mock Date.now() pour avoir des tests prévisibles
    mockNow = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(mockNow)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('formatRelativeTime', () => {
    it('devrait formater "À l\'instant" pour moins de 10 secondes', () => {
      const timestamp = mockNow - 5000 // 5 secondes
      const result = formatRelativeTime(timestamp)

      expect(result).toBe("À l'instant")
    })

    it('devrait formater les secondes correctement', () => {
      const timestamp = mockNow - 15000 // 15 secondes
      const result = formatRelativeTime(timestamp)

      expect(result).toBe('Il y a 15 secondes')
    })

    it('devrait formater les minutes correctement', () => {
      const timestamp = mockNow - 120000 // 2 minutes
      const result = formatRelativeTime(timestamp)

      expect(result).toBe('Il y a 2 minutes')
    })

    it('devrait gérer le cas singulier "Il y a 1 minute"', () => {
      const timestamp = mockNow - 60000 // 1 minute
      const result = formatRelativeTime(timestamp)

      expect(result).toBe('Il y a 1 minute')
    })

    it('devrait formater les heures correctement', () => {
      const timestamp = mockNow - 7200000 // 2 heures
      const result = formatRelativeTime(timestamp)

      expect(result).toBe('Il y a 2 heures')
    })

    it('devrait gérer le cas singulier "Il y a 1 heure"', () => {
      const timestamp = mockNow - 3600000 // 1 heure
      const result = formatRelativeTime(timestamp)

      expect(result).toBe('Il y a 1 heure')
    })

    it('devrait formater les jours correctement', () => {
      const timestamp = mockNow - 172800000 // 2 jours
      const result = formatRelativeTime(timestamp)

      expect(result).toBe('Il y a 2 jours')
    })

    it('devrait formater "Hier" pour 1 jour', () => {
      const timestamp = mockNow - 86400000 // 1 jour
      const result = formatRelativeTime(timestamp)

      expect(result).toBe('Hier')
    })

    it('devrait formater les semaines correctement', () => {
      const timestamp = mockNow - 1209600000 // 2 semaines
      const result = formatRelativeTime(timestamp)

      expect(result).toBe('Il y a 2 semaines')
    })

    it('devrait formater les mois correctement', () => {
      const timestamp = mockNow - 5184000000 // 2 mois (approximatif)
      const result = formatRelativeTime(timestamp)

      expect(result).toContain('mois')
    })

    it('devrait formater les années correctement', () => {
      const timestamp = mockNow - 63072000000 // 2 ans (approximatif)
      const result = formatRelativeTime(timestamp)

      expect(result).toBe('Il y a 2 ans')
    })
  })

  describe('formatFullDate', () => {
    it('devrait formater une date en français', () => {
      const date = new Date('2024-01-15')
      const result = formatFullDate(date.getTime())

      expect(result).toContain('janvier')
      expect(result).toContain('2024')
      expect(result).toContain('15')
    })

    it('devrait accepter un timestamp en millisecondes', () => {
      const timestamp = new Date('2024-06-20').getTime()
      const result = formatFullDate(timestamp)

      expect(result).toContain('juin')
      expect(result).toContain('2024')
    })

    it('devrait accepter une string ISO', () => {
      const isoString = '2024-03-10T12:00:00Z'
      const result = formatFullDate(isoString)

      expect(result).toContain('mars')
      expect(result).toContain('2024')
    })
  })

  describe('formatDateTime', () => {
    it('devrait formater une date avec l\'heure en français', () => {
      const date = new Date('2024-01-15T14:30:00')
      const result = formatDateTime(date.getTime())

      expect(result).toContain('janvier')
      expect(result).toContain('2024')
      expect(result).toContain('à')
      expect(result).toContain('14:30')
    })

    it('devrait accepter un timestamp en millisecondes', () => {
      const timestamp = new Date('2024-06-20T09:15:00').getTime()
      const result = formatDateTime(timestamp)

      expect(result).toContain('juin')
      expect(result).toContain('09:15')
    })

    it('devrait accepter une string ISO', () => {
      const isoString = '2024-03-10T12:00:00Z'
      const result = formatDateTime(isoString)

      expect(result).toContain('mars')
      expect(result).toContain('à')
    })
  })

  describe('getDataAgeColor', () => {
    it('devrait retourner "green" pour des données récentes (< 5min)', () => {
      const timestamp = mockNow - 180000 // 3 minutes
      const result = getDataAgeColor(timestamp)

      expect(result).toBe('green')
    })

    it('devrait retourner "orange" pour des données moyennement anciennes (< 15min)', () => {
      const timestamp = mockNow - 600000 // 10 minutes
      const result = getDataAgeColor(timestamp)

      expect(result).toBe('orange')
    })

    it('devrait retourner "red" pour des données anciennes (> 15min)', () => {
      const timestamp = mockNow - 1200000 // 20 minutes
      const result = getDataAgeColor(timestamp)

      expect(result).toBe('red')
    })

    it('devrait retourner "green" pour des données très récentes (< 1min)', () => {
      const timestamp = mockNow - 30000 // 30 secondes
      const result = getDataAgeColor(timestamp)

      expect(result).toBe('green')
    })

    it('devrait retourner "orange" pour exactement 5 minutes', () => {
      const timestamp = mockNow - 300000 // 5 minutes exactement
      const result = getDataAgeColor(timestamp)

      expect(result).toBe('orange')
    })

    it('devrait retourner "red" pour exactement 15 minutes', () => {
      const timestamp = mockNow - 900000 // 15 minutes exactement
      const result = getDataAgeColor(timestamp)

      expect(result).toBe('red')
    })
  })
})

