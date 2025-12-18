/**
 * Composant SettingsPanel
 * 
 * Panneau de paramètres généraux du dashboard
 * Permet de configurer le background et d'autres paramètres globaux
 */

'use client'

import { useState, useEffect } from 'react'
import { BackgroundSelector } from '@/components/BackgroundSelector'
import { ThemeSelector } from '@/components/ThemeSelector'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { BackgroundEffect, AppConfig, ThemeId } from '@/lib/types'
import { Loader2 } from 'lucide-react'

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
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

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
      } else {
        console.error('Erreur lors du chargement de la configuration')
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Sauvegarde la configuration via l'API
   */
  const saveConfig = async () => {
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
        }),
      })

      if (response.ok) {
        // Notifier le parent que la configuration a changé.
        // IMPORTANT:
        // On n'utilise PAS `window.location.reload()` ici car ça force un refresh complet,
        // ce qui donne l'impression que l'app "redémarre" après la fermeture du Sheet.
        // Le parent (`app/page.tsx`) sait déjà recharger/appliquer la config via `onConfigChange()`.
        if (onConfigChange) onConfigChange()
      } else {
        console.error('Erreur lors de la sauvegarde de la configuration')
        alert('Erreur lors de la sauvegarde de la configuration')
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error)
      alert('Erreur lors de la sauvegarde de la configuration')
    } finally {
      setIsSaving(false)
    }
  }

  // Charger la configuration au montage
  useEffect(() => {
    loadConfig()
  }, [])

  // Exposer la fonction de sauvegarde au parent
  useEffect(() => {
    if (onSaveRef) {
      onSaveRef(saveConfig)
    }
  }, [onSaveRef, backgroundEffect, theme])

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

      {/* Sélecteur de background */}
      <div className="space-y-4">
        <BackgroundSelector
          value={backgroundEffect}
          onValueChange={setBackgroundEffect}
        />
      </div>

      <Separator />

      {/* Note : Le bouton de sauvegarde est maintenant disponible via le bouton flottant */}
      <div className="text-sm text-muted-foreground text-center py-2">
        Utilisez le bouton "Sauvegarder" en bas à gauche pour enregistrer vos modifications
      </div>
    </div>
  )
}


