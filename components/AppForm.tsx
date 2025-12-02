/**
 * Composant AppForm
 * 
 * Formulaire pour ajouter ou modifier une application
 * Utilise un Dialog shadcn/ui pour l'affichage modal
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { App, CreateAppInput } from '@/lib/types'

interface AppFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  app?: App | null
  onSubmit: (data: CreateAppInput) => Promise<void>
}

/**
 * Liste d'icônes populaires disponibles dans Lucide React
 * Les utilisateurs peuvent choisir parmi ces icônes ou utiliser une URL
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

export function AppForm({ open, onOpenChange, app, onSubmit }: AppFormProps) {
  // État du formulaire
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [logoType, setLogoType] = useState<'icon' | 'url'>('icon')
  const [logo, setLogo] = useState('')
  const [statApiUrl, setStatApiUrl] = useState('')
  const [statLabel, setStatLabel] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Réinitialiser le formulaire quand le dialog s'ouvre/ferme ou quand l'app change
  useEffect(() => {
    if (open) {
      if (app) {
        // Mode édition : remplir avec les données de l'app
        setName(app.name)
        setUrl(app.url)
        setLogoType(app.logoType)
        setLogo(app.logo)
        setStatApiUrl(app.statApiUrl || '')
        setStatLabel(app.statLabel || '')
      } else {
        // Mode création : réinitialiser
        setName('')
        setUrl('')
        setLogoType('icon')
        setLogo('')
        setStatApiUrl('')
        setStatLabel('')
      }
    }
  }, [open, app])

  /**
   * Valide les données du formulaire avant soumission
   */
  const validate = (): boolean => {
    if (!name.trim()) {
      alert('Le nom est obligatoire')
      return false
    }
    if (!url.trim()) {
      alert('L\'URL est obligatoire')
      return false
    }
    try {
      new URL(url)
    } catch {
      alert('L\'URL n\'est pas valide')
      return false
    }
    if (!logo.trim()) {
      alert('Le logo est obligatoire')
      return false
    }
    if (logoType === 'url') {
      try {
        new URL(logo)
      } catch {
        alert('L\'URL du logo n\'est pas valide')
        return false
      }
    }
    if (statApiUrl && statApiUrl.trim()) {
      try {
        new URL(statApiUrl)
      } catch {
        alert('L\'URL de l\'API de statistiques n\'est pas valide')
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
      const formData: CreateAppInput = {
        name: name.trim(),
        url: url.trim(),
        logoType,
        logo: logo.trim(),
        statApiUrl: statApiUrl.trim() || undefined,
        statLabel: statLabel.trim() || undefined,
      }

      await onSubmit(formData)
      
      // Fermer le dialog après succès
      onOpenChange(false)
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      alert('Une erreur est survenue lors de la sauvegarde')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{app ? 'Modifier l\'application' : 'Ajouter une application'}</DialogTitle>
          <DialogDescription>
            {app
              ? 'Modifiez les informations de l\'application'
              : 'Remplissez les informations pour ajouter une nouvelle application au dashboard'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom de l'application */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
            />
          </div>

          {/* Type de logo */}
          <div className="space-y-2">
            <Label htmlFor="logoType">Type de logo *</Label>
            <Select value={logoType} onValueChange={(value: 'icon' | 'url') => setLogoType(value)}>
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
              <Select value={logo} onValueChange={setLogo}>
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
                onChange={(e) => setLogo(e.target.value)}
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
              onChange={(e) => setStatApiUrl(e.target.value)}
              placeholder="https://api.example.com/stats"
            />
          </div>

          {/* Libellé de la statistique (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="statLabel">Libellé de la statistique (optionnel)</Label>
            <Input
              id="statLabel"
              value={statLabel}
              onChange={(e) => setStatLabel(e.target.value)}
              placeholder="Ex: Films, Utilisateurs, Requêtes..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : app ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

