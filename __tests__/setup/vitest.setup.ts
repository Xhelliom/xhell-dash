/**
 * Configuration globale pour les tests Vitest
 * 
 * Ce fichier est exécuté avant chaque test et configure :
 * - Les variables d'environnement de test
 * - Les mocks globaux
 * - Les utilitaires de test
 */

import { vi } from 'vitest'

// Configuration des variables d'environnement pour les tests
process.env.NODE_ENV = 'test'
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef' // 64 caractères hex pour les tests

// Mock de Next.js
vi.mock('next/server', () => ({
  NextRequest: class NextRequest {
    url: string
    nextUrl: { pathname: string; origin: string; searchParams: URLSearchParams }
    constructor(url: string) {
      this.url = url
      this.nextUrl = {
        pathname: new URL(url).pathname,
        origin: new URL(url).origin,
        searchParams: new URL(url).searchParams,
      }
    }
    json() {
      return Promise.resolve({})
    }
  },
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      json: () => Promise.resolve(body),
      status: init?.status || 200,
      body,
    }),
    redirect: (url: string) => ({
      status: 302,
      headers: { Location: url },
    }),
    next: () => ({ status: 200 }),
  },
}))

// Mock de Auth.js
vi.mock('@/auth', () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

// Mock de Prisma (sera remplacé dans les tests individuels si nécessaire)
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

// Mock du système de fichiers pour les tests de DB JSON
// Les tests individuels pourront override ces mocks si nécessaire
vi.mock('fs/promises', async () => {
  const actual = await vi.importActual('fs/promises')
  return {
    ...actual,
    readFile: vi.fn(),
    writeFile: vi.fn(),
    access: vi.fn(),
    mkdir: vi.fn(),
  }
})

// Configuration globale pour les tests
global.console = {
  ...console,
  // Supprimer les logs en production de tests (optionnel)
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

