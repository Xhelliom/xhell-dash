/**
 * Tests d'intégration pour les routes API des widgets
 * 
 * Teste les endpoints GET et POST /api/widgets
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, POST } from '@/app/api/widgets/route'
import { auth } from '@/auth'
import { readWidgets, writeWidgets, generateWidgetId } from '@/lib/db'
import { createMockRequest, createMockSession, createTestWidget } from '../setup/test-helpers'

// Mock de auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

// Mock des fonctions db
vi.mock('@/lib/db', () => ({
  readWidgets: vi.fn(),
  writeWidgets: vi.fn(),
  generateWidgetId: vi.fn(() => 'widget_test_123'),
}))

describe('API /api/widgets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/widgets', () => {
    it('devrait retourner la liste des widgets', async () => {
      const widgets = [
        createTestWidget({ id: 'widget1', type: 'clock' }),
        createTestWidget({ id: 'widget2', type: 'weather' }),
      ]

      vi.mocked(readWidgets).mockResolvedValue(widgets)

      const response = await GET()
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json).toEqual(widgets)
      expect(readWidgets).toHaveBeenCalled()
    })

    it('devrait retourner 500 en cas d\'erreur', async () => {
      vi.mocked(readWidgets).mockRejectedValue(new Error('Erreur de lecture'))

      const response = await GET()
      const json = await response.json()

      expect(response.status).toBe(500)
      expect(json.error).toBe('Impossible de récupérer les widgets')
    })
  })

  describe('POST /api/widgets', () => {
    it('devrait retourner 401 si non authentifié', async () => {
      vi.mocked(auth).mockResolvedValue(null)
      const request = createMockRequest('/api/widgets', {
        method: 'POST',
        body: { type: 'clock' },
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.error).toBe('Non authentifié')
    })

    it('devrait retourner 403 si utilisateur non-admin', async () => {
      const session = createMockSession({ role: 'user' })
      vi.mocked(auth).mockResolvedValue(session as any)
      const request = createMockRequest('/api/widgets', {
        method: 'POST',
        body: { type: 'clock' },
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error).toBe('Accès refusé. Administrateur requis.')
    })

    it('devrait créer un widget (admin)', async () => {
      const session = createMockSession({ role: 'admin' })
      const existingWidgets = [createTestWidget({ id: 'widget1' })]
      const newWidget = createTestWidget({
        id: 'widget_test_123',
        type: 'clock',
        enabled: true,
        order: 1,
      })

      vi.mocked(auth).mockResolvedValue(session as any)
      vi.mocked(readWidgets).mockResolvedValue(existingWidgets)
      vi.mocked(writeWidgets).mockResolvedValue()

      const request = createMockRequest('/api/widgets', {
        method: 'POST',
        body: { type: 'clock' },
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.type).toBe('clock')
      expect(json.enabled).toBe(true)
      expect(writeWidgets).toHaveBeenCalled()
    })

    it('devrait valider le type de widget', async () => {
      const session = createMockSession({ role: 'admin' })
      vi.mocked(auth).mockResolvedValue(session as any)

      const request = createMockRequest('/api/widgets', {
        method: 'POST',
        body: { type: 'invalid-type' },
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('Type de widget invalide')
    })

    it('devrait accepter les types de widget valides', async () => {
      const session = createMockSession({ role: 'admin' })
      const existingWidgets: any[] = []
      vi.mocked(auth).mockResolvedValue(session as any)
      vi.mocked(readWidgets).mockResolvedValue(existingWidgets)
      vi.mocked(writeWidgets).mockResolvedValue()

      const validTypes = ['clock', 'weather', 'system-info']

      for (const type of validTypes) {
        const request = createMockRequest('/api/widgets', {
          method: 'POST',
          body: { type },
        })

        const response = await POST(request as any)
        const json = await response.json()

        expect(response.status).toBe(201)
        expect(json.type).toBe(type)
      }
    })
  })
})

