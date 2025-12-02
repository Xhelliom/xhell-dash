# Xhell Dashboard

Dashboard configurable monopage pour gérer vos raccourcis vers différentes applications (Plex, Sonarr, Radarr, Home Assistant, etc.).

## Fonctionnalités

- 🎯 **Dashboard monopage** : Vue d'ensemble de toutes vos applications
- ⚙️ **Configuration simple** : Interface intuitive pour ajouter/modifier/supprimer des applications
- 🎨 **Logos flexibles** : Utilisez des icônes Lucide React ou des URLs d'images
- 📊 **Statistiques configurables** : Affichez des stats depuis des APIs externes
- 💾 **Persistance JSONDB** : Données sauvegardées dans un fichier JSON simple
- 🐳 **Docker ready** : Prêt à être déployé avec Docker Compose

## Technologies utilisées

- **Next.js 16** avec App Router
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** pour les composants UI
- **Lucide React** pour les icônes
- **Docker** pour la containerisation

## Installation et utilisation

### Développement local

1. **Installer les dépendances** :
```bash
npm install
```

2. **Lancer le serveur de développement** :
```bash
npm run dev
```

3. **Ouvrir dans le navigateur** :
```
http://localhost:3000
```

### Production avec Docker

1. **Construire et démarrer avec Docker Compose** :
```bash
docker-compose up -d --build
```

2. **Accéder à l'application** :
```
http://localhost:3000
```

3. **Voir les logs** :
```bash
docker-compose logs -f
```

4. **Arrêter l'application** :
```bash
docker-compose down
```

## Structure du projet

```
Xhell-Dash/
├── app/
│   ├── api/              # Routes API Next.js
│   │   └── apps/         # CRUD des applications
│   ├── layout.tsx        # Layout racine
│   └── page.tsx          # Page dashboard principale
├── components/
│   ├── ui/               # Composants shadcn/ui
│   ├── AppCard.tsx       # Card d'application
│   ├── AppForm.tsx       # Formulaire d'ajout/modification
│   └── ConfigPanel.tsx   # Panneau de configuration
├── lib/
│   ├── db.ts             # Gestion JSONDB
│   └── types.ts          # Types TypeScript
├── data/
│   └── apps.json         # Fichier de persistance (créé automatiquement)
├── Dockerfile            # Configuration Docker
└── docker-compose.yml    # Orchestration Docker
```

## Utilisation

### Ajouter une application

1. Cliquez sur le bouton **"Configuration"** en haut à droite
2. Cliquez sur **"Ajouter une application"**
3. Remplissez le formulaire :
   - **Nom** : Nom de l'application (ex: "Plex", "Sonarr")
   - **URL** : URL complète vers l'application
   - **Type de logo** : Choisissez entre "Icône Lucide" ou "URL d'image"
   - **Logo** : 
     - Si icône : Sélectionnez une icône dans la liste
     - Si URL : Entrez l'URL de l'image
   - **URL de l'API de statistiques** (optionnel) : URL pour récupérer des stats
   - **Libellé de la statistique** (optionnel) : Texte à afficher (ex: "Films", "Utilisateurs")

4. Cliquez sur **"Ajouter"**

### Modifier une application

1. Ouvrez le panneau de configuration
2. Cliquez sur l'icône de crayon sur la card de l'application
3. Modifiez les champs souhaités
4. Cliquez sur **"Modifier"**

### Supprimer une application

1. Ouvrez le panneau de configuration
2. Cliquez sur l'icône de poubelle sur la card de l'application
3. Confirmez la suppression

## Configuration des statistiques

Pour afficher des statistiques sur une card d'application :

1. Configurez l'**URL de l'API de statistiques** lors de l'ajout/modification
2. Configurez le **Libellé de la statistique** (ex: "Films", "Utilisateurs")
3. L'API doit retourner une valeur JSON (nombre ou chaîne) ou un objet avec une propriété `value`, `count` ou `total`

**Exemple de réponse API attendue** :
```json
42
```
ou
```json
{
  "value": 42
}
```

Les statistiques sont rafraîchies automatiquement toutes les 30 secondes.

## Exemples d'applications

Voici quelques exemples d'applications que vous pouvez ajouter :

- **Plex** : `https://plex.example.com`
- **Sonarr** : `https://sonarr.example.com`
- **Radarr** : `https://radarr.example.com`
- **Lidarr** : `https://lidarr.example.com`
- **Home Assistant** : `http://homeassistant.local:8123`
- **Longhorn** : `https://longhorn.example.com`
- **Kubernetes Dashboard** : `https://k8s.example.com`
- **Open WebUI** : `https://openwebui.example.com`
- **Paperless-ngx** : `https://paperless.example.com`
- **Pi-hole** : `http://pi-hole.local/admin`
- **Gotify** : `https://gotify.example.com`

## Persistance des données

Les applications sont sauvegardées dans `data/apps.json`. Ce fichier est créé automatiquement lors de la première utilisation.

**Avec Docker** : Le dossier `data/` est monté comme volume pour persister les données entre les redémarrages du conteneur.

## Scripts disponibles

- `npm run dev` : Lance le serveur de développement
- `npm run build` : Construit l'application pour la production
- `npm run start` : Lance le serveur de production
- `npm run lint` : Vérifie le code avec ESLint

## Licence

MIT
