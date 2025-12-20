/**
 * Composant BackgroundSelector
 * 
 * Permet de sélectionner l'effet de background à appliquer au dashboard
 * Affiche une liste déroulante avec toutes les options disponibles
 */

'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { BackgroundEffect } from '@/lib/types'

interface BackgroundSelectorProps {
  /**
   * Valeur actuelle sélectionnée
   */
  value: BackgroundEffect
  /**
   * Callback appelé quand la valeur change
   */
  onValueChange: (value: BackgroundEffect) => void
  /**
   * Classes CSS additionnelles
   */
  className?: string
}

/**
 * Liste des effets disponibles avec leurs descriptions
 */
const backgroundEffects: Array<{
  value: BackgroundEffect
  label: string
  description: string
}> = [
  {
    value: 'none',
    label: 'Aucun',
    description: 'Fond uni sans effet',
  },
  {
    value: 'gradient-radial',
    label: 'Gradient Radial',
    description: 'Gradient circulaire depuis le centre',
  },
  {
    value: 'gradient-linear',
    label: 'Gradient Linéaire',
    description: 'Gradient diagonal animé',
  },
  {
    value: 'gradient-mesh',
    label: 'Gradient Mesh',
    description: 'Mesh avec gradients aux coins',
  },
  {
    value: 'gradient-animated',
    label: 'Gradient Animé',
    description: 'Gradient qui se déplace lentement',
  },
  {
    value: 'glow',
    label: 'Glow',
    description: 'Effet de lueur au centre',
  },
  {
    value: 'grid-pattern',
    label: 'Grille',
    description: 'Motif de grille subtil',
  },
  {
    value: 'dot-pattern',
    label: 'Points',
    description: 'Motif de points subtil',
  },
  {
    value: 'noise',
    label: 'Bruit',
    description: 'Texture de bruit subtile',
  },
  {
    value: 'mesh-animated',
    label: 'Mesh Animé',
    description: 'Mesh avec animation de pulsation',
  },
  {
    value: 'shimmer',
    label: 'Shimmer',
    description: 'Effet de brillance traversant',
  },
  {
    value: 'diamond-pattern',
    label: 'Losanges',
    description: 'Motif de losanges répétitif',
  },
  {
    value: 'grid-svg',
    label: 'Grille SVG',
    description: 'Grille précise avec motifs SVG',
  },
  {
    value: 'dots-svg',
    label: 'Points SVG',
    description: 'Points nets et réguliers',
  },
  {
    value: 'waves-pattern',
    label: 'Vagues',
    description: 'Motif de vagues répétitif',
  },
  {
    value: 'hexagon-pattern',
    label: 'Hexagones',
    description: 'Motif hexagonal répétitif',
  },
  {
    value: 'crosshatch-pattern',
    label: 'Hachures',
    description: 'Motif de hachures croisées',
  },
]

/**
 * Composant pour sélectionner l'effet de background
 * Utilise une liste déroulante pour économiser l'espace
 */
export function BackgroundSelector({
  value,
  onValueChange,
  className,
}: BackgroundSelectorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div>
        <Label className="text-base font-semibold">Effet de Background</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Choisissez l'effet visuel à appliquer au fond du dashboard
        </p>
      </div>

      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sélectionner un effet" />
        </SelectTrigger>
        <SelectContent>
          {backgroundEffects.map((effect) => (
            <SelectItem 
              key={effect.value} 
              value={effect.value}
              title={effect.description}
            >
              <div className="flex flex-col gap-0.5 py-0.5">
                <span className="font-medium leading-tight">{effect.label}</span>
                <span className="text-xs text-muted-foreground leading-tight">
                  {effect.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}


