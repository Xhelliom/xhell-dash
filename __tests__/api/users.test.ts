/**
 * Tests d'intégration pour les routes API des utilisateurs
 * 
 * Teste les endpoints GET et POST /api/users
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, POST } from '@/app/api/users/route'
import { PUT, DELETE } from '@/app/api/users/[id]/route'
import { auth } from '@/auth'
import { getAllUsers, createUser, updateUser, deleteUser } from '@/lib/users'
import { prisma } from '@/lib/prisma'
import { createMockRequest, createMockSession, createTestUser } from '../setup/test-helpers'

// Mock de auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

// Mock des fonctions users
vi.mock('@/lib/users', () => ({
  getAllUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}))

// Mock de Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

describe('API /api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/users', () => {
    it('devrait retourner 401 si non authentifié', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const response = await GET()
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.error).toBe('Non authentifié')
    })

    it('devrait retourner 403 si utilisateur non-admin', async () => {
      const session = createMockSession({ role: 'user' })
      vi.mocked(auth).mockResolvedValue(session as any)

      const response = await GET()
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error).toBe('Accès refusé. Administrateur requis.')
    })

    it('devrait retourner la liste des utilisateurs (admin)', async () => {
      const session = createMockSession({ role: 'admin' })
      const users = [
        { id: 'user1', email: 'user1@example.com', role: 'user' },
        { id: 'user2', email: 'user2@example.com', role: 'admin' },
      ]

      vi.mocked(auth).mockResolvedValue(session as any)
      vi.mocked(getAllUsers).mockResolvedValue(users as any)

      const response = await GET()
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json).toEqual(users)
      expect(getAllUsers).toHaveBeenCalled()
    })
  })

  describe('POST /api/users', () => {
    it('devrait retourner 401 si non authentifié', async () => {
      vi.mocked(auth).mockResolvedValue(null)
      const request = createMockRequest('/api/users', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password123', role: 'user' },
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.error).toBe('Non authentifié')
    })

    it('devrait retourner 403 si utilisateur non-admin', async () => {
      const session = createMockSession({ role: 'user' })
      vi.mocked(auth).mockResolvedValue(session as any)
      const request = createMockRequest('/api/users', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password123', role: 'user' },
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error).toBe('Accès refusé. Administrateur requis.')
    })

    it('devrait créer un utilisateur (admin)', async () => {
      const session = createMockSession({ role: 'admin' })
      const newUser = createTestUser({
        email: 'newuser@example.com',
        role: 'user',
      })
      const userWithoutPassword = { ...newUser }
      delete (userWithoutPassword as any).passwordHash

      vi.mocked(auth).mockResolvedValue(session as any)
      vi.mocked(createUser).mockResolvedValue(newUser as any)

      const request = createMockRequest('/api/users', {
        method: 'POST',
        body: { email: 'newuser@example.com', password: 'password123', role: 'user' },
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.email).toBe('newuser@example.com')
      expect(json).not.toHaveProperty('passwordHash')
      expect(createUser).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        role: 'user',
      })
    })

    it('devrait valider l\'email', async () => {
      const session = createMockSession({ role: 'admin' })
      vi.mocked(auth).mockResolvedValue(session as any)

      const request = createMockRequest('/api/users', {
        method: 'POST',
        body: { email: 'invalid-email', password: 'password123', role: 'user' },
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe("Format d'email invalide")
    })

    it('devrait valider le mot de passe (minimum 8 caractères)', async () => {
      const session = createMockSession({ role: 'admin' })
      vi.mocked(auth).mockResolvedValue(session as any)

      const request = createMockRequest('/api/users', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'short', role: 'user' },
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('Le mot de passe doit contenir au moins 8 caractères')
    })

    it('devrait retourner 400 pour données invalides (champs manquants)', async () => {
      const session = createMockSession({ role: 'admin' })
      vi.mocked(auth).mockResolvedValue(session as any)

      const request = createMockRequest('/api/users', {
        method: 'POST',
        body: { email: 'test@example.com' }, // password et role manquants
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('Email, mot de passe et rôle sont requis')
    })

    it('devrait valider le rôle', async () => {
      const session = createMockSession({ role: 'admin' })
      vi.mocked(auth).mockResolvedValue(session as any)

      const request = createMockRequest('/api/users', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password123', role: 'invalid' },
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('Rôle invalide. Doit être "user" ou "admin"')
    })

    it('devrait retourner 409 si l\'utilisateur existe déjà', async () => {
      const session = createMockSession({ role: 'admin' })
      vi.mocked(auth).mockResolvedValue(session as any)
      vi.mocked(createUser).mockRejectedValue(
        new Error('Un utilisateur avec cet email existe déjà')
      )

      const request = createMockRequest('/api/users', {
        method: 'POST',
        body: { email: 'existing@example.com', password: 'password123', role: 'user' },
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(409)
      expect(json.error).toBe('Un utilisateur avec cet email existe déjà')
    })
  })

  describe('PUT /api/users/[id]', () => {
    it('devrait mettre à jour un utilisateur (admin)', async () => {
      const session = createMockSession({ id: 'admin-id', role: 'admin' })
      const updatedUser = { id: 'user-id', email: 'updated@example.com', role: 'user' }

      vi.mocked(auth).mockResolvedValue(session as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-id',
        email: 'old@example.com',
        role: 'user',
      } as any)
      vi.mocked(updateUser).mockResolvedValue(updatedUser as any)

      const request = createMockRequest('/api/users/user-id', {
        method: 'PUT',
        body: { email: 'updated@example.com' },
      })

      const response = await PUT(request as any, {
        params: Promise.resolve({ id: 'user-id' }),
      })
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.email).toBe('updated@example.com')
    })

    it('devrait empêcher la modification de son propre compte', async () => {
      const session = createMockSession({ id: 'user-id', role: 'admin' })
      vi.mocked(auth).mockResolvedValue(session as any)

      const request = createMockRequest('/api/users/user-id', {
        method: 'PUT',
        body: { email: 'new@example.com' },
      })

      const response = await PUT(request as any, {
        params: Promise.resolve({ id: 'user-id' }),
      })
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toContain('Vous ne pouvez pas modifier votre propre compte')
    })
  })

  describe('DELETE /api/users/[id]', () => {
    it('devrait supprimer un utilisateur (admin)', async () => {
      const session = createMockSession({ id: 'admin-id', role: 'admin' })
      vi.mocked(auth).mockResolvedValue(session as any)
      vi.mocked(deleteUser).mockResolvedValue()

      const request = createMockRequest('/api/users/user-id', {
        method: 'DELETE',
      })

      const response = await DELETE(request as any, {
        params: Promise.resolve({ id: 'user-id' }),
      })
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(deleteUser).toHaveBeenCalledWith('user-id')
    })

    it('devrait empêcher la suppression du dernier admin', async () => {
      const session = createMockSession({ id: 'admin-id', role: 'admin' })
      vi.mocked(auth).mockResolvedValue(session as any)
      vi.mocked(deleteUser).mockRejectedValue(
        new Error('Impossible de supprimer le dernier administrateur')
      )

      const request = createMockRequest('/api/users/admin-id', {
        method: 'DELETE',
      })

      const response = await DELETE(request as any, {
        params: Promise.resolve({ id: 'admin-id' }),
      })
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('Impossible de supprimer le dernier administrateur')
    })
  })
})

