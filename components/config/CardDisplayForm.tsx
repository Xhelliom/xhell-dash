/**
 * Composant CardDisplayForm
 * 
 * Formulaire pour configurer l'affichage de la statistique sur la carte :
 * - Type de statistique (number/chart/custom)
 * - Clé de statistique
 * - Libellé personnalisé
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
import type { App, CreateAppInput, CardStatType, CardStatConfig } from '@/lib/types'
import { getCardStatTypes } from '@/lib/card-stat-types'
import { getTemplateById } from '@/lib/stats-templates'
import { normalizeCardStatConfig } from '@/lib/card-stat-utils'

interface CardDisplayFormProps {
  app?: App | null
  onChange: (data: Partial<CreateAppInput>) => void
}

/**
 * Options de clés disponibles selon le template
 */
function getAvailableStatKeys(templateId?: string): { value: string; label: string }[] {
  if (templateId === 'plex') {
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

export function CardDisplayForm({ app, onChange }: CardDisplayFormProps) {
  const templateId = app?.statsConfig?.templateId
  // Normaliser la config pour gérer les anciennes données
  const cardStatConfig = normalizeCardStatConfig(app?.statsConfig?.cardStat)
  
  // Récupérer les types disponibles selon le template
  const availableTypes = getCardStatTypes(templateId)
  
  // État local pour les valeurs du formulaire
  const cardStatType: CardStatType | '' = cardStatConfig?.type || ''
  const customType = cardStatConfig?.customType || ''
  const cardStatKey = cardStatConfig?.key || ''
  const cardStatLabel = cardStatConfig?.label || ''

  /**
   * Met à jour la configuration de la statistique de carte
   */
  const updateCardStat = (updates: Partial<CardStatConfig>) => {
    const newCardStat: CardStatConfig = {
      type: cardStatType as CardStatType,
      customType,
      key: cardStatKey,
      label: cardStatLabel,
      ...updates,
    }

    // Si le type est vide, supprimer la config
    if (!newCardStat.type) {
      onChange({
        statsConfig: {
          ...app?.statsConfig,
          cardStat: undefined,
        },
      })
      return
    }

    onChange({
      statsConfig: {
        ...app?.statsConfig,
        cardStat: newCardStat,
      },
    })
  }

  /**
   * Gère le changement de type
   */
  const handleTypeChange = (value: string) => {
    if (value === 'none') {
      updateCardStat({ type: '' as CardStatType })
      return
    }

    const newType = value as CardStatType
    const updates: Partial<CardStatConfig> = { type: newType }

    // Si c'est un type custom, déterminer le customType
    if (newType === 'custom') {
      // Trouver le premier type custom disponible
      const customTypes = availableTypes.filter(t => !['number', 'chart'].includes(t))
      if (customTypes.length > 0) {
        updates.customType = customTypes[0]
      }
    } else {
      updates.customType = undefined
    }

    updateCardStat(updates)
  }

  /**
   * Gère le changement de customType
   */
  const handleCustomTypeChange = (value: string) => {
    updateCardStat({ customType: value })
  }

  /**
   * Gère le changement de clé
   */
  const handleKeyChange = (value: string) => {
    updateCardStat({ key: value })
  }

  /**
   * Gère le changement de libellé
   */
  const handleLabelChange = (value: string) => {
    updateCardStat({ label: value })
  }

  // Séparer les types communs et custom
  const commonTypes = availableTypes.filter(t => ['number', 'chart'].includes(t))
  const customTypes = availableTypes.filter(t => !['number', 'chart'].includes(t))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Affichage de la carte</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configurez comment la statistique s'affiche sur la carte de l'application
        </p>
      </div>

      <div className="space-y-4">
        {/* Type de statistique */}
        <div className="space-y-2">
          <Label htmlFor="cardStatType">Type d'affichage</Label>
          <Select
            value={cardStatType || 'none'}
            onValueChange={handleTypeChange}
          >
            <SelectTrigger id="cardStatType">
              <SelectValue placeholder="Aucun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun</SelectItem>
              {commonTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === 'number' ? 'Nombre' : 'Graphique (courbe)'}
                </SelectItem>
              ))}
              {customTypes.length > 0 && (
                <SelectItem value="custom">
                  Personnalisé ({customTypes.length} type{customTypes.length > 1 ? 's' : ''} disponible{customTypes.length > 1 ? 's' : ''})
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Type personnalisé (si custom est sélectionné) */}
        {cardStatType === 'custom' && customTypes.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="customType">Type personnalisé</Label>
            <Select
              value={customType || customTypes[0]}
              onValueChange={handleCustomTypeChange}
            >
              <SelectTrigger id="customType">
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                {customTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === 'plex-recent' ? 'Images des 3 derniers ajouts (Plex)' : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Clé de la statistique (si type = number ou chart) */}
        {cardStatType && cardStatType !== 'custom' && (
          <div className="space-y-2">
            <Label htmlFor="cardStatKey">Clé de la statistique</Label>
            <Select
              value={cardStatKey}
              onValueChange={handleKeyChange}
            >
              <SelectTrigger id="cardStatKey">
                <SelectValue placeholder="Sélectionnez une clé" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableStatKeys(templateId).map((key) => (
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
              onChange={(e) => handleLabelChange(e.target.value)}
              placeholder="Ex: Films, Utilisateurs..."
            />
            <p className="text-xs text-muted-foreground">
              Si vide, le libellé par défaut sera utilisé
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

