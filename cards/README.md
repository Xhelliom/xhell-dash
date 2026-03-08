# Système de cartes modulaires

Ce dossier contient toutes les cartes modulaires de l'application. Chaque carte est un module indépendant qui peut être ajouté sans modifier le code principal de l'application.

## Structure

```
cards/
├── index.ts              # Point d'entrée - importe toutes les cartes
├── plex/                 # Carte Plex (exemple de référence)
│   ├── index.ts          # Définition de la carte
│   ├── route.ts          # Handler API
│   ├── panel.tsx         # Composant du panneau de stats
│   ├── card-stat.tsx     # Composants custom pour la carte
│   └── types.ts          # Types TypeScript
├── sonarr/               # Exemple : carte Sonarr (à créer)
│   └── ...
├── TEMPLATE/             # Template pour créer une nouvelle carte
│   ├── index.ts
│   ├── route.ts
│   ├── panel.tsx
│   ├── card-stat.tsx
│   ├── types.ts
│   └── README.md
└── README.md             # Ce fichier
```

## Comment créer une nouvelle carte

> 📖 **Documentation complète** : Pour créer une nouvelle carte, consultez le guide détaillé dans [`cards/TEMPLATE/README.md`](./TEMPLATE/README.md). Ce guide contient toutes les instructions pas à pas, des exemples de code, et des explications détaillées pour chaque fichier.

### Méthode rapide (résumé)

1. **Copiez le template** :

   ```bash
   cp -r cards/TEMPLATE cards/votre-carte
   ```

2. **Renommez et adaptez** :
   - Remplacez `Template` par le nom de votre carte
   - Remplacez `template` par l'ID de votre carte
   - Adaptez le code selon votre API

3. **Enregistrez la carte** :
   - Ajoutez `import './votre-carte'` dans `cards/index.ts`

4. **Testez** :
   - Redémarrez le serveur
   - Créez une nouvelle application avec votre template

> ⚠️ **Important** : Cette méthode rapide est un résumé. Pour une implémentation complète et correcte, **consultez obligatoirement la [documentation complète dans `TEMPLATE/README.md`](./TEMPLATE/README.md)** qui contient tous les détails, exemples et bonnes pratiques.

## Exemple de référence

La carte **Plex** (`cards/plex/`) est un exemple complet et fonctionnel. Consultez-la pour comprendre comment implémenter :

- Une route API complète
- Un panneau de statistiques détaillé
- Des composants custom pour les stats de carte
- Des types TypeScript bien définis

## Architecture

### Registre de cartes

Toutes les cartes sont enregistrées dans un registre central (`lib/card-registry.ts`). Chaque carte doit :

1. Exporter une `CardDefinition` depuis son `index.ts`
2. S'enregistrer automatiquement avec `cardRegistry.register()`

### Chargement automatique

Les cartes sont chargées automatiquement lors de l'import de `cards/index.ts`. Il n'est pas nécessaire de modifier le code principal pour ajouter une nouvelle carte.

### Routes API dynamiques

Les routes API sont gérées dynamiquement par `/api/apps/[id]/stats/[templateId]/route.ts`, qui délègue au handler de la carte correspondante.

### Composants React

Les composants React (panneaux de stats, stats de carte) sont chargés dynamiquement depuis le registre de cartes.

## Interface CardDefinition

Chaque carte doit exporter une `CardDefinition` avec les champs suivants :

```typescript
{
  id: string                    // ID unique (doit correspondre au nom du dossier)
  name: string                  // Nom affiché
  description: string           // Description
  template: StatsTemplate       // Template de statistiques
  apiRouteHandler?: Function    // Handler pour la route API (optionnel)
  statsPanelComponent?: Component // Composant du panneau de stats (optionnel)
  cardStatComponents?: Record   // Composants custom pour les stats de carte (optionnel)
  cardStatTypes?: string[]     // Types de stats de carte disponibles
  types?: Record               // Types TypeScript exportés (optionnel)
}
```

## Types de statistiques de carte

### Types communs (toujours disponibles)

- `number` : Affiche simplement un nombre
- `chart` : Affiche un graphique (courbe)

### Types custom

Chaque carte peut définir ses propres types custom (ex: `plex-recent`, `sonarr-queue`). Ces types doivent être enregistrés dans `cardStatComponents`.

## Bonnes pratiques

1. **Isolation** : Chaque carte doit être indépendante et ne pas dépendre d'autres cartes
2. **Types** : Définissez des types TypeScript clairs dans `types.ts`
3. **Gestion d'erreurs** : Gérez les erreurs gracieusement dans les routes API
4. **Documentation** : Commentez votre code pour faciliter la maintenance
5. **Tests** : Testez votre carte avant de créer une PR

## Contribution

Pour contribuer une nouvelle carte :

1. Créez votre carte dans `cards/votre-carte/`
2. Suivez la structure du template
3. Testez votre carte
4. Créez une Pull Request avec :
   - Votre nouvelle carte
   - Une description de ce qu'elle fait
   - Des exemples de configuration

## Support

Si vous avez des questions ou besoin d'aide :

- 📖 Consultez [`cards/TEMPLATE/README.md`](./TEMPLATE/README.md) pour la documentation détaillée sur la création d'une nouvelle carte
- 🔍 Regardez `cards/plex/` comme exemple de référence complet
- 🐛 Créez une issue sur le repository si vous rencontrez un problème
