/**
 * Composant StyleSelector
 * 
 * Permet de sélectionner les options de style (radius, shadows, fonts, spacing)
 * Affiche une interface simple avec des pictogrammes pour chaque option
 */

'use client'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'
import type { RadiusPreset, ShadowPreset, FontPreset, DensityPreset, StylePreset } from '@/lib/types'
import { Check, Square, Circle, Type, FileText, Code, Minus, Layout, Plus } from 'lucide-react'

interface StyleSelectorProps {
  /**
   * Valeur actuelle du preset de style
   */
  value: StylePreset
  /**
   * Callback appelé quand la valeur change
   */
  onValueChange: (value: StylePreset) => void
  /**
   * Classes CSS additionnelles
   */
  className?: string
}

/**
 * Options pour les coins arrondis (radius)
 */
const radiusOptions: Array<{
  value: RadiusPreset
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  iconClass?: string
}> = [
  {
    value: 'small',
    label: 'Petit',
    description: 'Coins légèrement arrondis',
    icon: Square,
    iconClass: 'rounded-sm',
  },
  {
    value: 'medium',
    label: 'Moyen',
    description: 'Coins modérément arrondis',
    icon: Square,
    iconClass: 'rounded-md',
  },
  {
    value: 'large',
    label: 'Grand',
    description: 'Coins très arrondis',
    icon: Circle,
  },
]

/**
 * Options pour les ombres (shadows)
 */
const shadowOptions: Array<{
  value: ShadowPreset
  label: string
  description: string
  previewClass: string
}> = [
  {
    value: 'subtle',
    label: 'Légère',
    description: 'Ombres discrètes',
    previewClass: 'shadow-sm',
  },
  {
    value: 'pronounced',
    label: 'Prononcée',
    description: 'Ombres marquées',
    previewClass: 'shadow-lg',
  },
]

/**
 * Options pour les polices (fonts)
 */
const fontOptions: Array<{
  value: FontPreset
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    value: 'sans',
    label: 'Sans-serif',
    description: 'Police moderne sans empattements',
    icon: Type,
  },
  {
    value: 'serif',
    label: 'Serif',
    description: 'Police classique avec empattements',
    icon: FileText,
  },
  {
    value: 'mono',
    label: 'Mono',
    description: 'Police à chasse fixe',
    icon: Code,
  },
]

/**
 * Options pour la densité d'affichage
 */
const densityOptions: Array<{
  value: DensityPreset
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    value: 'compact',
    label: 'Compact',
    description: 'Affichage plus serré',
    icon: Minus,
  },
  {
    value: 'normal',
    label: 'Normal',
    description: 'Densité standard',
    icon: Layout,
  },
  {
    value: 'comfortable',
    label: 'Confortable',
    description: 'Affichage plus aéré',
    icon: Plus,
  },
]

/**
 * Composant pour sélectionner les options de style
 */
export function StyleSelector({
  value,
  onValueChange,
  className,
}: StyleSelectorProps) {
  /**
   * Met à jour une propriété du preset de style
   */
  const updatePreset = <K extends keyof StylePreset>(
    key: K,
    newValue: StylePreset[K]
  ) => {
    onValueChange({
      ...value,
      [key]: newValue,
    })
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn('space-y-6', className)}>
        <div>
          <Label className="text-base font-semibold">Style</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Personnalisez l'apparence avec les coins arrondis, ombres, polices et espacements
          </p>
        </div>

      {/* Section Radius (Coins Arrondis) */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Coins Arrondis</Label>
        <RadioGroup
          value={value.radius}
          onValueChange={(newValue) => updatePreset('radius', newValue as RadiusPreset)}
        >
          <div className="flex gap-3">
            {radiusOptions.map((option) => {
              const Icon = option.icon
              const isSelected = value.radius === option.value
              return (
                <TooltipPrimitive.Root key={option.value} delayDuration={200}>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <RadioGroupItem
                        value={option.value}
                        id={`radius-${option.value}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`radius-${option.value}`}
                        className={cn(
                          'flex items-center justify-center w-[60px] h-[60px] rounded-md border-2 cursor-pointer transition-colors',
                          'hover:bg-accent hover:border-primary/50',
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-muted-foreground/30 bg-background',
                          'peer-focus-visible:ring-2 peer-focus-visible:ring-ring'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-6 w-6',
                            option.iconClass,
                            isSelected ? 'text-primary' : 'text-muted-foreground'
                          )}
                        />
                        {isSelected && (
                          <Check className="absolute top-1 right-1 h-4 w-4 text-primary" />
                        )}
                      </Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="!z-[120]" sideOffset={5}>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs opacity-90">{option.description}</span>
                    </div>
                  </TooltipContent>
                </TooltipPrimitive.Root>
              )
            })}
          </div>
        </RadioGroup>
      </div>

      {/* Section Shadows (Ombres) */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Ombres</Label>
        <RadioGroup
          value={value.shadow}
          onValueChange={(newValue) => updatePreset('shadow', newValue as ShadowPreset)}
        >
          <div className="flex gap-3">
            {shadowOptions.map((option) => {
              const isSelected = value.shadow === option.value
              return (
                <TooltipPrimitive.Root key={option.value} delayDuration={200}>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <RadioGroupItem
                        value={option.value}
                        id={`shadow-${option.value}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`shadow-${option.value}`}
                        className={cn(
                          'flex items-center justify-center w-[60px] h-[60px] rounded-md border-2 cursor-pointer transition-colors',
                          'hover:bg-accent hover:border-primary/50',
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-muted-foreground/30 bg-background',
                          'peer-focus-visible:ring-2 peer-focus-visible:ring-ring'
                        )}
                      >
                        {/* Mini aperçu visuel de l'ombre */}
                        <div
                          className={cn(
                            'h-6 w-6 rounded-sm bg-foreground/10 border',
                            option.previewClass
                          )}
                        />
                        {isSelected && (
                          <Check className="absolute top-1 right-1 h-4 w-4 text-primary" />
                        )}
                      </Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="!z-[120]" sideOffset={5}>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs opacity-90">{option.description}</span>
                    </div>
                  </TooltipContent>
                </TooltipPrimitive.Root>
              )
            })}
          </div>
        </RadioGroup>
      </div>

      {/* Section Fonts (Polices) */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Polices</Label>
        <RadioGroup
          value={value.font}
          onValueChange={(newValue) => updatePreset('font', newValue as FontPreset)}
        >
          <div className="flex gap-3">
            {fontOptions.map((option) => {
              const Icon = option.icon
              const isSelected = value.font === option.value
              return (
                <TooltipPrimitive.Root key={option.value} delayDuration={200}>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <RadioGroupItem
                        value={option.value}
                        id={`font-${option.value}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`font-${option.value}`}
                        className={cn(
                          'flex items-center justify-center w-[60px] h-[60px] rounded-md border-2 cursor-pointer transition-colors',
                          'hover:bg-accent hover:border-primary/50',
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-muted-foreground/30 bg-background',
                          'peer-focus-visible:ring-2 peer-focus-visible:ring-ring'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-6 w-6',
                            isSelected ? 'text-primary' : 'text-muted-foreground'
                          )}
                        />
                        {isSelected && (
                          <Check className="absolute top-1 right-1 h-4 w-4 text-primary" />
                        )}
                      </Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="!z-[120]" sideOffset={5}>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs opacity-90">{option.description}</span>
                    </div>
                  </TooltipContent>
                </TooltipPrimitive.Root>
              )
            })}
          </div>
        </RadioGroup>
      </div>

      {/* Section Density (Densité) */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Densité</Label>
        <RadioGroup
          value={value.density}
          onValueChange={(newValue) => updatePreset('density', newValue as DensityPreset)}
        >
          <div className="flex gap-3">
            {densityOptions.map((option) => {
              const Icon = option.icon
              const isSelected = value.density === option.value
              return (
                <TooltipPrimitive.Root key={option.value} delayDuration={200}>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <RadioGroupItem
                        value={option.value}
                        id={`density-${option.value}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`density-${option.value}`}
                        className={cn(
                          'flex items-center justify-center w-[60px] h-[60px] rounded-md border-2 cursor-pointer transition-colors',
                          'hover:bg-accent hover:border-primary/50',
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-muted-foreground/30 bg-background',
                          'peer-focus-visible:ring-2 peer-focus-visible:ring-ring'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-6 w-6',
                            isSelected ? 'text-primary' : 'text-muted-foreground'
                          )}
                        />
                        {isSelected && (
                          <Check className="absolute top-1 right-1 h-4 w-4 text-primary" />
                        )}
                      </Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="!z-[120]" sideOffset={5}>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs opacity-90">{option.description}</span>
                    </div>
                  </TooltipContent>
                </TooltipPrimitive.Root>
              )
            })}
          </div>
        </RadioGroup>
      </div>
      </div>
    </TooltipProvider>
  )
}

