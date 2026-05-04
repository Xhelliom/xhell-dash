#!/bin/sh
set -e

echo "Running database migrations..."
node_modules/.bin/prisma db push --skip-generate

echo "Starting application..."
exec node server.js
