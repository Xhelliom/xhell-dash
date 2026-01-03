/**
 * Composant CardStatRenderer
 * 
 * Composant générique qui route vers le bon renderer selon le type de statistique
 * 
 * Types supportés :
 * - 'number' : affiche un nombre simple
 * - 'chart' : affiche un graphique de type courbe
 * - 'info' : affiche une information textuelle (ex: prochain épisode)
 * - 'custom' : type personnalisé spécifique à un template
 */

'use client'

import { CardStatNumber } from './CardStatNumber'
import { CardStatChart } from './CardStatChart'
import { CardStatInfo } from './CardStatInfo'
import { CardStatCustom } from './CardStatCustom'
import type { App, CardStatConfig } from '@/lib/types'

interface CardStatRendererProps {
  app: App
  config: CardStatConfig
}

export function CardStatRenderer({ app, config }: CardStatRendererProps) {
  switch (config.type) {
    case 'number':
      return <CardStatNumber app={app} config={config} />
    case 'chart':
      return <CardStatChart app={app} config={config} />
    case 'info':
      return <CardStatInfo app={app} config={config} />
    case 'custom':
      return <CardStatCustom app={app} customType={config.customType} config={config} />
    default:
      return null
  }
}

