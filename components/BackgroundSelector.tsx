/**
 * Composant BackgroundSelector
 * 
 * Permet de sélectionner l'effet de background à appliquer au dashboard
 * Affiche une liste d'options avec aperçu visuel
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import type { BackgroundEffect } from '@/lib/types'
import { Check } from 'lucide-react'

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
]

/**
 * Composant pour sélectionner l'effet de background
 */
export function BackgroundSelector({
  value,
  onValueChange,
  className,
}: BackgroundSelectorProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <Label className="text-base font-semibold">Effet de Background</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Choisissez l'effet visuel à appliquer au fond du dashboard
        </p>
      </div>

      <RadioGroup value={value} onValueChange={onValueChange}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {backgroundEffects.map((effect) => (
            <div key={effect.value} className="relative">
              <RadioGroupItem
                value={effect.value}
                id={effect.value}
                className="peer sr-only"
              />
              <Label
                htmlFor={effect.value}
                className={cn(
                  'flex flex-col gap-2 rounded-lg border-2 p-4 cursor-pointer',
                  'hover:bg-accent hover:border-primary/50 transition-colors',
                  'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent',
                  'peer-focus-visible:ring-2 peer-focus-visible:ring-ring'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{effect.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {effect.description}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center',
                      'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary',
                      value === effect.value
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    )}
                  >
                    {value === effect.value && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  )
}


