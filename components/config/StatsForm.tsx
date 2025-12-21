/**
 * Composant StatsForm
 * 
 * Formulaire pour configurer les statistiques :
 * - Template de statistiques
 * - Options d'affichage (KPIs, graphiques, etc.)
 * - Options spécifiques par template
 */

'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import type { App, CreateAppInput, StatsDisplayOptions, PlexKPIOptions } from '@/lib/types'
import { STATS_TEMPLATES, getTemplateById } from '@/lib/stats-templates'

interface StatsFormProps {
  app?: App | null
  onChange: (data: Partial<CreateAppInput>) => void
}

export function StatsForm({ app, onChange }: StatsFormProps) {
  const templateId = app?.statsConfig?.templateId || ''
  const displayOptions = app?.statsConfig?.displayOptions || {
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
  }

  const selectedTemplate = templateId ? getTemplateById(templateId) : null

  /**
   * Gère le changement de template
   */
  const handleTemplateChange = (newTemplateId: string) => {
    const template = getTemplateById(newTemplateId)
    
    onChange({
      statsConfig: {
        templateId: newTemplateId || undefined,
        displayOptions: template ? template.defaultDisplayOptions : undefined,
        cardStat: app?.statsConfig?.cardStat, // Conserver la config de carte
      },
    })
  }

  /**
   * Met à jour une option d'affichage spécifique
   */
  const updateDisplayOption = <K extends keyof StatsDisplayOptions>(
    key: K,
    value: StatsDisplayOptions[K]
  ) => {
    onChange({
      statsConfig: {
        ...app?.statsConfig,
        displayOptions: {
          ...displayOptions,
          [key]: value,
        },
      },
    })
  }

  /**
   * Met à jour une option KPI spécifique
   */
  const updateKPIOption = <K extends keyof PlexKPIOptions>(
    key: K,
    value: boolean
  ) => {
    onChange({
      statsConfig: {
        ...app?.statsConfig,
        displayOptions: {
          ...displayOptions,
          kpiOptions: {
            ...displayOptions.kpiOptions,
            [key]: value,
          },
        },
      },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Statistiques</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configurez le template de statistiques et les options d'affichage
        </p>
      </div>

      <div className="space-y-4">
        {/* Sélection du template de stats */}
        <div className="space-y-2">
          <Label htmlFor="statsTemplate">Template de statistiques (optionnel)</Label>
          <Select
            value={templateId || undefined}
            onValueChange={handleTemplateChange}
          >
            <SelectTrigger id="statsTemplate" className="w-full">
              <SelectValue placeholder="Aucun template">
                {selectedTemplate?.name || ''}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATS_TEMPLATES.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <span className="font-medium">{template.name}</span>
                  <span className="text-muted-foreground"> - {template.description}</span>
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
      </div>
    </div>
  )
}

