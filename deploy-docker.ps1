Param(
    [string]$Tag = "latest",
    [string]$DockerUser = "",
    [string]$DockerRepo = "xhelliom/xhell-dash"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Déploiement Docker sur ${DockerRepo}:${Tag} ==="

if (-not $DockerUser) {
    $DockerUser = Read-Host "Docker Hub username"
}

# Mot de passe Docker Hub (saisi de façon masquée)
$securePassword = Read-Host "Docker Hub password" -AsSecureString
$plainPassword  = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
)

# Build de l'image locale
$imageFullName = "${DockerRepo}:${Tag}"
Write-Host "Construction de l'image: $imageFullName"
docker build -t $imageFullName .

if ($LASTEXITCODE -ne 0) {
    Write-Error "Échec du docker build"
    exit 1
}

# Login Docker Hub
Write-Host "Connexion à Docker Hub pour l'utilisateur $DockerUser..."
$loginResult = echo $plainPassword | docker login -u $DockerUser --password-stdin
if ($LASTEXITCODE -ne 0) {
    Write-Error "Échec du docker login"
    exit 1
}

# Push de l'image
Write-Host "Push de l'image: $imageFullName"
docker push $imageFullName

if ($LASTEXITCODE -ne 0) {
    Write-Error "Échec du docker push"
    exit 1
}

Write-Host "=== Déploiement terminé avec succès: $imageFullName ==="


