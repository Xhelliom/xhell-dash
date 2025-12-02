# Dockerfile pour l'application Dashboard Next.js
# 
# Ce Dockerfile crée une image optimisée pour la production
# en utilisant le mode standalone de Next.js

# Étape 1 : Build de l'application
# Utilise Node.js 20 Alpine (image légère)
FROM node:20-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm ci

# Copier le reste des fichiers de l'application
COPY . .

# Construire l'application Next.js en mode standalone
RUN npm run build

# Étape 2 : Image de production
# Utilise Node.js 20 Alpine pour l'exécution
FROM node:20-alpine AS runner

WORKDIR /app

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires depuis le builder
# Le mode standalone crée un dossier .next/standalone avec uniquement ce qui est nécessaire
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Créer le dossier data pour la persistance JSONDB
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Passer à l'utilisateur non-root
USER nextjs

# Exposer le port 3000
EXPOSE 3000

# Variable d'environnement pour le port
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Commande pour démarrer le serveur
CMD ["node", "server.js"]

