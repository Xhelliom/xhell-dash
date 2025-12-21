/**
 * Tests d'intégration pour les routes API des applications
 * 
 * Teste les endpoints GET et POST /api/apps
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, POST } from '@/app/api/apps/route'
import { auth } from '@/auth'
import { readApps, writeApps, generateAppId } from '@/lib/db'
import { createMockRequest, createMockSession, createTestApp } from '../setup/test-helpers'

// Mock de auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

// Mock des fonctions db
vi.mock('@/lib/db', () => ({
  readApps: vi.fn(),
  writeApps: vi.fn(),
  generateAppId: vi.fn(() => 'app_test_123'),
}))

describe('API /api/apps', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/apps', () => {
    it('devrait retourner la liste des apps', async () => {
      const apps = [
        createTestApp({ id: 'app1', name: 'App 1' }),
        createTestApp({ id: 'app2', name: 'App 2' }),
      ]

      vi.mocked(readApps).mockResolvedValue(apps)

      const response = await GET()
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json).toEqual(apps)
      expect(readApps).toHaveBeenCalled()
    })

    it('devrait retourner 500 en cas d\'erreur', async () => {
      vi.mocked(readApps).mockRejectedValue(new Error('Erreur de lecture'))

      const response = await GET()
      const json = await response.json()

      expect(response.status).toBe(500)
      expect(json.error).toBe('Impossible de récupérer les applications')
    })
  })

  describe('POST /api/apps', () => {
    it('devrait retourner 401 si non authentifié', async () => {
      vi.mocked(auth).mockResolvedValue(null)
      const request = createMockRequest('/api/apps', {
        method: 'POST',
        body: {
          name: 'New App',
          url: 'https://example.com',
          logo: 'globe',
          logoType: 'icon',
        },
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.error).toBe('Non authentifié')
    })

    it('devrait retourner 403 si utilisateur non-admin', async () => {
      const session = createMockSession({ role: 'user' })
      vi.mocked(auth).mockResolvedValue(session as any)
      const request = createMockRequest('/api/apps', {
        method: 'POST',
        body: {
          name: 'New App',
          url: 'https://example.com',
          logo: 'globe',
          logoType: 'icon',
        },
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error).toBe('Accès refusé. Administrateur requis.')
    })

    it('devrait créer une app (admin)', async () => {
      const session = createMockSession({ role: 'admin' })
      const existingApps = [createTestApp({ id: 'app1' })]
      const newApp = createTestApp({
        id: 'app_test_123',
        name: 'New App',
        url: 'https://example.com',
        logo: 'globe',
        logoType: 'icon',
        order: 0,
      })

      vi.mocked(auth).mockResolvedValue(session as any)
      vi.mocked(readApps).mockResolvedValue(existingApps)
      vi.mocked(writeApps).mockResolvedValue()

      const request = createMockRequest('/api/apps', {
        method: 'POST',
        body: {
          name: 'New App',
          url: 'https://example.com',
          logo: 'globe',
          logoType: 'icon',
        },
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.name).toBe('New App')
      expect(json.url).toBe('https://example.com')
      expect(writeApps).toHaveBeenCalled()
    })

    it('devrait valider les champs obligatoires', async () => {
      const session = createMockSession({ role: 'admin' })
      vi.mocked(auth).mockResolvedValue(session as any)

      const request = createMockRequest('/api/apps', {
        method: 'POST',
        body: {
          name: 'New App',
          // url, logo, logoType manquants
        },
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('Les champs name, url, logo et logoType sont obligatoires')
    })

    it('devrait valider le logoType', async () => {
      const session = createMockSession({ role: 'admin' })
      vi.mocked(auth).mockResolvedValue(session as any)

      const request = createMockRequest('/api/apps', {
        method: 'POST',
        body: {
          name: 'New App',
          url: 'https://example.com',
          logo: 'globe',
          logoType: 'invalid',
        },
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('logoType doit être "icon" ou "url"')
    })

    it('devrait valider les URLs', async () => {
      const session = createMockSession({ role: 'admin' })
      vi.mocked(auth).mockResolvedValue(session as any)

      const request = createMockRequest('/api/apps', {
        method: 'POST',
        body: {
          name: 'New App',
          url: 'not-a-valid-url',
          logo: 'globe',
          logoType: 'icon',
        },
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('URL invalide')
    })

    it('devrait valider statApiUrl si fourni', async () => {
      const session = createMockSession({ role: 'admin' })
      vi.mocked(auth).mockResolvedValue(session as any)

      const request = createMockRequest('/api/apps', {
        method: 'POST',
        body: {
          name: 'New App',
          url: 'https://example.com',
          logo: 'globe',
          logoType: 'icon',
          statApiUrl: 'invalid-url',
        },
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('statApiUrl invalide')
    })
  })
})

