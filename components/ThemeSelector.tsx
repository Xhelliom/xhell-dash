/**
 * Composant ThemeSelector
 * 
 * Permet de sélectionner un thème de couleur prédéfini à appliquer au dashboard
 * Affiche une liste d'options avec aperçu des couleurs
 */

'use client'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import type { ThemeId } from '@/lib/types'
import { Check } from 'lucide-react'
import { themes, getThemeById } from '@/lib/themes'

interface ThemeSelectorProps {
  /**
   * Valeur actuelle sélectionnée (ID du thème)
   */
  value: ThemeId
  /**
   * Callback appelé quand la valeur change
   */
  onValueChange: (value: ThemeId) => void
  /**
   * Classes CSS additionnelles
   */
  className?: string
}

/**
 * Liste des thèmes disponibles avec leurs descriptions
 */
const availableThemes: Array<{
  value: ThemeId
  label: string
  description: string
  previewColors?: string[] // Couleurs pour l'aperçu visuel
}> = [
  {
    value: 'default',
    label: 'Par défaut',
    description: 'Utilise le thème par défaut de l\'application',
    previewColors: ['#ffffff', '#0f172a'], // blanc / dark slate
  },
  ...themes.map((theme) => ({
    value: theme.id as ThemeId,
    label: theme.name,
    description: theme.description,
    previewColors: [
      theme.light['--primary'],
      theme.light['--background'],
      theme.light['--secondary'],
    ],
  })),
]

/**
 * Composant pour sélectionner le thème de couleur
 */
export function ThemeSelector({
  value,
  onValueChange,
  className,
}: ThemeSelectorProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <Label className="text-base font-semibold">Thème de Couleur</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Choisissez un thème de couleur prédéfini pour personnaliser l'apparence
        </p>
      </div>

      <RadioGroup value={value} onValueChange={onValueChange}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availableThemes.map((theme) => {
            const themeData = theme.value === 'default' ? null : getThemeById(theme.value)

            return (
              <div key={theme.value} className="relative">
                <RadioGroupItem
                  value={theme.value}
                  id={theme.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={theme.value}
                  className={cn(
                    'flex flex-col gap-3 rounded-lg border-2 p-4 cursor-pointer',
                    'hover:bg-accent hover:border-primary/50 transition-colors',
                    'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent',
                    'peer-focus-visible:ring-2 peer-focus-visible:ring-ring'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="font-medium">{theme.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {theme.description}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2',
                        'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary',
                        value === theme.value
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      )}
                    >
                      {value === theme.value && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Aperçu des couleurs du thème */}
                  {theme.previewColors && theme.previewColors.length > 0 && (
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-muted-foreground">Aperçu :</span>
                      <div className="flex gap-1.5">
                        {theme.previewColors.map((color, index) => (
                          <div
                            key={index}
                            className="h-6 w-6 rounded border border-border/50"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </Label>
              </div>
            )
          })}
        </div>
      </RadioGroup>
    </div>
  )
}

