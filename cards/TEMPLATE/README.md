# Template pour créer une nouvelle carte

Ce dossier contient un template complet pour créer une nouvelle carte modulaire.

## Structure des fichiers

```
TEMPLATE/
├── index.ts          # Export principal - DÉFINIT LA CARTE
├── route.ts          # Handler API pour les statistiques
├── panel.tsx         # Composant du panneau de stats détaillées
├── card-stat.tsx     # Composants custom pour les stats de carte (optionnel)
├── types.ts          # Types TypeScript spécifiques à la carte
└── README.md         # Ce fichier
```

## Étapes pour créer une nouvelle carte

### 1. Créer le dossier

Créez un nouveau dossier dans `cards/` avec le nom de votre carte (ex: `sonarr`, `radarr`).

```bash
mkdir cards/sonarr
```

### 2. Copier les fichiers du template

Copiez tous les fichiers de `cards/TEMPLATE/` vers votre nouveau dossier.

```bash
cp -r cards/TEMPLATE/* cards/sonarr/
```

### 3. Renommer et adapter les fichiers

Dans chaque fichier, remplacez :
- `Template` → Nom de votre carte (ex: `Sonarr`)
- `template` → ID de votre carte (ex: `sonarr`)
- `TemplateStats` → Nom de votre interface de stats (ex: `SonarrStats`)

### 4. Adapter le code

#### `types.ts`
- Définissez les interfaces pour vos données
- Adaptez selon la structure de l'API que vous utilisez

#### `route.ts`
- Adaptez la fonction `fetchTemplateStats` pour appeler votre API
- Modifiez les headers d'authentification selon votre API
- Transformez les données de l'API au format attendu

#### `panel.tsx`
- Adaptez l'affichage selon vos statistiques
- Ajoutez/supprimez des sections selon vos besoins
- Personnalisez les KPI affichés

#### `card-stat.tsx` (optionnel)
- Créez ce fichier seulement si vous avez besoin d'un type custom
- Définissez votre composant personnalisé
- Enregistrez-le dans `index.ts` dans `cardStatComponents`

#### `index.ts`
- **IMPORTANT** : Changez l'ID de la carte pour correspondre au nom du dossier
- **IMPORTANT** : Ne pas importer le handler API (`route.ts`) ici car il utilise `fs` (côté serveur uniquement)
- Le handler API sera chargé dynamiquement par la route API
- Adaptez le template selon vos besoins
- Enregistrez tous vos composants dans `cardStatComponents` si nécessaire

### 5. Ajouter les champs de configuration

**IMPORTANT** : Pour que les utilisateurs puissent configurer les clés API, tokens ou autres informations d'authentification, vous devez ajouter les champs dans le formulaire de configuration.

Modifiez le fichier `components/config/TemplateSpecificForm.tsx` :

1. **Ajoutez une condition pour votre template** dans la fonction `TemplateSpecificForm`
2. **Créez les champs de formulaire** nécessaires (clé API, token, username/password, etc.)
3. **Utilisez le type `password`** pour les champs sensibles (clés API, tokens, mots de passe)

#### Exemple : Ajouter la configuration pour Sonarr

```typescript
// Dans components/config/TemplateSpecificForm.tsx

// Configuration pour Sonarr (utilise X-Api-Key)
if (templateId === 'sonarr') {
  const apiKey = (app as any)?.apiKey || (app as any)?.sonarrApiKey || ''

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Configuration Sonarr</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configurez les paramètres spécifiques à Sonarr
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sonarrApiKey">Clé API *</Label>
          <Input
            id="sonarrApiKey"
            type="password"
            value={apiKey}
            onChange={(e) => handleChange('apiKey' as keyof CreateAppInput, e.target.value)}
            placeholder="Votre clé API Sonarr"
            required
          />
          <p className="text-xs text-muted-foreground">
            La clé API est nécessaire pour récupérer les statistiques.
            Vous pouvez la trouver dans les paramètres de votre instance Sonarr (Settings → General → Security).
          </p>
        </div>
      </div>
    </div>
  )
}
```

#### Exemple : Configuration avec plusieurs options (TrueNAS)

Si votre service supporte plusieurs méthodes d'authentification :

```typescript
// Configuration pour TrueNAS (API key ou username/password)
if (templateId === 'truenas') {
  const apiKey = (app as any)?.apiKey || (app as any)?.truenasApiKey || ''
  const username = (app as any)?.username || ''
  const password = (app as any)?.password || ''

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Configuration TrueNAS</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configurez les paramètres d'authentification TrueNAS
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="truenasApiKey">Clé API (optionnel)</Label>
          <Input
            id="truenasApiKey"
            type="password"
            value={apiKey}
            onChange={(e) => handleChange('apiKey' as keyof CreateAppInput, e.target.value)}
            placeholder="Votre clé API TrueNAS"
          />
          <p className="text-xs text-muted-foreground">
            Vous pouvez utiliser une clé API ou un nom d'utilisateur/mot de passe.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="truenasUsername">Nom d'utilisateur (si pas de clé API)</Label>
          <Input
            id="truenasUsername"
            type="text"
            value={username}
            onChange={(e) => handleChange('username' as keyof CreateAppInput, e.target.value)}
            placeholder="admin"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="truenasPassword">Mot de passe (si pas de clé API)</Label>
          <Input
            id="truenasPassword"
            type="password"
            value={password}
            onChange={(e) => handleChange('password' as keyof CreateAppInput, e.target.value)}
            placeholder="Votre mot de passe"
          />
        </div>
      </div>
    </div>
  )
}
```

#### Noms de champs recommandés

Pour que les champs soient automatiquement reconnus comme sensibles et chiffrés :

- **Clé API** : Utilisez `apiKey` comme nom principal (ou `{service}ApiKey` comme variante)
- **Token** : Utilisez `token` (ou `{service}Token`)
- **Mot de passe** : Utilisez `password`
- **Nom d'utilisateur** : Utilisez `username`

Ces noms sont automatiquement reconnus par le système de chiffrement et de masquage.

#### Support des variables d'environnement

Les utilisateurs peuvent utiliser des variables d'environnement dans les champs de configuration :

- Valeur directe : `"votre-clé-api"`
- Variable d'environnement : `"${SONARR_API_KEY}"`
- Avec valeur par défaut : `"${SONARR_API_KEY:default-key}"`

Les variables sont automatiquement résolues lors de la lecture des applications.

#### Récupération dans route.ts

Dans votre fichier `route.ts`, récupérez les valeurs configurées :

```typescript
// Récupérer les informations de connexion depuis l'app
const apiUrl = app.url?.replace(/\/$/, '') || ''
const apiKey = (app as any).apiKey || (app as any).sonarrApiKey

if (!apiKey) {
  return NextResponse.json(
    { 
      error: 'Clé API non configurée. Veuillez configurer la clé API dans les paramètres de l\'application.',
    },
    { status: 400 }
  )
}
```

**Note** : Les valeurs sont automatiquement déchiffrées et les variables d'environnement sont résolues par `readApps()`, vous n'avez pas besoin de le faire manuellement.

### 6. Enregistrer la carte

Ajoutez un import dans `cards/index.ts` :

```typescript
import './sonarr'
```

### 7. Tester

1. Redémarrez le serveur de développement
2. Créez une nouvelle application avec votre template
3. Vérifiez que les champs de configuration apparaissent dans le formulaire
4. Configurez les clés API/tokens nécessaires
5. Vérifiez que les statistiques s'affichent correctement

## Exemple : Carte Sonarr

Voici un exemple rapide pour créer une carte Sonarr :

1. **Dossier** : `cards/sonarr/`
2. **ID** : `sonarr`
3. **API** : Sonarr API (http://sonarr:8989/api/v3)
4. **Authentification** : Header `X-Api-Key`
5. **Endpoints** :
   - `/api/v3/system/status` pour les stats générales
   - `/api/v3/queue` pour la queue
   - `/api/v3/calendar` pour le calendrier

## Notes importantes

- L'ID de la carte doit être unique et correspondre au nom du dossier
- Le template doit avoir le même ID que la carte
- Tous les fichiers sont optionnels sauf `index.ts` (mais recommandés)
- Les types `number` et `chart` sont toujours disponibles pour les stats de carte
- Les types custom doivent être enregistrés dans `cardStatComponents`
- **N'oubliez pas d'ajouter les champs de configuration** dans `TemplateSpecificForm.tsx` pour que les utilisateurs puissent configurer les clés API/tokens
- Les champs sensibles (apiKey, token, password) sont automatiquement chiffrés et masqués dans l'interface
- Les variables d'environnement sont automatiquement résolues (format : `${VAR_NAME}` ou `${VAR_NAME:default}`)

## Besoin d'aide ?

Consultez la carte Plex (`cards/plex/`) comme exemple de référence complète.

