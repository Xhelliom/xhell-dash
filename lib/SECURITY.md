# Guide de Sécurité - Chiffrement et Variables d'Environnement

Ce document explique comment utiliser le système de chiffrement et les variables d'environnement pour sécuriser les tokens API.

## Chiffrement des Tokens

Les tokens sensibles sont automatiquement chiffrés lors de leur stockage dans la base de données et déchiffrés lors de leur lecture.

### Configuration

1. **Générer une clé de chiffrement** :
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Ajouter la clé dans `.env.local`** :
   ```env
   ENCRYPTION_KEY=votre_clé_hexadécimale_de_64_caractères
   ```

   Ou en base64 :
   ```env
   ENCRYPTION_KEY=votre_clé_base64_de_44_caractères
   ```

### Fonctionnement

- **Lors de l'écriture** : Les tokens sensibles sont automatiquement chiffrés avec AES-256-GCM
- **Lors de la lecture** : Les tokens sont automatiquement déchiffrés
- **Mode dégradé** : Si `ENCRYPTION_KEY` n'est pas définie, les tokens sont stockés en clair (avec un avertissement)

### Champs automatiquement chiffrés

- `plexToken`
- `apiKey`, `apikey`, `api_key`
- `token`
- `password`
- `secret`
- `credential`
- Tous les champs contenant ces mots-clés dans leur nom

## Variables d'Environnement pour les Tokens

Au lieu de stocker les tokens directement dans la base de données, vous pouvez utiliser des variables d'environnement.

### Format

Dans la base de données, stockez une référence à la variable d'environnement :

```json
{
  "name": "My Plex Server",
  "plexToken": "${PLEX_TOKEN}"
}
```

Dans `.env.local` :

```env
PLEX_TOKEN=your-actual-plex-token-here
```

### Syntaxe

- **Référence simple** : `${VAR_NAME}` - Utilise la variable d'environnement `VAR_NAME`
- **Avec valeur par défaut** : `${VAR_NAME:default-value}` - Utilise `default-value` si la variable n'existe pas

### Exemples

```json
// Dans apps.json
{
  "plexToken": "${PLEX_TOKEN}",
  "sonarrApiKey": "${SONARR_API_KEY:default-key}",
  "radarrApiKey": "${RADARR_API_KEY}"
}
```

```env
# Dans .env.local
PLEX_TOKEN=abc123xyz
SONARR_API_KEY=sonarr-key-here
# RADARR_API_KEY n'est pas définie, donc "default-key" sera utilisé
```

### Avantages

1. **Sécurité** : Les tokens ne sont pas stockés dans la base de données
2. **Flexibilité** : Facile de changer les tokens sans modifier la base de données
3. **Environnements multiples** : Utiliser des tokens différents selon l'environnement (dev, prod)

## Migration depuis l'Ancien Système

Si vous avez déjà des tokens stockés en clair dans la base de données :

1. **Activer le chiffrement** :
   - Ajoutez `ENCRYPTION_KEY` dans `.env.local`
   - Les nouveaux tokens seront automatiquement chiffrés
   - Les anciens tokens resteront en clair jusqu'à leur prochaine modification

2. **Migrer vers les variables d'environnement** :
   - Remplacez les valeurs dans `apps.json` par des références `${VAR_NAME}`
   - Ajoutez les variables dans `.env.local`
   - Redémarrez l'application

## Bonnes Pratiques

1. **Ne jamais commiter** :
   - `.env.local` (déjà dans `.gitignore`)
   - `data/apps.json` si elle contient des tokens (considérer l'ajouter à `.gitignore`)

2. **Utiliser des clés fortes** :
   - Générez une clé de chiffrement aléatoire de 32 bytes
   - Ne réutilisez jamais la même clé entre environnements

3. **Rotation des clés** :
   - Si vous changez `ENCRYPTION_KEY`, les anciens tokens chiffrés ne pourront plus être déchiffrés
   - Planifiez une migration : déchiffrez avec l'ancienne clé, rechiffrez avec la nouvelle

4. **Variables d'environnement** :
   - Préférez les variables d'environnement pour les tokens en production
   - Utilisez des gestionnaires de secrets (Vault, AWS Secrets Manager, etc.) pour les environnements critiques

## Dépannage

### Les tokens ne sont pas déchiffrés

- Vérifiez que `ENCRYPTION_KEY` est bien définie dans `.env.local`
- Vérifiez que la clé est correcte (64 caractères hex ou 44 caractères base64)
- Redémarrez l'application après avoir modifié `.env.local`

### Les variables d'environnement ne sont pas résolues

- Vérifiez que la variable est bien définie dans `.env.local`
- Vérifiez le format : `${VAR_NAME}` (avec les accolades)
- Redémarrez l'application après avoir modifié `.env.local`

### Avertissement "ENCRYPTION_KEY n'est pas définie"

C'est normal si vous n'avez pas encore configuré le chiffrement. Les tokens seront stockés en clair jusqu'à ce que vous définissiez `ENCRYPTION_KEY`.

