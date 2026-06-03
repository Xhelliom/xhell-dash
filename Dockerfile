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

# Générer le client Prisma (nécessaire pour les types TypeScript)
RUN npx prisma generate

# Construire l'application Next.js en mode standalone
RUN npm run build

# Installation isolée de la CLI Prisma avec toutes ses dépendances transitives.
# On évite de copier des packages à la main depuis node_modules principal car
# @prisma/config dépend de packages lourds (effect, c12…) difficiles à énumérer.
RUN PRISMA_VERSION=$(node -e "console.log(require('/app/node_modules/prisma/package.json').version)") && \
    mkdir -p /prisma-cli && cd /prisma-cli && \
    echo '{"name":"p","version":"1.0.0"}' > package.json && \
    npm install "prisma@${PRISMA_VERSION}" --no-save --omit=dev --ignore-scripts

# Étape 2 : Image de production
# Utilise Node.js 20 Alpine pour l'exécution
FROM node:20-alpine AS runner

WORKDIR /app

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    apk add --no-cache su-exec

# Copier les fichiers nécessaires depuis le builder
# Le mode standalone crée un dossier .next/standalone avec uniquement ce qui est nécessaire
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copier la CLI Prisma avec toutes ses dépendances (installation isolée dans /prisma-cli)
# + le client généré (.prisma) et le schema
COPY --from=builder --chown=nextjs:nodejs /prisma-cli/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Scripts d'administration exécutables dans le conteneur (ex. reset de mot de passe).
# bcryptjs (sans dépendance) est copié explicitement car il n'est pas garanti
# d'être présent dans le bundle standalone.
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Recréer le symlink prisma CLI — Docker COPY déréférence les symlinks, cassant __dirname
RUN mkdir -p /app/node_modules/.bin && \
    ln -sf /app/node_modules/prisma/build/index.js /app/node_modules/.bin/prisma && \
    chown -h nextjs:nodejs /app/node_modules/.bin/prisma

# Script d'entrée qui exécute les migrations avant de démarrer
# L'entrypoint tourne en root, corrige les permissions du volume, puis su-exec → nextjs
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Créer le dossier data (l'entrypoint en fixe les permissions au démarrage)
RUN mkdir -p /app/data

# Exposer le port 3000
EXPOSE 3000

# Variable d'environnement pour le port
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]

