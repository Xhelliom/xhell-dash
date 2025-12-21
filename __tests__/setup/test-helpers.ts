/**
 * Fonctions utilitaires pour les tests
 * 
 * Ce fichier contient des factories et helpers pour faciliter
 * la création de données de test et les mocks
 */

import type { App, Widget, AppConfig, User } from '@/lib/types'
import type { StoredUser } from '@/lib/users'

/**
 * Factory pour créer une application de test
 */
export function createTestApp(overrides?: Partial<App>): App {
  return {
    id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: 'Test App',
    url: 'https://example.com',
    logo: 'globe',
    logoType: 'icon',
    order: 0,
    ...overrides,
  }
}

/**
 * Factory pour créer un widget de test
 */
export function createTestWidget(overrides?: Partial<Widget>): Widget {
  return {
    id: `widget_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type: 'clock',
    enabled: true,
    order: 0,
    ...overrides,
  }
}

/**
 * Factory pour créer une configuration de test
 */
export function createTestConfig(overrides?: Partial<AppConfig>): AppConfig {
  return {
    backgroundEffect: 'mesh-animated',
    theme: 'default',
    ...overrides,
  }
}

/**
 * Factory pour créer un utilisateur de test
 */
export function createTestUser(overrides?: Partial<StoredUser>): StoredUser {
  const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  return {
    id,
    email: `test-${id}@example.com`,
    passwordHash: '$2a$10$dummy.hash.for.testing.purposes.only',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Factory pour créer un utilisateur admin de test
 */
export function createTestAdmin(overrides?: Partial<StoredUser>): StoredUser {
  return createTestUser({
    role: 'admin',
    ...overrides,
  })
}

/**
 * Mock d'une session utilisateur pour les tests API
 */
export function createMockSession(user?: Partial<{ id: string; email: string; role: string }>) {
  return {
    user: {
      id: user?.id || 'test-user-id',
      email: user?.email || 'test@example.com',
      role: user?.role || 'user',
    },
  }
}

/**
 * Mock d'une requête Next.js pour les tests API
 */
export function createMockRequest(
  url: string,
  options?: {
    method?: string
    body?: any
    headers?: Record<string, string>
  }
) {
  const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`
  return {
    url: fullUrl,
    nextUrl: {
      pathname: new URL(fullUrl).pathname,
      origin: new URL(fullUrl).origin,
      searchParams: new URL(fullUrl).searchParams,
    },
    method: options?.method || 'GET',
    json: async () => options?.body || {},
    headers: new Headers(options?.headers || {}),
  }
}

/**
 * Mock du système de fichiers pour les tests de DB JSON
 */
export function createMockFileSystem() {
  const files: Record<string, string> = {}

  return {
    files,
    async readFile(path: string): Promise<string> {
      if (!(path in files)) {
        const error = new Error(`ENOENT: no such file or directory, open '${path}'`)
        ;(error as any).code = 'ENOENT'
        throw error
      }
      return files[path]
    },
    async writeFile(path: string, content: string): Promise<void> {
      files[path] = content
    },
    async access(path: string): Promise<void> {
      if (!(path in files)) {
        const error = new Error(`ENOENT: no such file or directory, access '${path}'`)
        ;(error as any).code = 'ENOENT'
        throw error
      }
    },
    async mkdir(path: string): Promise<void> {
      // Mock - ne fait rien
    },
    clear() {
      Object.keys(files).forEach(key => delete files[key])
    },
  }
}

/**
 * Attendre un certain temps (utile pour les tests de cache avec TTL)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Mock de localStorage pour les tests de cache client
 */
export function createMockLocalStorage() {
  const storage: Record<string, string> = {}

  return {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => {
      storage[key] = value
    },
    removeItem: (key: string) => {
      delete storage[key]
    },
    clear: () => {
      Object.keys(storage).forEach(key => delete storage[key])
    },
    get length() {
      return Object.keys(storage).length
    },
    key: (index: number) => {
      const keys = Object.keys(storage)
      return keys[index] || null
    },
  }
}

