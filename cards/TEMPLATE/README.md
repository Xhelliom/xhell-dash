# Template pour créer une nouvelle carte

Ce dossier contient un template complet pour créer une nouvelle carte modulaire.

## Structure des fichiers

```
TEMPLATE/
├── index.ts          # Export principal - DÉFINIT LA CARTE
├── route.ts          # Handler API pour les statistiques
├── panel.tsx         # Composant du panneau de stats détaillées
├── card-stat.tsx     # Composants custom pour les stats de carte (optionnel)
├── types.ts          # Types TypeScript spécifiques à la carte
└── README.md         # Ce fichier
```

## Étapes pour créer une nouvelle carte

### 1. Créer le dossier

Créez un nouveau dossier dans `cards/` avec le nom de votre carte (ex: `sonarr`, `radarr`).

```bash
mkdir cards/sonarr
```

### 2. Copier les fichiers du template

Copiez tous les fichiers de `cards/TEMPLATE/` vers votre nouveau dossier.

```bash
cp -r cards/TEMPLATE/* cards/sonarr/
```

### 3. Renommer et adapter les fichiers

Dans chaque fichier, remplacez :
- `Template` → Nom de votre carte (ex: `Sonarr`)
- `template` → ID de votre carte (ex: `sonarr`)
- `TemplateStats` → Nom de votre interface de stats (ex: `SonarrStats`)

### 4. Adapter le code

#### `types.ts`
- Définissez les interfaces pour vos données
- Adaptez selon la structure de l'API que vous utilisez

#### `route.ts`
- Adaptez la fonction `fetchTemplateStats` pour appeler votre API
- Modifiez les headers d'authentification selon votre API
- Transformez les données de l'API au format attendu

#### `panel.tsx`
- Adaptez l'affichage selon vos statistiques
- Ajoutez/supprimez des sections selon vos besoins
- Personnalisez les KPI affichés

#### `card-stat.tsx` (optionnel)
- Créez ce fichier seulement si vous avez besoin d'un type custom
- Définissez votre composant personnalisé
- Enregistrez-le dans `index.ts` dans `cardStatComponents`

#### `index.ts`
- **IMPORTANT** : Changez l'ID de la carte pour correspondre au nom du dossier
- Adaptez le template selon vos besoins
- Enregistrez tous vos composants dans `cardStatComponents` si nécessaire

### 5. Enregistrer la carte

Ajoutez un import dans `cards/index.ts` :

```typescript
import './sonarr'
```

### 6. Tester

1. Redémarrez le serveur de développement
2. Créez une nouvelle application avec votre template
3. Vérifiez que les statistiques s'affichent correctement

## Exemple : Carte Sonarr

Voici un exemple rapide pour créer une carte Sonarr :

1. **Dossier** : `cards/sonarr/`
2. **ID** : `sonarr`
3. **API** : Sonarr API (http://sonarr:8989/api/v3)
4. **Authentification** : Header `X-Api-Key`
5. **Endpoints** :
   - `/api/v3/system/status` pour les stats générales
   - `/api/v3/queue` pour la queue
   - `/api/v3/calendar` pour le calendrier

## Notes importantes

- L'ID de la carte doit être unique et correspondre au nom du dossier
- Le template doit avoir le même ID que la carte
- Tous les fichiers sont optionnels sauf `index.ts` (mais recommandés)
- Les types `number` et `chart` sont toujours disponibles pour les stats de carte
- Les types custom doivent être enregistrés dans `cardStatComponents`

## Besoin d'aide ?

Consultez la carte Plex (`cards/plex/`) comme exemple de référence complète.

