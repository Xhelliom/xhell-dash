# Effets de Background Disponibles

Ce document liste tous les effets de background disponibles pour rendre le dashboard moins uni.

## Classes CSS Disponibles

### 1. **bg-gradient-radial**
Gradient radial depuis le centre vers l'extérieur
```tsx
<div className="bg-gradient-radial">
```

### 2. **bg-gradient-linear**
Gradient linéaire diagonal (135deg)
```tsx
<div className="bg-gradient-linear">
```

### 3. **bg-gradient-mesh**
Effet mesh avec plusieurs gradients radiaux aux coins
```tsx
<div className="bg-gradient-mesh">
```

### 4. **bg-glow**
Effet de lueur (glow) autour du centre
```tsx
<div className="bg-glow">
```

### 5. **bg-gradient-animated**
Gradient animé qui se déplace lentement
```tsx
<div className="bg-gradient-animated">
```

### 6. **bg-grid-pattern**
Motif de grille subtil
```tsx
<div className="bg-grid-pattern">
```

### 7. **bg-dot-pattern**
Motif de points subtil
```tsx
<div className="bg-dot-pattern">
```

### 8. **bg-noise**
Texture de bruit subtile
```tsx
<div className="bg-noise">
```

### 9. **bg-mesh-animated** ⭐ (Actuellement utilisé)
Mesh gradient avec animation subtile de pulsation
```tsx
<div className="bg-mesh-animated">
```

### 10. **bg-shimmer**
Effet shimmer (brillance) qui traverse le background
```tsx
<div className="bg-shimmer">
```

## Combinaisons

Vous pouvez combiner plusieurs effets :
```tsx
<div className="bg-background bg-mesh-animated bg-grid-pattern">
```

## Personnalisation

Les effets utilisent les variables CSS du thème :
- `--primary` : Couleur primaire pour les effets
- `--background` : Couleur de fond de base
- `--border` : Couleur des bordures pour les patterns

Pour ajuster l'intensité, modifiez les valeurs d'opacité dans `app/globals.css` :
- `/ 0.15` = 15% d'opacité
- `/ 0.1` = 10% d'opacité
- `/ 0.05` = 5% d'opacité

## Exemples d'utilisation

### Dashboard avec effet mesh animé (actuel)
```tsx
<div className="min-h-screen bg-background bg-mesh-animated">
```

### Dashboard avec gradient animé
```tsx
<div className="min-h-screen bg-background bg-gradient-animated">
```

### Dashboard avec grille + glow
```tsx
<div className="min-h-screen bg-background bg-grid-pattern bg-glow">
```

### Dashboard avec dots + noise
```tsx
<div className="min-h-screen bg-background bg-dot-pattern bg-noise">
```

