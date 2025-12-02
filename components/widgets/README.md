# Bibliothèque de Widgets pour le Dashboard

Cette bibliothèque de widgets permet d'ajouter des composants optionnels au-dessus des applications dans le dashboard.

## Widgets Disponibles

### 1. **ClockWidget** - Horloge numérique
Affiche l'heure actuelle avec possibilité d'afficher la date.

**Configuration :**
```typescript
{
  type: 'clock',
  config: {
    format: '24h' | '12h',      // Format d'affichage (défaut: '24h')
    showDate: boolean,           // Afficher la date (défaut: true)
    showSeconds: boolean,        // Afficher les secondes (défaut: true)
    timezone?: string           // Fuseau horaire (optionnel)
  }
}
```

### 2. **WeatherWidget** - Météo
Affiche les informations météorologiques pour une ville donnée.

**Configuration :**
```typescript
{
  type: 'weather',
  config: {
    city: string,               // Ville (défaut: 'Paris')
    countryCode?: string,       // Code pays (optionnel)
    apiKey?: string,            // Clé API OpenWeatherMap
    unit: 'celsius' | 'fahrenheit'  // Unité (défaut: 'celsius')
  }
}
```

**Note :** Pour utiliser le widget météo, vous devez :
1. Créer un compte sur [OpenWeatherMap](https://openweathermap.org/api)
2. Obtenir une clé API gratuite
3. Ajouter la clé dans `.env.local` : `NEXT_PUBLIC_WEATHER_API_KEY=votre_cle`
4. Ou la configurer directement dans le widget

### 3. **SystemInfoWidget** - Informations système
Affiche des informations système comme l'uptime, la date de dernière mise à jour, etc.

**Configuration :**
```typescript
{
  type: 'system-info',
  config: {
    showUptime: boolean,                    // Afficher l'uptime (défaut: true)
    showLastUpdate: boolean,                 // Afficher la dernière MAJ (défaut: true)
    customInfo?: Array<{                     // Informations personnalisées
      label: string,
      value: string
    }>
  }
}
```

## Utilisation

### Ajouter un widget dans le dashboard

Dans `app/page.tsx`, ajoutez un widget à l'état `widgets` :

```typescript
const [widgets, setWidgets] = useState<Widget[]>([
  {
    id: 'clock-1',
    type: 'clock',
    enabled: true,
    config: {
      format: '24h',
      showDate: true,
      showSeconds: true
    },
    order: 1
  },
  {
    id: 'weather-1',
    type: 'weather',
    enabled: true,
    config: {
      city: 'Paris',
      unit: 'celsius'
    },
    order: 2
  }
])
```

### Activer/Désactiver un widget

Pour désactiver un widget, modifiez simplement `enabled: false` :

```typescript
{
  id: 'weather-1',
  type: 'weather',
  enabled: false,  // Widget désactivé
  config: { ... }
}
```

## Créer un nouveau widget

Pour ajouter un nouveau widget :

1. **Créer le composant du widget** dans `components/widgets/` :
```typescript
// components/widgets/MyWidget.tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'

interface MyWidgetProps {
  config?: MyWidgetConfig
}

export function MyWidget({ config }: MyWidgetProps) {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        {/* Contenu du widget */}
      </CardContent>
    </Card>
  )
}
```

2. **Ajouter le type dans `lib/types.ts`** :
```typescript
export type WidgetType = 'clock' | 'weather' | 'system-info' | 'my-widget'

export interface MyWidgetConfig {
  // Configuration spécifique
}
```

3. **Enregistrer le widget dans `WidgetContainer.tsx`** :
```typescript
import { MyWidget } from './MyWidget'

// Dans WidgetRenderer :
case 'my-widget':
  return <MyWidget config={widget.config} />
```

## Widgets suggérés pour l'avenir

- **CalendarWidget** : Calendrier mensuel avec événements
- **NotesWidget** : Notes rapides
- **RSSWidget** : Flux RSS
- **StockWidget** : Cours boursier
- **CryptoWidget** : Prix des cryptomonnaies
- **TrafficWidget** : Informations trafic
- **NewsWidget** : Actualités
- **TodoWidget** : Liste de tâches
- **QuoteWidget** : Citations du jour
- **SystemStatsWidget** : Statistiques système (CPU, RAM, etc.)

## API Externes Recommandées

- **Météo** : [OpenWeatherMap](https://openweathermap.org/api) (gratuit jusqu'à 1000 appels/jour)
- **Actualités** : [NewsAPI](https://newsapi.org/) (gratuit jusqu'à 100 requêtes/jour)
- **Crypto** : [CoinGecko API](https://www.coingecko.com/en/api) (gratuit)
- **RSS** : Utiliser un parser RSS côté serveur

