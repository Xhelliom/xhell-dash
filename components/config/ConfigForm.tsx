/**
 * Composant ConfigForm
 * 
 * Composant principal qui orchestre les sous-formulaires de configuration
 * Gère l'état global et la navigation entre les sections
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BasicSettingsForm } from './BasicSettingsForm'
import { CardDisplayForm } from './CardDisplayForm'
import { StatsForm } from './StatsForm'
import { TemplateSpecificForm } from './TemplateSpecificForm'
import type { App, CreateAppInput } from '@/lib/types'

interface ConfigFormProps {
  app?: App | null
  onSubmit: (data: CreateAppInput) => Promise<void>
}

function ConfigFormContent({ app, onSubmit }: ConfigFormProps) {
  const searchParams = useSearchParams()
  const section = searchParams.get('section') || 'basic'
  
  // État local du formulaire
  const [formData, setFormData] = useState<Partial<CreateAppInput>>({
    name: app?.name || '',
    url: app?.url || '',
    logoType: app?.logoType || 'icon',
    logo: app?.logo || '',
    statApiUrl: app?.statApiUrl || '',
    statLabel: app?.statLabel || '',
    plexToken: (app as any)?.plexToken || '',
    plexServerUrl: (app as any)?.plexServerUrl || app?.url || '',
    statsConfig: app?.statsConfig || undefined,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Met à jour les données du formulaire
   */
  const handleChange = (updates: Partial<CreateAppInput>) => {
    setFormData((prev) => ({
      ...prev,
      ...updates,
    }))
  }

  /**
   * Valide les données du formulaire
   */
  const validate = (): boolean => {
    if (!formData.name?.trim()) {
      alert('Le nom est obligatoire')
      return false
    }
    if (!formData.url?.trim()) {
      alert('L\'URL est obligatoire')
      return false
    }
    try {
      new URL(formData.url)
    } catch {
      alert('L\'URL n\'est pas valide')
      return false
    }
    if (!formData.logo?.trim()) {
      alert('Le logo est obligatoire')
      return false
    }
    if (formData.logoType === 'url') {
      try {
        new URL(formData.logo)
      } catch {
        alert('L\'URL du logo n\'est pas valide')
        return false
      }
    }
    if (formData.statApiUrl && formData.statApiUrl.trim()) {
      try {
        new URL(formData.statApiUrl)
      } catch {
        alert('L\'URL de l\'API de statistiques n\'est pas valide')
        return false
      }
    }
    
    // Validation spécifique pour Plex
    const isPlex = formData.name?.toLowerCase() === 'plex' || formData.statsConfig?.templateId === 'plex'
    if (isPlex && !formData.plexToken?.trim()) {
      alert('Le token Plex est obligatoire pour les applications Plex')
      return false
    }
    if (formData.plexServerUrl && formData.plexServerUrl.trim()) {
      try {
        new URL(formData.plexServerUrl)
      } catch {
        alert('L\'URL du serveur Plex n\'est pas valide')
        return false
      }
    }
    
    return true
  }

  /**
   * Gère la soumission du formulaire
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      const submitData: CreateAppInput = {
        name: formData.name!.trim(),
        url: formData.url!.trim(),
        logoType: formData.logoType!,
        logo: formData.logo!.trim(),
        statApiUrl: formData.statApiUrl?.trim() || undefined,
        statLabel: formData.statLabel?.trim() || undefined,
        plexToken: formData.plexToken?.trim() || undefined,
        plexServerUrl: formData.plexServerUrl?.trim() || undefined,
        statsConfig: formData.statsConfig,
      }

      await onSubmit(submitData)
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error)
      alert(error.message || 'Une erreur est survenue lors de la sauvegarde')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Rendu de la section active
   */
  const renderSection = () => {
    const currentApp = app ? { ...app, ...formData } : (formData as App | null)

    switch (section) {
      case 'basic':
        return <BasicSettingsForm app={currentApp} onChange={handleChange} />
      case 'display':
        return <CardDisplayForm app={currentApp} onChange={handleChange} />
      case 'stats':
        return (
          <>
            <StatsForm app={currentApp} onChange={handleChange} />
            <TemplateSpecificForm
              app={currentApp}
              templateId={formData.statsConfig?.templateId}
              onChange={handleChange}
            />
          </>
        )
      default:
        return <BasicSettingsForm app={currentApp} onChange={handleChange} />
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <div className="space-y-6">
        {renderSection()}
      </div>

      {/* Footer avec boutons */}
      <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.href = '/'}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : app ? 'Modifier' : 'Ajouter'}
        </Button>
      </div>
    </form>
  )
}

export function ConfigForm(props: ConfigFormProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    }>
      <ConfigFormContent {...props} />
    </Suspense>
  )
}

