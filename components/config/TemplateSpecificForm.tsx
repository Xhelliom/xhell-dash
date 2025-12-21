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
    const plexToken = (app as any)?.plexToken || ''
    const plexServerUrl = (app as any)?.plexServerUrl || app?.url || ''

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

  // Configuration pour Sonarr, Radarr, Lidarr (utilisent X-Api-Key)
  if (templateId === 'sonarr' || templateId === 'radarr' || templateId === 'lidarr') {
    const apiKey = (app as any)?.apiKey || (app as any)?.[`${templateId}ApiKey`] || ''

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Configuration {templateId.charAt(0).toUpperCase() + templateId.slice(1)}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Configurez les paramètres spécifiques à {templateId.charAt(0).toUpperCase() + templateId.slice(1)}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Clé API *</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => handleChange('apiKey' as keyof CreateAppInput, e.target.value)}
              placeholder={`Votre clé API ${templateId.charAt(0).toUpperCase() + templateId.slice(1)}`}
              required
            />
            <p className="text-xs text-muted-foreground">
              La clé API est nécessaire pour récupérer les statistiques.
              Vous pouvez la trouver dans les paramètres de votre instance {templateId.charAt(0).toUpperCase() + templateId.slice(1)} (Settings → General → Security).
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Configuration pour TrueNAS (API key ou username/password)
  if (templateId === 'truenas') {
    const apiKey = (app as any)?.apiKey || (app as any)?.truenasApiKey || ''
    const username = (app as any)?.username || ''
    const password = (app as any)?.password || ''

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Configuration TrueNAS</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Configurez les paramètres d'authentification TrueNAS
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="truenasApiKey">Clé API (optionnel)</Label>
            <Input
              id="truenasApiKey"
              type="password"
              value={apiKey}
              onChange={(e) => handleChange('apiKey' as keyof CreateAppInput, e.target.value)}
              placeholder="Votre clé API TrueNAS"
            />
            <p className="text-xs text-muted-foreground">
              Vous pouvez utiliser une clé API ou un nom d'utilisateur/mot de passe.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="truenasUsername">Nom d'utilisateur (si pas de clé API)</Label>
            <Input
              id="truenasUsername"
              type="text"
              value={username}
              onChange={(e) => handleChange('username' as keyof CreateAppInput, e.target.value)}
              placeholder="admin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="truenasPassword">Mot de passe (si pas de clé API)</Label>
            <Input
              id="truenasPassword"
              type="password"
              value={password}
              onChange={(e) => handleChange('password' as keyof CreateAppInput, e.target.value)}
              placeholder="Votre mot de passe"
            />
          </div>
        </div>
      </div>
    )
  }

  // Configuration pour Home Assistant (token Bearer)
  if (templateId === 'home-assistant') {
    const apiKey = (app as any)?.apiKey || (app as any)?.homeAssistantApiKey || ''

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Configuration Home Assistant</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Configurez les paramètres d'authentification Home Assistant
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="homeAssistantApiKey">Token API (Long-Lived Access Token) *</Label>
            <Input
              id="homeAssistantApiKey"
              type="password"
              value={apiKey}
              onChange={(e) => handleChange('apiKey' as keyof CreateAppInput, e.target.value)}
              placeholder="Votre token d'accès Home Assistant"
              required
            />
            <p className="text-xs text-muted-foreground">
              Créez un Long-Lived Access Token dans votre profil Home Assistant (Settings → People → [Votre utilisateur] → Long-Lived Access Tokens).
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Configuration pour Proxmox (token ou username/password)
  if (templateId === 'proxmox') {
    const token = (app as any)?.token || (app as any)?.proxmoxToken || ''
    const username = (app as any)?.username || (app as any)?.proxmoxUsername || ''
    const password = (app as any)?.password || (app as any)?.proxmoxPassword || ''

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Configuration Proxmox</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Configurez les paramètres d'authentification Proxmox
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proxmoxToken">Token API (optionnel)</Label>
            <Input
              id="proxmoxToken"
              type="password"
              value={token}
              onChange={(e) => handleChange('token' as keyof CreateAppInput, e.target.value)}
              placeholder="PVEAPIToken=user@realm!tokenid=secret"
            />
            <p className="text-xs text-muted-foreground">
              Format: PVEAPIToken=user@realm!tokenid=secret. Vous pouvez utiliser un token ou un nom d'utilisateur/mot de passe.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proxmoxUsername">Nom d'utilisateur (si pas de token)</Label>
            <Input
              id="proxmoxUsername"
              type="text"
              value={username}
              onChange={(e) => handleChange('username' as keyof CreateAppInput, e.target.value)}
              placeholder="root@pam"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proxmoxPassword">Mot de passe (si pas de token)</Label>
            <Input
              id="proxmoxPassword"
              type="password"
              value={password}
              onChange={(e) => handleChange('password' as keyof CreateAppInput, e.target.value)}
              placeholder="Votre mot de passe Proxmox"
            />
          </div>
        </div>
      </div>
    )
  }

  // Configuration pour Kubernetes (token ou kubeconfig)
  if (templateId === 'kubernetes') {
    const token = (app as any)?.token || (app as any)?.kubernetesToken || ''
    const kubeconfig = (app as any)?.kubeconfig || ''

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Configuration Kubernetes</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Configurez les paramètres d'authentification Kubernetes
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kubernetesToken">Token Bearer (optionnel)</Label>
            <Input
              id="kubernetesToken"
              type="password"
              value={token}
              onChange={(e) => handleChange('token' as keyof CreateAppInput, e.target.value)}
              placeholder="Votre token Bearer Kubernetes"
            />
            <p className="text-xs text-muted-foreground">
              Vous pouvez utiliser un token Bearer ou un fichier kubeconfig.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kubeconfig">Kubeconfig (optionnel)</Label>
            <textarea
              id="kubeconfig"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={kubeconfig}
              onChange={(e) => handleChange('kubeconfig' as keyof CreateAppInput, e.target.value)}
              placeholder="Contenu du fichier kubeconfig (YAML)"
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Collez le contenu de votre fichier kubeconfig. Note: Le parsing complet du kubeconfig n'est pas encore implémenté, utilisez un token Bearer pour l'instant.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Configuration pour Uptime Kuma (API key ou username/password)
  if (templateId === 'uptime-kuma') {
    const apiKey = (app as any)?.apiKey || (app as any)?.uptimeKumaApiKey || ''
    const username = (app as any)?.username || ''
    const password = (app as any)?.password || ''

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Configuration Uptime Kuma</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Configurez les paramètres d'authentification Uptime Kuma
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="uptimeKumaApiKey">Clé API (optionnel)</Label>
            <Input
              id="uptimeKumaApiKey"
              type="password"
              value={apiKey}
              onChange={(e) => handleChange('apiKey' as keyof CreateAppInput, e.target.value)}
              placeholder="Votre clé API Uptime Kuma"
            />
            <p className="text-xs text-muted-foreground">
              Vous pouvez utiliser une clé API ou un nom d'utilisateur/mot de passe.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="uptimeKumaUsername">Nom d'utilisateur (si pas de clé API)</Label>
            <Input
              id="uptimeKumaUsername"
              type="text"
              value={username}
              onChange={(e) => handleChange('username' as keyof CreateAppInput, e.target.value)}
              placeholder="admin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="uptimeKumaPassword">Mot de passe (si pas de clé API)</Label>
            <Input
              id="uptimeKumaPassword"
              type="password"
              value={password}
              onChange={(e) => handleChange('password' as keyof CreateAppInput, e.target.value)}
              placeholder="Votre mot de passe"
            />
          </div>
        </div>
      </div>
    )
  }

  // Configuration pour Overseerr (token API)
  if (templateId === 'overseerr') {
    const apiKey = (app as any)?.apiKey || (app as any)?.overseerrApiKey || ''

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Configuration Overseerr</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Configurez les paramètres d'authentification Overseerr
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="overseerrApiKey">Token API *</Label>
            <Input
              id="overseerrApiKey"
              type="password"
              value={apiKey}
              onChange={(e) => handleChange('apiKey' as keyof CreateAppInput, e.target.value)}
              placeholder="Votre token API Overseerr"
              required
            />
            <p className="text-xs text-muted-foreground">
              Le token API est nécessaire pour récupérer les statistiques.
              Vous pouvez le créer dans les paramètres d'Overseerr (Settings → General → API Key).
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Pour les autres templates, retourner null
  return null
}

