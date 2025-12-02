/**
 * Composant CardStatRenderer
 * 
 * Composant générique qui route vers le bon renderer selon le type de statistique
 */

'use client'

import { CardStatNumber } from './CardStatNumber'
import { CardStatChart } from './CardStatChart'
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
    case 'custom':
      return <CardStatCustom app={app} customType={config.customType} config={config} />
    default:
      return null
  }
}

