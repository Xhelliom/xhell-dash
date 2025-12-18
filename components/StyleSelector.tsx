/**
 * Composant StyleSelector
 * 
 * Permet de sélectionner les options de style (radius, shadows, fonts, spacing)
 * Affiche une interface simple avec des pictogrammes pour chaque option
 */

'use client'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
          <div className="grid grid-cols-3 gap-3">
            {radiusOptions.map((option) => {
              const Icon = option.icon
              return (
                <div key={option.value} className="relative">
                  <RadioGroupItem
                    value={option.value}
                    id={`radius-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`radius-${option.value}`}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer',
                      'hover:bg-accent hover:border-primary/50 transition-colors',
                      'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent',
                      'peer-focus-visible:ring-2 peer-focus-visible:ring-ring'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-8 w-8',
                        option.iconClass,
                        value.radius === option.value
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      )}
                    />
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground text-center">
                        {option.description}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'h-4 w-4 rounded-full border-2 flex items-center justify-center mt-1',
                        'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary',
                        value.radius === option.value
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      )}
                    >
                      {value.radius === option.value && (
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      )}
                    </div>
                  </Label>
                </div>
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
          <div className="grid grid-cols-2 gap-3">
            {shadowOptions.map((option) => (
              <div key={option.value} className="relative">
                <RadioGroupItem
                  value={option.value}
                  id={`shadow-${option.value}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`shadow-${option.value}`}
                  className={cn(
                    'flex flex-col items-center gap-3 rounded-lg border-2 p-4 cursor-pointer',
                    'hover:bg-accent hover:border-primary/50 transition-colors',
                    'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent',
                    'peer-focus-visible:ring-2 peer-focus-visible:ring-ring'
                  )}
                >
                  {/* Mini aperçu visuel de l'ombre */}
                  <div
                    className={cn(
                      'h-12 w-12 rounded-md bg-background border',
                      option.previewClass
                    )}
                  />
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground text-center">
                      {option.description}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'h-4 w-4 rounded-full border-2 flex items-center justify-center mt-1',
                      'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary',
                      value.shadow === option.value
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    )}
                  >
                    {value.shadow === option.value && (
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    )}
                  </div>
                </Label>
              </div>
            ))}
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
          <div className="grid grid-cols-3 gap-3">
            {fontOptions.map((option) => {
              const Icon = option.icon
              return (
                <div key={option.value} className="relative">
                  <RadioGroupItem
                    value={option.value}
                    id={`font-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`font-${option.value}`}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer',
                      'hover:bg-accent hover:border-primary/50 transition-colors',
                      'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent',
                      'peer-focus-visible:ring-2 peer-focus-visible:ring-ring'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-8 w-8',
                        value.font === option.value
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      )}
                    />
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground text-center">
                        {option.description}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'h-4 w-4 rounded-full border-2 flex items-center justify-center mt-1',
                        'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary',
                        value.font === option.value
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      )}
                    >
                      {value.font === option.value && (
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      )}
                    </div>
                  </Label>
                </div>
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
          <div className="grid grid-cols-3 gap-3">
            {densityOptions.map((option) => {
              const Icon = option.icon
              return (
                <div key={option.value} className="relative">
                  <RadioGroupItem
                    value={option.value}
                    id={`density-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`density-${option.value}`}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer',
                      'hover:bg-accent hover:border-primary/50 transition-colors',
                      'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent',
                      'peer-focus-visible:ring-2 peer-focus-visible:ring-ring'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-8 w-8',
                        value.density === option.value
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      )}
                    />
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground text-center">
                        {option.description}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'h-4 w-4 rounded-full border-2 flex items-center justify-center mt-1',
                        'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary',
                        value.density === option.value
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      )}
                    >
                      {value.density === option.value && (
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      )}
                    </div>
                  </Label>
                </div>
              )
            })}
          </div>
        </RadioGroup>
      </div>
    </div>
  )
}

