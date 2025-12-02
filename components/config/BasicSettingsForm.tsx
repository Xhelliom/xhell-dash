/**
 * Composant BasicSettingsForm
 * 
 * Formulaire pour les paramètres de base d'une application :
 * - Nom
 * - URL
 * - Logo (icône ou URL)
 */

'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { App, CreateAppInput, LogoType } from '@/lib/types'

/**
 * Liste d'icônes populaires disponibles dans Lucide React
 */
const POPULAR_ICONS = [
  'Plex',
  'Home',
  'Server',
  'Database',
  'Cloud',
  'Monitor',
  'Film',
  'Music',
  'Image',
  'File',
  'Settings',
  'User',
  'Users',
  'Lock',
  'Globe',
  'Wifi',
  'HardDrive',
  'Cpu',
  'Activity',
  'BarChart',
]

interface BasicSettingsFormProps {
  app?: App | null
  onChange: (data: Partial<CreateAppInput>) => void
}

export function BasicSettingsForm({ app, onChange }: BasicSettingsFormProps) {
  const name = app?.name || ''
  const url = app?.url || ''
  const logoType = app?.logoType || 'icon'
  const logo = app?.logo || ''
  const statApiUrl = app?.statApiUrl || ''
  const statLabel = app?.statLabel || ''

  /**
   * Met à jour les valeurs et notifie le parent
   */
  const handleChange = (field: keyof CreateAppInput, value: any) => {
    onChange({ [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Paramètres de base</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configurez les informations de base de votre application
        </p>
      </div>

      <div className="space-y-4">
        {/* Nom de l'application */}
        <div className="space-y-2">
          <Label htmlFor="name">Nom *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Ex: Plex, Sonarr, Home Assistant..."
            required
          />
        </div>

        {/* URL de l'application */}
        <div className="space-y-2">
          <Label htmlFor="url">URL *</Label>
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => handleChange('url', e.target.value)}
            placeholder="https://example.com"
            required
          />
        </div>

        {/* Type de logo */}
        <div className="space-y-2">
          <Label htmlFor="logoType">Type de logo *</Label>
          <Select
            value={logoType}
            onValueChange={(value: LogoType) => handleChange('logoType', value)}
          >
            <SelectTrigger id="logoType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="icon">Icône Lucide</SelectItem>
              <SelectItem value="url">URL d'image</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Logo */}
        <div className="space-y-2">
          <Label htmlFor="logo">Logo *</Label>
          {logoType === 'icon' ? (
            <Select
              value={logo}
              onValueChange={(value) => handleChange('logo', value)}
            >
              <SelectTrigger id="logo">
                <SelectValue placeholder="Sélectionnez une icône" />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_ICONS.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    {icon}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="logo"
              type="url"
              value={logo}
              onChange={(e) => handleChange('logo', e.target.value)}
              placeholder="https://example.com/logo.png"
              required
            />
          )}
        </div>

        {/* API de statistiques (optionnel) */}
        <div className="space-y-2">
          <Label htmlFor="statApiUrl">URL de l'API de statistiques (optionnel)</Label>
          <Input
            id="statApiUrl"
            type="url"
            value={statApiUrl}
            onChange={(e) => handleChange('statApiUrl', e.target.value)}
            placeholder="https://api.example.com/stats"
          />
        </div>

        {/* Libellé de la statistique (optionnel) */}
        <div className="space-y-2">
          <Label htmlFor="statLabel">Libellé de la statistique (optionnel)</Label>
          <Input
            id="statLabel"
            value={statLabel}
            onChange={(e) => handleChange('statLabel', e.target.value)}
            placeholder="Ex: Films, Utilisateurs, Requêtes..."
          />
        </div>
      </div>
    </div>
  )
}

