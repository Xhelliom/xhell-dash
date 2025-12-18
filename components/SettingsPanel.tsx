/**
 * Composant SettingsPanel
 * 
 * Panneau de paramètres généraux du dashboard
 * Permet de configurer le background et d'autres paramètres globaux
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { BackgroundSelector } from '@/components/BackgroundSelector'
import { ThemeSelector } from '@/components/ThemeSelector'
import { StyleSelector } from '@/components/StyleSelector'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { BackgroundEffect, AppConfig, ThemeId, StylePreset } from '@/lib/types'
import { Loader2, Check } from 'lucide-react'
import { defaultStylePreset } from '@/lib/style-presets'
import { applyTheme, resetTheme } from '@/lib/theme-utils'
import { getThemeById } from '@/lib/themes'
import { applyStylePreset, resetStyle } from '@/lib/style-utils'

interface SettingsPanelProps {
  /**
   * Callback appelé quand la configuration change
   */
  onConfigChange?: () => void
  /**
   * Référence pour exposer la fonction de sauvegarde
   */
  onSaveRef?: (saveFn: () => Promise<void>) => void
}

/**
 * Panneau de paramètres généraux
 */
export function SettingsPanel({ onConfigChange, onSaveRef }: SettingsPanelProps) {
  const [backgroundEffect, setBackgroundEffect] =
    useState<BackgroundEffect>('mesh-animated')
  const [theme, setTheme] = useState<ThemeId>('default')
  const [stylePreset, setStylePreset] = useState<StylePreset>(defaultStylePreset)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const isInitialLoad = useRef(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Charge la configuration depuis l'API
   */
  const loadConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/config')
      if (response.ok) {
        const config: AppConfig = await response.json()
        setBackgroundEffect(config.backgroundEffect || 'mesh-animated')
        setTheme(config.theme || 'default')
        setStylePreset(config.stylePreset || defaultStylePreset)
        isInitialLoad.current = true // Marquer que c'est le chargement initial
      } else {
        console.error('Erreur lors du chargement de la configuration')
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration:', error)
    } finally {
      setIsLoading(false)
      // Réinitialiser le flag après le chargement initial
      setTimeout(() => {
        isInitialLoad.current = false
      }, 100)
    }
  }

  /**
   * Sauvegarde la configuration via l'API
   * @param silent - Si true, ne pas afficher d'erreur à l'utilisateur
   * @param skipNotify - Si true, ne pas appeler onConfigChange (pour éviter les doubles notifications)
   */
  const saveConfig = async (silent: boolean = false, skipNotify: boolean = false) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backgroundEffect,
          theme,
          stylePreset,
        }),
      })

      if (response.ok) {
        // Afficher l'indicateur de sauvegarde réussie
        setJustSaved(true)
        setTimeout(() => {
          setJustSaved(false)
        }, 2000)

        // Notifier le parent que la configuration a changé (pour appliquer les styles)
        // IMPORTANT:
        // On n'utilise PAS `window.location.reload()` ici car ça force un refresh complet,
        // ce qui donne l'impression que l'app "redémarre" après la fermeture du Sheet.
        // Le parent (`app/page.tsx`) sait déjà recharger/appliquer la config via `onConfigChange()`.
        if (!skipNotify && onConfigChange) {
          onConfigChange()
        }
      } else {
        console.error('Erreur lors de la sauvegarde de la configuration')
        if (!silent) {
          alert('Erreur lors de la sauvegarde de la configuration')
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error)
      if (!silent) {
        alert('Erreur lors de la sauvegarde de la configuration')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Charger la configuration au montage
  useEffect(() => {
    loadConfig()
  }, [])

  // Appliquer immédiatement les styles et thème pour aperçu en temps réel
  useEffect(() => {
    // Ne pas appliquer lors du chargement initial
    if (isInitialLoad.current) {
      return
    }

    // Appliquer le thème immédiatement
    if (theme === 'default') {
      resetTheme()
    } else {
      const themeToApply = getThemeById(theme)
      if (themeToApply) {
        applyTheme(themeToApply)
      }
    }

    // Appliquer le preset de style immédiatement
    applyStylePreset(stylePreset)
  }, [theme, stylePreset])

  // Sauvegarde automatique avec debounce (500ms)
  useEffect(() => {
    // Ne pas sauvegarder lors du chargement initial
    if (isInitialLoad.current) {
      return
    }

    // Annuler la sauvegarde précédente si elle existe
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Programmer la sauvegarde après 500ms d'inactivité
    saveTimeoutRef.current = setTimeout(() => {
      saveConfig(true, true) // Sauvegarder en mode silencieux, skip notify
    }, 500)

    // Nettoyage
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [backgroundEffect, theme, stylePreset])

  // Exposer la fonction de sauvegarde au parent (pour compatibilité avec le bouton)
  useEffect(() => {
    if (onSaveRef) {
      onSaveRef(() => saveConfig(false)) // Mode non-silencieux pour le bouton
    }
  }, [onSaveRef])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Paramètres Généraux</h3>
        <p className="text-sm text-muted-foreground">
          Configurez l'apparence et le comportement du dashboard
        </p>
      </div>

      <Separator />

      {/* Sélecteur de thème de couleur */}
      <div className="space-y-4">
        <ThemeSelector
          value={theme}
          onValueChange={setTheme}
        />
      </div>

      <Separator />

      {/* Sélecteur de style */}
      <div className="space-y-4">
        <StyleSelector
          value={stylePreset}
          onValueChange={setStylePreset}
        />
      </div>

      <Separator />

      {/* Sélecteur de background */}
      <div className="space-y-4">
        <BackgroundSelector
          value={backgroundEffect}
          onValueChange={setBackgroundEffect}
        />
      </div>

      <Separator />

      {/* Indicateur de sauvegarde */}
      <div className="flex items-center justify-center gap-2 py-2">
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sauvegarde en cours...</span>
          </>
        ) : justSaved ? (
          <>
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-600 dark:text-green-400">Sauvegardé</span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">
            Les modifications sont sauvegardées automatiquement
          </span>
        )}
      </div>
    </div>
  )
}


