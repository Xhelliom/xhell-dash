#!/bin/sh
set -e

# Corriger les permissions du répertoire data (le volume peut être monté en root)
chown nextjs:nodejs /app/data

echo "Running database migrations..."
su-exec nextjs node_modules/.bin/prisma db push --skip-generate

echo "Starting application..."
exec su-exec nextjs node server.js
