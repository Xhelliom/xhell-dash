/**
 * Composant AppForm
 * 
 * Formulaire pour ajouter ou modifier une application
 * Utilise un Dialog shadcn/ui pour l'affichage modal
 */

'use client'

import { useState, useEffect, useRef } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import type { App, CreateAppInput, StatsDisplayOptions, PlexKPIOptions, CardStatType } from '@/lib/types'
import { STATS_TEMPLATES, getTemplateById } from '@/lib/stats-templates'

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
  // Référence au formulaire pour la soumission
  const formRef = useRef<HTMLFormElement>(null)

  // État du formulaire
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [logoType, setLogoType] = useState<'icon' | 'url'>('icon')
  const [logo, setLogo] = useState('')
  const [statApiUrl, setStatApiUrl] = useState('')
  const [statLabel, setStatLabel] = useState('')
  const [plexToken, setPlexToken] = useState('')
  const [plexServerUrl, setPlexServerUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // État pour le template de stats sélectionné
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')

  // État pour les options d'affichage
  const [displayOptions, setDisplayOptions] = useState<StatsDisplayOptions>({
    showKPIs: true,
    showLibraryChart: true,
    showRecentMedia: true,
    kpiOptions: {
      showMovies: true,
      showShows: true,
      showEpisodes: true,
      showUsers: true,
      showLibraries: true,
    },
  })

  // État pour la configuration de la statistique de carte
  const [cardStatType, setCardStatType] = useState<CardStatType | ''>('')
  const [cardStatKey, setCardStatKey] = useState<string>('')
  const [cardStatLabel, setCardStatLabel] = useState<string>('')

  // Vérifier si c'est une application Plex pour afficher les champs spécifiques
  const isPlex = name.toLowerCase() === 'plex'
  const selectedTemplate = selectedTemplateId ? getTemplateById(selectedTemplateId) : null

  // Options de clés disponibles selon le template
  const getAvailableStatKeys = (): { value: string; label: string }[] => {
    if (selectedTemplateId === 'plex') {
      return [
        { value: 'totalMovies', label: 'Total Films' },
        { value: 'totalShows', label: 'Total Séries' },
        { value: 'totalEpisodes', label: 'Total Épisodes' },
        { value: 'totalUsers', label: 'Total Utilisateurs' },
        { value: 'totalLibraries', label: 'Total Bibliothèques' },
      ]
    }
    return [
      { value: 'value', label: 'Valeur' },
      { value: 'count', label: 'Compte' },
      { value: 'total', label: 'Total' },
    ]
  }

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
        setPlexToken((app as any).plexToken || '')
        setPlexServerUrl((app as any).plexServerUrl || app.url)
        // Charger le template et les options d'affichage
        const templateId = app.statsConfig?.templateId || ''
        setSelectedTemplateId(templateId)
        if (app.statsConfig?.displayOptions) {
          setDisplayOptions(app.statsConfig.displayOptions)
        } else if (templateId) {
          const template = getTemplateById(templateId)
          if (template) {
            setDisplayOptions(template.defaultDisplayOptions)
          }
        }
        // Charger la configuration de la statistique de carte
        if (app.statsConfig?.cardStat) {
          setCardStatType(app.statsConfig.cardStat.type)
          setCardStatKey(app.statsConfig.cardStat.key || '')
          setCardStatLabel(app.statsConfig.cardStat.label || '')
        } else {
          setCardStatType('')
          setCardStatKey('')
          setCardStatLabel('')
        }
      } else {
        // Mode création : réinitialiser
        setName('')
        setUrl('')
        setLogoType('icon')
        setLogo('')
        setStatApiUrl('')
        setStatLabel('')
        setPlexToken('')
        setPlexServerUrl('')
        setSelectedTemplateId('')
        setDisplayOptions({
          showKPIs: true,
          showLibraryChart: true,
          showRecentMedia: true,
          kpiOptions: {
            showMovies: true,
            showShows: true,
            showEpisodes: true,
            showUsers: true,
            showLibraries: true,
          },
        })
        setCardStatType('')
        setCardStatKey('')
        setCardStatLabel('')
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
    // Validation spécifique pour Plex
    if (isPlex) {
      if (!plexToken.trim()) {
        alert('Le token Plex est obligatoire pour les applications Plex')
        return false
      }
      if (plexServerUrl && plexServerUrl.trim()) {
        try {
          new URL(plexServerUrl)
        } catch {
          alert('L\'URL du serveur Plex n\'est pas valide')
          return false
        }
      }
    }
    return true
  }

  /**
   * Gère le changement de template
   */
  const handleTemplateChange = (templateId: string) => {
    // Si la valeur est undefined ou vide, réinitialiser
    if (!templateId || templateId === 'none') {
      setSelectedTemplateId('')
      return
    }

    setSelectedTemplateId(templateId)

    const template = getTemplateById(templateId)
    if (template) {
      // Appliquer le template pour pré-remplir les champs
      const updatedValues = template.applyTemplate({
        name,
        url,
        logo,
        logoType,
        statLabel,
      })

      if (updatedValues.name) setName(updatedValues.name)
      if (updatedValues.logo) setLogo(updatedValues.logo)
      if (updatedValues.logoType) setLogoType(updatedValues.logoType)
      if (updatedValues.statLabel) setStatLabel(updatedValues.statLabel)

      // Appliquer les options d'affichage par défaut
      setDisplayOptions(template.defaultDisplayOptions)
    }
  }

  /**
   * Met à jour une option d'affichage spécifique
   */
  const updateDisplayOption = <K extends keyof StatsDisplayOptions>(
    key: K,
    value: StatsDisplayOptions[K]
  ) => {
    setDisplayOptions((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  /**
   * Met à jour une option KPI spécifique
   */
  const updateKPIOption = <K extends keyof PlexKPIOptions>(
    key: K,
    value: boolean
  ) => {
    setDisplayOptions((prev) => ({
      ...prev,
      kpiOptions: {
        ...prev.kpiOptions,
        [key]: value,
      },
    }))
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
        plexToken: isPlex ? plexToken.trim() || undefined : undefined,
        plexServerUrl: isPlex && plexServerUrl.trim() ? plexServerUrl.trim() : undefined,
        statsConfig: selectedTemplateId || cardStatType ? {
          templateId: selectedTemplateId || undefined,
          displayOptions: selectedTemplateId ? displayOptions : undefined,
          cardStat: cardStatType ? {
            type: cardStatType,
            key: cardStatKey.trim() || undefined,
            label: cardStatLabel.trim() || undefined,
          } : undefined,
        } : undefined,
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{app ? 'Modifier l\'application' : 'Ajouter une application'}</DialogTitle>
          <DialogDescription>
            {app
              ? 'Modifiez les informations de l\'application'
              : 'Remplissez les informations pour ajouter une nouvelle application au dashboard'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 -mr-1">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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

          {/* Configuration de la statistique sur la carte */}
          <div className="border-t pt-4 mt-4 space-y-4">
            <h3 className="text-sm font-semibold">Statistique sur la carte</h3>
            
            {/* Type de statistique */}
            <div className="space-y-2">
              <Label htmlFor="cardStatType">Type d'affichage</Label>
              <Select 
                value={cardStatType || 'none'} 
                onValueChange={(value) => {
                  if (value === 'none') {
                    setCardStatType('')
                    setCardStatKey('')
                    setCardStatLabel('')
                  } else {
                    setCardStatType(value as CardStatType)
                  }
                }}
              >
                <SelectTrigger id="cardStatType">
                  <SelectValue placeholder="Aucun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  <SelectItem value="number">Nombre</SelectItem>
                  <SelectItem value="chart">Graphique (courbe)</SelectItem>
                  {selectedTemplateId === 'plex' && (
                    <SelectItem value="plex-recent">Images des 3 derniers ajouts (Plex)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Clé de la statistique (si type = number ou chart) */}
            {cardStatType && cardStatType !== 'plex-recent' && (
              <div className="space-y-2">
                <Label htmlFor="cardStatKey">Clé de la statistique</Label>
                <Select 
                  value={cardStatKey} 
                  onValueChange={setCardStatKey}
                >
                  <SelectTrigger id="cardStatKey">
                    <SelectValue placeholder="Sélectionnez une clé" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableStatKeys().map((key) => (
                      <SelectItem key={key.value} value={key.value}>
                        {key.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Clé utilisée pour récupérer la valeur depuis l'API
                </p>
              </div>
            )}

            {/* Libellé personnalisé */}
            {cardStatType && (
              <div className="space-y-2">
                <Label htmlFor="cardStatLabel">Libellé personnalisé (optionnel)</Label>
                <Input
                  id="cardStatLabel"
                  value={cardStatLabel}
                  onChange={(e) => setCardStatLabel(e.target.value)}
                  placeholder="Ex: Films, Utilisateurs..."
                />
                <p className="text-xs text-muted-foreground">
                  Si vide, le libellé par défaut sera utilisé
                </p>
              </div>
            )}
          </div>

          {/* Sélection du template de stats */}
          <div className="space-y-2">
            <Label htmlFor="statsTemplate">Template de statistiques (optionnel)</Label>
            <Select value={selectedTemplateId || undefined} onValueChange={handleTemplateChange}>
              <SelectTrigger id="statsTemplate">
                <SelectValue placeholder="Aucun template" />
              </SelectTrigger>
              <SelectContent>
                {STATS_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate && (
              <p className="text-xs text-muted-foreground">
                {selectedTemplate.description}
              </p>
            )}
          </div>

          {/* Options d'affichage si un template est sélectionné */}
          {selectedTemplate && (
            <div className="border-t pt-4 mt-4 space-y-4">
              <h3 className="text-sm font-semibold">Options d'affichage</h3>

              {/* Options générales */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showKPIs"
                    checked={displayOptions.showKPIs ?? true}
                    onCheckedChange={(checked) => updateDisplayOption('showKPIs', checked === true)}
                  />
                  <Label htmlFor="showKPIs" className="cursor-pointer">
                    Afficher les KPI
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showLibraryChart"
                    checked={displayOptions.showLibraryChart ?? true}
                    onCheckedChange={(checked) => updateDisplayOption('showLibraryChart', checked === true)}
                  />
                  <Label htmlFor="showLibraryChart" className="cursor-pointer">
                    Afficher le graphique des bibliothèques
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showRecentMedia"
                    checked={displayOptions.showRecentMedia ?? true}
                    onCheckedChange={(checked) => updateDisplayOption('showRecentMedia', checked === true)}
                  />
                  <Label htmlFor="showRecentMedia" className="cursor-pointer">
                    Afficher les derniers médias ajoutés
                  </Label>
                </div>
              </div>

              {/* Options spécifiques pour les KPI (si le template est Plex) */}
              {selectedTemplate.id === 'plex' && displayOptions.showKPIs && (
                <div className="ml-6 space-y-2 border-l pl-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Éléments KPI à afficher :</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showMovies"
                        checked={displayOptions.kpiOptions?.showMovies ?? true}
                        onCheckedChange={(checked) => updateKPIOption('showMovies', checked === true)}
                      />
                      <Label htmlFor="showMovies" className="cursor-pointer text-sm">
                        Films
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showShows"
                        checked={displayOptions.kpiOptions?.showShows ?? true}
                        onCheckedChange={(checked) => updateKPIOption('showShows', checked === true)}
                      />
                      <Label htmlFor="showShows" className="cursor-pointer text-sm">
                        Séries
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showEpisodes"
                        checked={displayOptions.kpiOptions?.showEpisodes ?? true}
                        onCheckedChange={(checked) => updateKPIOption('showEpisodes', checked === true)}
                      />
                      <Label htmlFor="showEpisodes" className="cursor-pointer text-sm">
                        Épisodes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showUsers"
                        checked={displayOptions.kpiOptions?.showUsers ?? true}
                        onCheckedChange={(checked) => updateKPIOption('showUsers', checked === true)}
                      />
                      <Label htmlFor="showUsers" className="cursor-pointer text-sm">
                        Utilisateurs
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showLibraries"
                        checked={displayOptions.kpiOptions?.showLibraries ?? true}
                        onCheckedChange={(checked) => updateKPIOption('showLibraries', checked === true)}
                      />
                      <Label htmlFor="showLibraries" className="cursor-pointer text-sm">
                        Bibliothèques
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Champs spécifiques pour Plex */}
          {isPlex && (
            <>
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-3">Configuration Plex</h3>

                {/* URL du serveur Plex */}
                <div className="space-y-2 mb-4">
                  <Label htmlFor="plexServerUrl">URL du serveur Plex (optionnel)</Label>
                  <Input
                    id="plexServerUrl"
                    type="url"
                    value={plexServerUrl}
                    onChange={(e) => setPlexServerUrl(e.target.value)}
                    placeholder={url || "http://localhost:32400"}
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
                    onChange={(e) => setPlexToken(e.target.value)}
                    placeholder="Votre token d'authentification Plex"
                    required={isPlex}
                  />
                  <p className="text-xs text-muted-foreground">
                    Le token Plex est nécessaire pour récupérer les statistiques détaillées.
                    Vous pouvez le trouver dans les paramètres de votre serveur Plex.
                  </p>
                </div>
              </div>
            </>
          )}
          </form>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button 
            type="button"
            onClick={() => {
              if (formRef.current) {
                formRef.current.requestSubmit()
              }
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enregistrement...' : app ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

