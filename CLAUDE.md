# CLAUDE.md

Guide pour travailler sur ce dépôt avec Claude Code. Le code, les commentaires
et les messages d'erreur sont en **français** : conservez cette convention.

## Présentation

Xhell Dashboard est un tableau de bord auto-hébergé (Next.js 16 App Router,
React 19, TypeScript) qui centralise des raccourcis vers des applications
(Plex, Sonarr, Radarr, TrueNAS, Home Assistant…) avec statistiques en temps
réel. Persistance : fichiers JSON pour les apps/widgets/config, SQLite via
Prisma pour les utilisateurs. Déploiement Docker (image standalone).

## Commandes

```bash
npm run dev            # Serveur de dev (http://localhost:3000)
npm run build          # Build de production (typecheck inclus)
npm test               # Tests unitaires (Vitest, run unique)
npm run test:watch     # Tests en watch
npm run lint           # ESLint (0 erreur attendu ; ~380 warnings tolérés)
npm run format         # Prettier (écriture)
npm run format:check   # Prettier (vérification)
npx tsc --noEmit       # Typecheck seul
npx prisma generate    # Régénérer le client Prisma (après modif du schéma)
npx prisma db push     # Initialiser/mettre à jour la base SQLite
npx knip               # Détection de code/dépendances inutilisés
```

Un seul test : `npm test -- card-route` (filtre par nom de fichier).

## Architecture

- **`app/`** — App Router. Pages (`page.tsx`, `login/`, `layout.tsx`) et routes
  API sous `app/api/**/route.ts` (apps, users, widgets, config, health, auth).
- **`cards/`** — Système de cartes modulaires (une par intégration). Cœur de
  l'extensibilité, voir ci-dessous.
- **`components/`** — Composants React ; `components/ui/` est la bibliothèque
  shadcn/ui (ignorée par knip).
- **`lib/`** — Utilitaires : `db.ts` (JSONDB), `card-registry.ts`,
  `card-route.ts` (helpers de routes de cartes), `encryption.ts`,
  `env-tokens.ts`, `users.ts`, `api-retry.ts`, `cache-client.ts`, etc.
- **`prisma/`** — Schéma SQLite (modèle `User` uniquement).
- **`__tests__/`** — Tests Vitest (`lib/`, `api/`, `cards/`, `setup/`).
- **`auth.ts`** — Configuration Auth.js v5 (provider Credentials + bcrypt).
- **`proxy.ts`** — Remplace `middleware.ts` en Next.js 16 ; protège les routes
  (redirige vers `/login` si non authentifié).

### Système de cartes (point clé)

Chaque carte vit dans `cards/<id>/` et s'auto-enregistre dans `cardRegistry`
à l'import. `cards/index.ts` importe toutes les cartes ; cet import est
déclenché par `app/api/apps/[id]/stats/[templateId]/route.ts`, qui route
dynamiquement vers le bon handler via `import("@/cards/<templateId>/route")`.

Structure d'une carte :

- `index.ts` — `CardDefinition` + `cardRegistry.register(...)` (auto-exécuté).
- `route.ts` — handler `GET` des statistiques (côté serveur, accès `fs`).
- `panel.tsx` — panneau détaillé des stats.
- `types.ts` — types spécifiques à la carte.
- `card-stat.tsx`, `validation.ts` — optionnels.

**Les handlers `route.ts` n'écrivent PAS le squelette à la main.** Ils utilisent
`createCardStatsRoute` de `lib/card-route.ts`, qui gère la lecture de l'app, la
vérification du template, les en-têtes de cache et la gestion d'erreurs :

```ts
export const GET = createCardStatsRoute<MaCarteStats>({
  templateId: "ma-carte",
  templateLabel: "Ma Carte",
  fetchStats: async (app) => {
    const apiUrl = getAppUrl(app);
    const apiKey = getCredential(app, "apiKey", "maCarteApiKey");
    if (!apiKey) throw new CardConfigError("Clé API non configurée…");
    return fetchMaCarteStats(apiUrl, apiKey);
  },
});
```

Conventions associées :

- Validation d'identifiants → lever une `CardConfigError(message, status?, hint?)`
  (renvoyée en 400 par défaut). Les timeouts (`TimeoutError`/`AbortError`) sont
  renvoyés en 504 automatiquement.
- `getCredential(app, ...clés)` remplace les casts `(app as any).x` pour lire
  les champs d'identifiants non typés sur `App`.
- Files \*arr (Sonarr/Radarr/Lidarr) : utiliser `parseQueueResponse(response)`.
- `cards/TEMPLATE/` est le squelette de référence pour créer une nouvelle carte.
- knip considère `cards/**/route.ts` comme points d'entrée (chargement dynamique).

### Données et sécurité

- `lib/db.ts` lit/écrit `data/apps.json`, `data/widgets.json`, `data/config.json`.
- À l'écriture, les champs sensibles (`apiKey`, `plexToken`…) sont chiffrés en
  AES-256-GCM (`lib/encryption.ts`) ; ils sont déchiffrés à la lecture. La clé
  vient de `ENCRYPTION_KEY` (hex 64 car. ou base64 44 car.). Voir `lib/SECURITY.md`.
- Les tokens peuvent référencer une variable d'env via `"${VAR_NAME}"`, résolu
  à la lecture par `lib/env-tokens.ts`.
- Les utilisateurs sont en base SQLite (Prisma). Un admin par défaut
  (`xhell-admin@example.com` / `Admin123!`) est créé au premier login.

## Tests

- Vitest, environnement `node`, `globals: true`. Setup global :
  `__tests__/setup/vitest.setup.ts` (mocke `next/server`, `@/auth`,
  `@/lib/prisma` ; coupe `console`).
- Helpers/factories : `__tests__/setup/test-helpers.ts` (`createTestApp`, etc.).
- Pour tester un handler de carte : mocker `@/lib/db` (`readApps`) et `global.fetch`
  (`vi.stubGlobal`). Exemple : `__tests__/cards/sonarr.test.ts`.
- Les helpers partagés sont testés dans `__tests__/lib/card-route.test.ts`.

## Conventions et pièges

- **Next.js 16** : `proxy.ts` (pas `middleware.ts`) ; `params` est une `Promise`
  dans les routes (`const { id } = await params`).
- **Dépendances** : mises à jour dans le major courant uniquement (voir
  `overrides`, dont `eslint-plugin-react-hooks` épinglé à 7.0.1 pour éviter des
  erreurs de lint du React Compiler). Le build typecheck l'intégralité du projet.
- ESLint autorise les warnings (`no-explicit-any` est répandu) mais **aucune
  erreur**. Lancer `npm run lint` avant de committer.
- Ne pas committer `data/*.json` ni de secrets.
