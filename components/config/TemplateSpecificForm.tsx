/**
 * Composant TemplateSpecificForm
 * 
 * Formulaire pour la configuration spécifique au template sélectionné
 * (ex: Token Plex, URL serveur Plex)
 */

'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { App, CreateAppInput } from '@/lib/types'

interface TemplateSpecificFormProps {
  app?: App | null
  templateId?: string
  onChange: (data: Partial<CreateAppInput>) => void
}

export function TemplateSpecificForm({ app, templateId, onChange }: TemplateSpecificFormProps) {
  // Configuration spécifique Plex
  const plexToken = (app as any)?.plexToken || ''
  const plexServerUrl = (app as any)?.plexServerUrl || app?.url || ''

  /**
   * Met à jour les valeurs et notifie le parent
   */
  const handleChange = (field: keyof CreateAppInput, value: any) => {
    onChange({ [field]: value })
  }

  // Afficher uniquement si un template est sélectionné
  if (!templateId) {
    return null
  }

  // Configuration spécifique pour Plex
  if (templateId === 'plex') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Configuration Plex</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Configurez les paramètres spécifiques à Plex Media Server
          </p>
        </div>

        <div className="space-y-4">
          {/* URL du serveur Plex */}
          <div className="space-y-2">
            <Label htmlFor="plexServerUrl">URL du serveur Plex (optionnel)</Label>
            <Input
              id="plexServerUrl"
              type="url"
              value={plexServerUrl}
              onChange={(e) => handleChange('plexServerUrl' as keyof CreateAppInput, e.target.value)}
              placeholder={app?.url || "http://localhost:32400"}
            />
            <p className="text-xs text-muted-foreground">
              Par défaut, l'URL de l'application sera utilisée. Spécifiez une URL différente si nécessaire.
            </p>
          </div>

          {/* Token Plex */}
          <div className="space-y-2">
            <Label htmlFor="plexToken">Token Plex *</Label>
            <Input
              id="plexToken"
              type="password"
              value={plexToken}
              onChange={(e) => handleChange('plexToken' as keyof CreateAppInput, e.target.value)}
              placeholder="Votre token d'authentification Plex"
              required
            />
            <p className="text-xs text-muted-foreground">
              Le token Plex est nécessaire pour récupérer les statistiques détaillées.
              Vous pouvez le trouver dans les paramètres de votre serveur Plex.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Pour d'autres templates, retourner null pour l'instant
  // On pourra ajouter d'autres configurations spécifiques ici plus tard
  return null
}

