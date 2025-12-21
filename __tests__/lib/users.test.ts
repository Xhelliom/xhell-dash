/**
 * Tests pour le module de gestion des utilisateurs
 * 
 * Teste toutes les fonctions de gestion des utilisateurs :
 * - Hash et vérification de mot de passe
 * - Création, mise à jour, suppression d'utilisateurs
 * - Gestion des admins par défaut
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  hashPassword,
  verifyPassword,
  findUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  ensureDefaultAdmin,
  isDefaultPasswordStillActive,
  getAllUsers,
  updateUserProfile,
} from '@/lib/users'
import { prisma } from '@/lib/prisma'
import type { StoredUser } from '@/lib/users'

// Mock de Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

describe('users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('hashPassword', () => {
    it('devrait générer un hash différent à chaque appel', async () => {
      const password = 'MySecurePassword123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      expect(hash1).toBeDefined()
      expect(hash2).toBeDefined()
      expect(hash1).not.toBe(hash2) // Les hash bcrypt sont différents à chaque fois
      expect(hash1).toMatch(/^\$2[ayb]\$/) // Format bcrypt
    })

    it('devrait générer un hash valide pour différents mots de passe', async () => {
      const passwords = [
        'simple',
        'Complex123!',
        'very-long-password-with-many-characters-123456789',
      ]

      for (const password of passwords) {
        const hash = await hashPassword(password)
        expect(hash).toBeDefined()
        expect(hash.length).toBeGreaterThan(50) // Hash bcrypt fait ~60 caractères
      }
    })
  })

  describe('verifyPassword', () => {
    it('devrait vérifier correctement un mot de passe valide', async () => {
      const password = 'MySecurePassword123!'
      const hash = await hashPassword(password)
      
      const user: StoredUser = {
        id: 'test-id',
        email: 'test@example.com',
        passwordHash: hash,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const isValid = await verifyPassword(password, user)
      expect(isValid).toBe(true)
    })

    it('devrait rejeter un mot de passe invalide', async () => {
      const password = 'MySecurePassword123!'
      const hash = await hashPassword(password)
      
      const user: StoredUser = {
        id: 'test-id',
        email: 'test@example.com',
        passwordHash: hash,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const isValid = await verifyPassword('WrongPassword', user)
      expect(isValid).toBe(false)
    })
  })

  describe('findUserByEmail', () => {
    it('devrait trouver un utilisateur par email (normalisé)', async () => {
      const mockUser: StoredUser = {
        id: 'test-id',
        email: 'test@example.com',
        passwordHash: 'hash',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

      const user = await findUserByEmail('TEST@EXAMPLE.COM')
      
      expect(user).toEqual(mockUser)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }, // Email normalisé en minuscules
      })
    })

    it('devrait retourner null si l\'utilisateur n\'existe pas', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const user = await findUserByEmail('nonexistent@example.com')
      
      expect(user).toBeNull()
    })
  })

  describe('createUser', () => {
    it('devrait créer un utilisateur avec hash de mot de passe', async () => {
      const mockUser: StoredUser = {
        id: 'new-user-id',
        email: 'newuser@example.com',
        passwordHash: 'hashed-password',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null) // Pas d'utilisateur existant
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser)

      const user = await createUser({
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        role: 'user',
      })

      expect(user).toEqual(mockUser)
      expect(prisma.user.findUnique).toHaveBeenCalled()
      expect(prisma.user.create).toHaveBeenCalled()
      
      // Vérifier que le mot de passe a été hashé
      const createCall = vi.mocked(prisma.user.create).mock.calls[0][0]
      expect(createCall.data.passwordHash).toBeDefined()
      expect(createCall.data.passwordHash).not.toBe('SecurePassword123!')
    })

    it('devrait rejeter la création d\'un utilisateur existant', async () => {
      const existingUser: StoredUser = {
        id: 'existing-id',
        email: 'existing@example.com',
        passwordHash: 'hash',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser)

      await expect(
        createUser({
          email: 'existing@example.com',
          password: 'password',
          role: 'user',
        })
      ).rejects.toThrow('Un utilisateur avec cet email existe déjà')
    })
  })

  describe('updateUser', () => {
    it('devrait mettre à jour l\'email d\'un utilisateur', async () => {
      const existingUser: StoredUser = {
        id: 'user-id',
        email: 'old@example.com',
        passwordHash: 'hash',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const updatedUser: StoredUser = {
        ...existingUser,
        email: 'new@example.com',
      }

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(existingUser) // Vérification existence
        .mockResolvedValueOnce(null) // Vérification email non utilisé
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser)

      const result = await updateUser('user-id', { email: 'new@example.com' })

      expect(result.email).toBe('new@example.com')
      expect(prisma.user.update).toHaveBeenCalled()
    })

    it('devrait mettre à jour le mot de passe d\'un utilisateur', async () => {
      const existingUser: StoredUser = {
        id: 'user-id',
        email: 'user@example.com',
        passwordHash: 'old-hash',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const updatedUser: StoredUser = {
        ...existingUser,
        passwordHash: 'new-hash',
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser)
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser)

      const result = await updateUser('user-id', { password: 'NewPassword123!' })

      expect(prisma.user.update).toHaveBeenCalled()
      const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0]
      expect(updateCall.data.passwordHash).toBeDefined()
      expect(updateCall.data.passwordHash).not.toBe('NewPassword123!') // Doit être hashé
    })

    it('devrait rejeter la mise à jour avec un email déjà utilisé', async () => {
      const existingUser: StoredUser = {
        id: 'user-id',
        email: 'user@example.com',
        passwordHash: 'hash',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const otherUser: StoredUser = {
        id: 'other-id',
        email: 'other@example.com',
        passwordHash: 'hash',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(existingUser) // Vérification existence
        .mockResolvedValueOnce(otherUser) // Email déjà utilisé

      await expect(
        updateUser('user-id', { email: 'other@example.com' })
      ).rejects.toThrow('Un utilisateur avec cet email existe déjà')
    })
  })

  describe('deleteUser', () => {
    it('devrait supprimer un utilisateur', async () => {
      const user: StoredUser = {
        id: 'user-id',
        email: 'user@example.com',
        passwordHash: 'hash',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(user)
      vi.mocked(prisma.user.delete).mockResolvedValue(user)

      await deleteUser('user-id')

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-id' },
      })
    })

    it('devrait empêcher la suppression du dernier admin', async () => {
      const admin: StoredUser = {
        id: 'admin-id',
        email: 'admin@example.com',
        passwordHash: 'hash',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(admin)
      vi.mocked(prisma.user.count).mockResolvedValue(1) // Un seul admin

      await expect(deleteUser('admin-id')).rejects.toThrow(
        'Impossible de supprimer le dernier administrateur'
      )
    })
  })

  describe('ensureDefaultAdmin', () => {
    it('devrait créer un admin par défaut si aucun n\'existe', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null) // Aucun admin
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null) // Admin par défaut n'existe pas
      
      const mockAdmin: StoredUser = {
        id: 'default-admin-id',
        email: 'xhell-admin@example.com',
        passwordHash: 'hash',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      vi.mocked(prisma.user.create).mockResolvedValue(mockAdmin)

      await ensureDefaultAdmin()

      expect(prisma.user.create).toHaveBeenCalled()
      const createCall = vi.mocked(prisma.user.create).mock.calls[0][0]
      expect(createCall.data.email).toBe('xhell-admin@example.com')
      expect(createCall.data.role).toBe('admin')
    })

    it('ne devrait pas créer d\'admin si un admin existe déjà', async () => {
      const existingAdmin: StoredUser = {
        id: 'existing-admin-id',
        email: 'admin@example.com',
        passwordHash: 'hash',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.user.findFirst).mockResolvedValue(existingAdmin)

      await ensureDefaultAdmin()

      expect(prisma.user.create).not.toHaveBeenCalled()
    })
  })

  describe('isDefaultPasswordStillActive', () => {
    it('devrait détecter si le mot de passe par défaut est actif', async () => {
      const defaultPassword = 'Admin123!'
      const hash = await hashPassword(defaultPassword)
      
      const defaultAdmin: StoredUser = {
        id: 'default-admin-id',
        email: 'xhell-admin@example.com',
        passwordHash: hash,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(defaultAdmin)

      const isActive = await isDefaultPasswordStillActive()
      
      expect(isActive).toBe(true)
    })

    it('devrait retourner false si l\'admin par défaut n\'existe pas', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const isActive = await isDefaultPasswordStillActive()
      
      expect(isActive).toBe(false)
    })

    it('devrait retourner false si le mot de passe a été changé', async () => {
      const changedPassword = 'NewPassword123!'
      const hash = await hashPassword(changedPassword)
      
      const admin: StoredUser = {
        id: 'admin-id',
        email: 'xhell-admin@example.com',
        passwordHash: hash,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(admin)

      const isActive = await isDefaultPasswordStillActive()
      
      expect(isActive).toBe(false)
    })
  })

  describe('getAllUsers', () => {
    it('devrait retourner tous les utilisateurs sans les hash de mots de passe', async () => {
      const users: StoredUser[] = [
        {
          id: 'user1',
          email: 'user1@example.com',
          passwordHash: 'hash1',
          role: 'user',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user2',
          email: 'user2@example.com',
          passwordHash: 'hash2',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(prisma.user.findMany).mockResolvedValue(users)

      const result = await getAllUsers()

      expect(result).toHaveLength(2)
      expect(result[0]).not.toHaveProperty('passwordHash')
      expect(result[1]).not.toHaveProperty('passwordHash')
      expect(result[0].email).toBe('user1@example.com')
      expect(result[1].email).toBe('user2@example.com')
    })
  })

  describe('updateUserProfile', () => {
    it('devrait mettre à jour le profil de l\'utilisateur connecté', async () => {
      const existingUser: StoredUser = {
        id: 'user-id',
        email: 'old@example.com',
        passwordHash: 'old-hash',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const updatedUser: StoredUser = {
        ...existingUser,
        email: 'new@example.com',
      }

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(existingUser) // Vérification existence
        .mockResolvedValueOnce(null) // Vérification email non utilisé
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser)

      const result = await updateUserProfile('user-id', { email: 'new@example.com' })

      expect(result.email).toBe('new@example.com')
      expect(result).not.toHaveProperty('passwordHash')
    })
  })
})

