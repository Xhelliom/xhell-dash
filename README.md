# Xhell Dashboard

Tableau de bord auto-hébergé pour centraliser les raccourcis vers vos applications (Plex, Sonarr, Radarr, Home Assistant, TrueNAS…) avec statistiques en temps réel.

---

## Quickstart — Docker Compose (recommandé)

> **Prérequis** : Docker >= 24 et Docker Compose v2

### 1. Cloner le dépôt et préparer le fichier d'environnement

```bash
git clone https://github.com/Xhelliom/xhell-dash.git
cd xhell-dash
cp .env.example .env
```

### 2. Générer les secrets obligatoires

```bash
# AUTH_SECRET — clé de signature des sessions (obligatoire)
openssl rand -base64 32

# ENCRYPTION_KEY — chiffrement AES-256 des tokens API en base (recommandé)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copiez les valeurs générées dans `.env` :

```dotenv
AUTH_SECRET="<valeur générée par openssl>"
AUTH_URL="http://<votre-ip-ou-domaine>:3000"   # URL publique de l'app
ENCRYPTION_KEY="<valeur générée par node>"
```

### 3. Démarrer

```bash
docker compose up -d
```

La base de données SQLite est initialisée automatiquement au premier démarrage.

### 4. Première connexion

Ouvrez `http://localhost:3000` (ou l'`AUTH_URL` configurée).

| Champ        | Valeur par défaut         |
| ------------ | ------------------------- |
| Email        | `xhell-admin@example.com` |
| Mot de passe | `Admin123!`               |

> **Changez ce mot de passe immédiatement** via le menu profil en haut à droite.

### Commandes utiles

```bash
docker compose logs -f          # Voir les logs en direct
docker compose pull && docker compose up -d   # Mettre à jour l'image
docker compose down             # Arrêter
docker compose down -v          # Arrêter et supprimer les données
```

---

## Déploiement Kubernetes

### Pré-requis

- Un `Secret` Kubernetes avec les variables sensibles
- Un `PersistentVolumeClaim` pour les données

### 1. Créer le Secret

```bash
kubectl create secret generic xhell-dash-secret \
  --from-literal=AUTH_SECRET="$(openssl rand -base64 32)" \
  --from-literal=ENCRYPTION_KEY="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" \
  --namespace=default
```

### 2. Manifests

```yaml
# xhell-dash.yaml
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: xhell-dash-data
spec:
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 1Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: xhell-dash
spec:
  replicas: 1
  selector:
    matchLabels:
      app: xhell-dash
  template:
    metadata:
      labels:
        app: xhell-dash
    spec:
      containers:
        - name: xhell-dash
          image: ghcr.io/xhelliom/xhell-dash:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              value: "file:/app/data/xhell.db"
            - name: AUTH_URL
              value: "https://dash.example.com" # Adapter à votre domaine
            - name: AUTH_SECRET
              valueFrom:
                secretKeyRef:
                  name: xhell-dash-secret
                  key: AUTH_SECRET
            - name: ENCRYPTION_KEY
              valueFrom:
                secretKeyRef:
                  name: xhell-dash-secret
                  key: ENCRYPTION_KEY
          volumeMounts:
            - name: data
              mountPath: /app/data
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: xhell-dash-data
---
apiVersion: v1
kind: Service
metadata:
  name: xhell-dash
spec:
  selector:
    app: xhell-dash
  ports:
    - port: 80
      targetPort: 3000
```

```bash
kubectl apply -f xhell-dash.yaml
```

> Pour exposer le service, ajoutez un `Ingress` ou utilisez `kubectl port-forward service/xhell-dash 3000:80`.

---

## Variables d'environnement

| Variable                | Obligatoire | Description                                                     |
| ----------------------- | :---------: | --------------------------------------------------------------- |
| `AUTH_SECRET`           |     ✅      | Clé de signature des sessions (≥ 32 caractères aléatoires)      |
| `AUTH_URL`              |   ✅ prod   | URL publique de l'application (ex: `https://dash.example.com`)  |
| `DATABASE_URL`          |     ✅      | Chemin SQLite — par défaut `file:/app/data/xhell.db` en Docker  |
| `ENCRYPTION_KEY`        | Recommandé  | Clé AES-256 (64 hex chars) pour chiffrer les tokens API en base |
| `PLEX_TOKEN`            |      —      | Token Plex (alternative à le stocker en base)                   |
| `SONARR_API_KEY`        |      —      | Clé API Sonarr                                                  |
| `RADARR_API_KEY`        |      —      | Clé API Radarr                                                  |
| `TRUENAS_API_KEY`       |      —      | Clé API TrueNAS                                                 |
| `HOMEASSISTANT_API_KEY` |      —      | Token Long-Lived Home Assistant                                 |

Consultez `.env.example` pour la liste complète et la documentation de chaque variable.

---

## Image Docker

L'image est publiée automatiquement sur le GitHub Container Registry à chaque push sur `master` et à chaque tag `v*` :

```
ghcr.io/xhelliom/xhell-dash:latest       # dernière version stable
ghcr.io/xhelliom/xhell-dash:v1.2.3       # version spécifique
```

Architectures supportées : `linux/amd64`, `linux/arm64` (Raspberry Pi 4/5, Apple Silicon via Rosetta).

---

## Développement local

```bash
npm install
cp .env.example .env.local   # puis adapter les valeurs
npx prisma db push           # initialiser la base SQLite
npm run dev                  # http://localhost:3000
```

### Scripts disponibles

| Commande         | Description                              |
| ---------------- | ---------------------------------------- |
| `npm run dev`    | Serveur de développement avec hot-reload |
| `npm run build`  | Build de production                      |
| `npm run test`   | Tests unitaires (Vitest)                 |
| `npm run lint`   | ESLint                                   |
| `npm run format` | Prettier                                 |

---

## Fonctionnalités

- **Tableau de bord** : Vue centralisée de toutes vos applications
- **Glisser-déposer** : Réordonner les cartes
- **Logos flexibles** : Icônes Lucide React ou URL d'image
- **Statistiques** : Intégrations natives Plex, Sonarr, Radarr, TrueNAS, Home Assistant, Proxmox, Kubernetes, Lidarr, Overseerr, Uptime Kuma
- **Authentification** : Multi-utilisateurs avec rôles `admin` / `user`
- **Tokens chiffrés** : Les clés API sont chiffrées en AES-256-GCM en base
- **Docker ready** : Image multi-arch publiée sur GHCR

---

## Licence

MIT
