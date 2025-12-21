/**
 * Tests pour le module utils
 * 
 * Teste la fonction cn() qui combine les classes CSS
 */

import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('devrait combiner correctement les classes CSS', () => {
      const result = cn('class1', 'class2', 'class3')

      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })

    it('devrait gérer les classes conditionnelles', () => {
      const isActive = true
      const isDisabled = false

      const result = cn('base-class', isActive && 'active', isDisabled && 'disabled')

      expect(result).toContain('base-class')
      expect(result).toContain('active')
      expect(result).not.toContain('disabled')
    })

    it('devrait gérer les tableaux de classes', () => {
      const result = cn(['class1', 'class2'], 'class3')

      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })

    it('devrait gérer les objets de classes conditionnelles', () => {
      const result = cn({
        'class1': true,
        'class2': false,
        'class3': true,
      })

      expect(result).toContain('class1')
      expect(result).not.toContain('class2')
      expect(result).toContain('class3')
    })

    it('devrait fusionner les classes Tailwind en conflit', () => {
      // twMerge devrait remplacer 'p-4' par 'p-6'
      const result = cn('p-4', 'p-6')

      expect(result).toContain('p-6')
      expect(result).not.toContain('p-4')
    })

    it('devrait gérer les valeurs null/undefined', () => {
      const result = cn('class1', null, undefined, 'class2')

      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })

    it('devrait gérer les classes vides', () => {
      const result = cn('', 'class1', '  ', 'class2')

      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })
  })
})

