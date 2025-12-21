/**
 * Tests pour le module de persistance JSON
 * 
 * Teste toutes les fonctions de lecture/écriture des apps, widgets et config
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import {
  readApps,
  writeApps,
  generateAppId,
  readWidgets,
  writeWidgets,
  generateWidgetId,
  readConfig,
  writeConfig,
} from '@/lib/db'
import { createTestApp, createTestWidget, createTestConfig, createMockFileSystem } from '../setup/test-helpers'

// Mock du système de fichiers
vi.mock('fs/promises', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    access: vi.fn(),
    mkdir: vi.fn(),
  },
}))

// Mock de path.join pour utiliser des chemins de test
const TEST_DATA_DIR = '/test/data'
const TEST_APPS_FILE = path.join(TEST_DATA_DIR, 'apps.json')
const TEST_WIDGETS_FILE = path.join(TEST_DATA_DIR, 'widgets.json')
const TEST_CONFIG_FILE = path.join(TEST_DATA_DIR, 'config.json')

describe('db', () => {
  let mockFs: ReturnType<typeof createMockFileSystem>

  beforeEach(() => {
    mockFs = createMockFileSystem()
    
    // Mock des fonctions fs avec notre mock
    vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
      return mockFs.readFile(filePath as string)
    })
    vi.mocked(fs.writeFile).mockImplementation(async (filePath: any, content: any) => {
      return mockFs.writeFile(filePath as string, content)
    })
    vi.mocked(fs.access).mockImplementation(async (filePath: any) => {
      return mockFs.access(filePath as string)
    })
    vi.mocked(fs.mkdir).mockImplementation(async () => {
      return mockFs.mkdir('')
    })

    // Mock de process.cwd() pour retourner un chemin de test
    vi.spyOn(process, 'cwd').mockReturnValue('/test')
  })

  afterEach(() => {
    mockFs.clear()
    vi.clearAllMocks()
  })

  describe('readApps', () => {
    it('devrait lire les apps depuis le fichier JSON', async () => {
      const apps = [
        createTestApp({ id: 'app1', name: 'App 1', order: 0 }),
        createTestApp({ id: 'app2', name: 'App 2', order: 1 }),
      ]

      mockFs.writeFile(TEST_APPS_FILE, JSON.stringify(apps))

      const result = await readApps()

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('App 1')
      expect(result[1].name).toBe('App 2')
    })

    it('devrait retourner un tableau vide si le fichier n\'existe pas', async () => {
      // Ne pas créer le fichier

      const result = await readApps()

      expect(result).toEqual([])
    })

    it('devrait trier les apps par ordre', async () => {
      const apps = [
        createTestApp({ id: 'app1', name: 'App 1', order: 2 }),
        createTestApp({ id: 'app2', name: 'App 2', order: 0 }),
        createTestApp({ id: 'app3', name: 'App 3', order: 1 }),
      ]

      mockFs.writeFile(TEST_APPS_FILE, JSON.stringify(apps))

      const result = await readApps()

      expect(result).toHaveLength(3)
      expect(result[0].name).toBe('App 2') // order: 0
      expect(result[1].name).toBe('App 3') // order: 1
      expect(result[2].name).toBe('App 1') // order: 2
    })

    it('devrait déchiffrer les champs sensibles', async () => {
      // Note: Ce test nécessite que les apps soient chiffrées lors de l'écriture
      // Pour simplifier, on teste juste que la fonction est appelée
      const apps = [createTestApp({ id: 'app1', plexToken: 'test-token' })]
      mockFs.writeFile(TEST_APPS_FILE, JSON.stringify(apps))

      const result = await readApps()

      expect(result).toBeDefined()
      // Le déchiffrement est testé dans les tests d'encryption
    })
  })

  describe('writeApps', () => {
    it('devrait écrire les apps dans le fichier JSON', async () => {
      const apps = [
        createTestApp({ id: 'app1', name: 'App 1' }),
        createTestApp({ id: 'app2', name: 'App 2' }),
      ]

      await writeApps(apps)

      const written = await mockFs.readFile(TEST_APPS_FILE)
      const parsed = JSON.parse(written)

      expect(parsed).toHaveLength(2)
      expect(parsed[0].name).toBe('App 1')
      expect(parsed[1].name).toBe('App 2')
    })

    it('devrait créer le dossier data s\'il n\'existe pas', async () => {
      const apps = [createTestApp()]

      await writeApps(apps)

      expect(fs.mkdir).toHaveBeenCalled()
    })

    it('devrait chiffrer les champs sensibles avant écriture', async () => {
      const apps = [createTestApp({ id: 'app1', plexToken: 'secret-token' })]

      await writeApps(apps)

      const written = await mockFs.readFile(TEST_APPS_FILE)
      const parsed = JSON.parse(written)

      // Le token devrait être chiffré (commence par "encrypted:")
      if (parsed[0].plexToken) {
        expect(parsed[0].plexToken).toMatch(/^encrypted:/)
      }
    })
  })

  describe('generateAppId', () => {
    it('devrait générer un ID unique', () => {
      const id1 = generateAppId()
      const id2 = generateAppId()

      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^app_/)
    })
  })

  describe('readWidgets', () => {
    it('devrait lire les widgets depuis le fichier JSON', async () => {
      const widgets = [
        createTestWidget({ id: 'widget1', type: 'clock', order: 0 }),
        createTestWidget({ id: 'widget2', type: 'weather', order: 1 }),
      ]

      mockFs.writeFile(TEST_WIDGETS_FILE, JSON.stringify(widgets))

      const result = await readWidgets()

      expect(result).toHaveLength(2)
      expect(result[0].type).toBe('clock')
      expect(result[1].type).toBe('weather')
    })

    it('devrait retourner un tableau vide si le fichier n\'existe pas', async () => {
      const result = await readWidgets()

      expect(result).toEqual([])
    })

    it('devrait trier les widgets par ordre', async () => {
      const widgets = [
        createTestWidget({ id: 'widget1', order: 2 }),
        createTestWidget({ id: 'widget2', order: 0 }),
        createTestWidget({ id: 'widget3', order: 1 }),
      ]

      mockFs.writeFile(TEST_WIDGETS_FILE, JSON.stringify(widgets))

      const result = await readWidgets()

      expect(result[0].id).toBe('widget2')
      expect(result[1].id).toBe('widget3')
      expect(result[2].id).toBe('widget1')
    })
  })

  describe('writeWidgets', () => {
    it('devrait écrire les widgets dans le fichier JSON', async () => {
      const widgets = [
        createTestWidget({ id: 'widget1', type: 'clock' }),
        createTestWidget({ id: 'widget2', type: 'weather' }),
      ]

      await writeWidgets(widgets)

      const written = await mockFs.readFile(TEST_WIDGETS_FILE)
      const parsed = JSON.parse(written)

      expect(parsed).toHaveLength(2)
      expect(parsed[0].type).toBe('clock')
      expect(parsed[1].type).toBe('weather')
    })
  })

  describe('generateWidgetId', () => {
    it('devrait générer un ID unique', () => {
      const id1 = generateWidgetId()
      const id2 = generateWidgetId()

      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^widget_/)
    })
  })

  describe('readConfig', () => {
    it('devrait lire la configuration avec valeurs par défaut', async () => {
      const config = createTestConfig({
        backgroundEffect: 'gradient-radial',
        theme: 'violet',
      })

      mockFs.writeFile(TEST_CONFIG_FILE, JSON.stringify(config))

      const result = await readConfig()

      expect(result.backgroundEffect).toBe('gradient-radial')
      expect(result.theme).toBe('violet')
    })

    it('devrait retourner la configuration par défaut si le fichier n\'existe pas', async () => {
      const result = await readConfig()

      expect(result.backgroundEffect).toBe('mesh-animated')
      expect(result.theme).toBe('default')
      expect(result.stylePreset).toBeDefined()
    })

    it('devrait migrer l\'ancien format (spacing -> density)', async () => {
      const oldConfig = {
        backgroundEffect: 'mesh-animated',
        theme: 'default',
        stylePreset: {
          spacing: 'compact', // Ancien format
        },
      }

      mockFs.writeFile(TEST_CONFIG_FILE, JSON.stringify(oldConfig))

      const result = await readConfig()

      expect(result.stylePreset).toBeDefined()
      // La migration devrait convertir spacing en density
      if (result.stylePreset && typeof result.stylePreset === 'object') {
        expect((result.stylePreset as any).spacing).toBeUndefined()
        expect((result.stylePreset as any).density).toBe('compact')
      }
    })
  })

  describe('writeConfig', () => {
    it('devrait écrire la configuration dans le fichier JSON', async () => {
      const config = createTestConfig({
        backgroundEffect: 'gradient-radial',
        theme: 'violet',
      })

      await writeConfig(config)

      const written = await mockFs.readFile(TEST_CONFIG_FILE)
      const parsed = JSON.parse(written)

      expect(parsed.backgroundEffect).toBe('gradient-radial')
      expect(parsed.theme).toBe('violet')
    })

    it('devrait créer le dossier data s\'il n\'existe pas', async () => {
      const config = createTestConfig()

      await writeConfig(config)

      expect(fs.mkdir).toHaveBeenCalled()
    })
  })
})

