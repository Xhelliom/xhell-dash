#!/bin/bash
# Script bash pour régénérer l'admin par défaut
# Supprime la base SQLite et la recrée avec les migrations Prisma

echo "🔄 Régénération de la base de données et de l'admin par défaut..."

# Supprimer le fichier de base SQLite s'il existe
DB_PATH="prisma/dev.db"
if [ -f "$DB_PATH" ]; then
    echo "🗑️  Suppression de l'ancienne base de données..."
    rm -f "$DB_PATH"
    echo "✅ Base de données supprimée"
else
    echo "ℹ️  Aucune base de données existante trouvée"
fi

# Recréer la base avec les migrations
echo "🔨 Recréation de la base de données..."
npx prisma migrate dev --name reset_admin

echo ""
echo "✅ Base de données régénérée !"
echo ""
echo "📧 L'admin par défaut sera créé automatiquement au prochain démarrage :"
echo "   Email    : xhell-admin@example.com"
echo "   Password : Admin123!"
echo ""
echo "💡 Redémarrez votre serveur (npm run dev) pour que l'admin soit créé."

