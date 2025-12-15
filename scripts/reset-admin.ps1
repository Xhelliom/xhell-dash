# Script PowerShell pour régénérer l'admin par défaut
# Supprime la base SQLite et la recrée avec les migrations Prisma

Write-Host "🔄 Régénération de la base de données et de l'admin par défaut..." -ForegroundColor Cyan

# Supprimer le fichier de base SQLite s'il existe
$dbPath = "prisma/dev.db"
if (Test-Path $dbPath) {
    Write-Host "🗑️  Suppression de l'ancienne base de données..." -ForegroundColor Yellow
    Remove-Item $dbPath -Force
    Write-Host "✅ Base de données supprimée" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Aucune base de données existante trouvée" -ForegroundColor Gray
}

# Recréer la base avec les migrations
Write-Host "🔨 Recréation de la base de données..." -ForegroundColor Cyan
npx prisma migrate dev --name reset_admin

Write-Host ""
Write-Host "✅ Base de données régénérée !" -ForegroundColor Green
Write-Host ""
Write-Host "📧 L'admin par défaut sera créé automatiquement au prochain démarrage :" -ForegroundColor Cyan
Write-Host "   Email    : xhell-admin@example.com" -ForegroundColor White
Write-Host "   Password : Admin123!" -ForegroundColor White
Write-Host ""
Write-Host "💡 Redémarrez votre serveur (npm run dev) pour que l'admin soit créé." -ForegroundColor Yellow

