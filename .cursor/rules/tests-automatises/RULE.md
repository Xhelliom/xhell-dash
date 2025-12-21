---
description: "Règle pour créer automatiquement des tests Vitest pour chaque nouvelle route API ou fonction. S'applique lors de la création/modification de routes API dans app/api ou cards/, ou de fonctions dans lib/."
globs:
  - "app/api/**/route.ts"
  - "cards/**/route.ts"
  - "lib/**/*.ts"
alwaysApply: false
---

# Tests automatisés obligatoires

## Règle principale : Tests pour chaque route API et fonction

**QUAND** tu crées ou modifies :
- Une nouvelle route API dans `app/api/**/route.ts` ou `cards/*/route.ts`
- Une nouvelle fonction exportée dans `lib/*.ts`
- Un nouveau handler HTTP (GET, POST, PUT, DELETE, PATCH)

**ALORS** tu DOIS automatiquement créer un fichier de test Vitest correspondant avec :

### 1. Structure du fichier de test

- **Emplacement** : Créer dans `__tests__/` en mimant la structure source
  - `app/api/apps/route.ts` → `__tests__/app/api/apps/route.test.ts`
  - `cards/plex/route.ts` → `__tests__/cards/plex/route.test.ts`
  - `lib/encryption.ts` → `__tests__/lib/encryption.test.ts` (déjà existant comme exemple)

### 2. Structure du test pour les routes API

```typescript
/**
 * Tests pour la route API [NOM_ROUTE]
 * 
 * Teste toutes les méthodes HTTP (GET, POST, PUT, DELETE) 
 * et leurs cas d'usage (succès, erreurs, authentification)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { GET, POST, PUT, DELETE } from '[CHEMIN_ROUTE]'
import { createMockSession, createMockRequest } from '@/__tests__/setup/test-helpers'

describe('[NOM_ROUTE] API', () => {
  // Setup et teardown
  beforeEach(() => {
    vi.clearAllMocks()
    // Configuration spécifique si nécessaire
  })

  describe('GET', () => {
    it('devrait retourner les données avec succès', async () => {
      // Arrange
      const request = createMockRequest('/api/route')
      
      // Act
      const response = await GET(request)
      const data = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(data).toBeDefined()
    })

    it('devrait retourner 401 si non authentifié', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValue(null)
      const request = createMockRequest('/api/route')
      
      // Act
      const response = await GET(request)
      const data = await response.json()
      
      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBeDefined()
    })

    // Autres cas : 403 (admin requis), 404 (ressource introuvable), 400 (validation)
  })

  describe('POST', () => {
    it('devrait créer une ressource avec succès', async () => {
      // Arrange
      const mockSession = createMockSession({ role: 'admin' })
      vi.mocked(auth).mockResolvedValue(mockSession as any)
      
      const request = createMockRequest('/api/route', {
        method: 'POST',
        body: { /* données valides */ }
      })
      
      // Act
      const response = await POST(request)
      const data = await response.json()
      
      // Assert
      expect(response.status).toBe(201)
      expect(data).toBeDefined()
    })

    it('devrait retourner 400 si données invalides', async () => {
      // Arrange
      const mockSession = createMockSession({ role: 'admin' })
      vi.mocked(auth).mockResolvedValue(mockSession as any)
      
      const request = createMockRequest('/api/route', {
        method: 'POST',
        body: { /* données invalides */ }
      })
      
      // Act
      const response = await POST(request)
      const data = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    // Autres cas : 403 (non-admin), 409 (conflit), 500 (erreur serveur)
  })

  // Répéter pour PUT, DELETE si applicable
})
```

### 3. Structure du test pour les fonctions lib/

```typescript
/**
 * Tests pour [NOM_MODULE]
 * 
 * Teste toutes les fonctions exportées avec leurs cas limites
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { 
  fonction1,
  fonction2,
} from '@/lib/[NOM_MODULE]'

describe('[NOM_MODULE]', () => {
  beforeEach(() => {
    // Setup si nécessaire (variables d'env, mocks, etc.)
  })

  describe('fonction1', () => {
    it('devrait fonctionner avec des données valides', () => {
      // Arrange
      const input = { /* données de test */ }
      
      // Act
      const result = fonction1(input)
      
      // Assert
      expect(result).toBeDefined()
      expect(result).toEqual(/* résultat attendu */)
    })

    it('devrait gérer les cas limites (valeurs nulles, vides, etc.)', () => {
      // Test des cas limites
    })

    it('devrait lever une erreur avec des données invalides', () => {
      // Test des erreurs
    })
  })

  describe('fonction2', () => {
    // Tests similaires
  })
})
```

### 4. Bonnes pratiques à suivre

- **Commentaires en français** : Tous les commentaires et messages doivent être en français
- **Nommage descriptif** : Utiliser des noms explicites (ex: `devrait retourner 401 si non authentifié`)
- **Pattern AAA** : Arrange, Act, Assert pour chaque test
- **Helpers existants** : Utiliser les fonctions de `__tests__/setup/test-helpers.ts`
  - `createMockSession()` pour les sessions utilisateur
  - `createMockRequest()` pour les requêtes HTTP
  - `createTestApp()`, `createTestUser()`, etc. pour les données de test
- **Couverture complète** : Tester :
  - Cas de succès (200, 201)
  - Cas d'erreur (400, 401, 403, 404, 500)
  - Validation des entrées
  - Authentification et autorisation
  - Cas limites et edge cases
- **Mocks appropriés** : 
  - Mocker `auth()` pour les routes protégées
  - Mocker `readApps()`, `writeApps()`, etc. pour les accès DB
  - Mocker les appels HTTP externes avec `vi.fn()`

### 5. Exemple concret

Si tu crées `app/api/apps/new-route/route.ts` avec une fonction `GET`, crée automatiquement :
- `__tests__/app/api/apps/new-route/route.test.ts`
- Teste au minimum : succès, non authentifié, erreur serveur

### 6. Vérification

Après avoir créé le test :
- Vérifie que le test compile (`npm run test`)
- Vérifie que tous les cas sont couverts
- Assure-toi que les mocks sont correctement configurés

## Règle stricte

**NE JAMAIS** commiter une nouvelle route ou fonction sans son test correspondant. Les tests doivent être créés **en même temps** que le code, pas après.

