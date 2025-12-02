/**
 * Composant WidgetForm
 * 
 * Formulaire pour ajouter ou modifier un widget
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import type { Widget, WidgetType, ClockWidgetConfig, WeatherWidgetConfig, SystemInfoWidgetConfig } from '@/lib/types'
import { Clock, Cloud, Server } from 'lucide-react'

interface WidgetFormProps {
    widget?: Widget | null
    onSubmit: (data: Partial<Widget>) => Promise<void>
    onCancel: () => void
}

export function WidgetForm({ widget, onSubmit, onCancel }: WidgetFormProps) {
    const [type, setType] = useState<WidgetType>(widget?.type || 'clock')
    const [enabled, setEnabled] = useState(widget?.enabled !== false)
    const [config, setConfig] = useState<any>(widget?.config || {})

    /**
     * Gère la soumission du formulaire
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit({
            type,
            enabled,
            config,
        })
    }

    /**
     * Met à jour la configuration selon le type de widget
     */
    const updateConfig = (key: string, value: any) => {
        setConfig((prev: any) => ({
            ...prev,
            [key]: value,
        }))
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type de widget */}
            <div className="space-y-2">
                <Label htmlFor="type">Type de widget</Label>
                <Select value={type} onValueChange={(value) => setType(value as WidgetType)}>
                    <SelectTrigger id="type">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="clock">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Horloge
                            </div>
                        </SelectItem>
                        <SelectItem value="weather">
                            <div className="flex items-center gap-2">
                                <Cloud className="h-4 w-4" />
                                Météo
                            </div>
                        </SelectItem>
                        <SelectItem value="system-info">
                            <div className="flex items-center gap-2">
                                <Server className="h-4 w-4" />
                                Informations système
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Activé/Désactivé */}
            <div className="flex items-center space-x-2">
                <Checkbox
                    id="enabled"
                    checked={enabled}
                    onCheckedChange={(checked) => setEnabled(checked === true)}
                />
                <Label htmlFor="enabled" className="cursor-pointer">
                    Widget activé
                </Label>
            </div>

            {/* Configuration spécifique selon le type */}
            {type === 'clock' && (
                <ClockConfigForm
                    config={config as ClockWidgetConfig}
                    updateConfig={updateConfig}
                />
            )}

            {type === 'weather' && (
                <WeatherConfigForm
                    config={config as WeatherWidgetConfig}
                    updateConfig={updateConfig}
                />
            )}

            {type === 'system-info' && (
                <SystemInfoConfigForm
                    config={config as SystemInfoWidgetConfig}
                    updateConfig={updateConfig}
                />
            )}

            {/* Boutons */}
            <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Annuler
                </Button>
                <Button type="submit">
                    {widget ? 'Modifier' : 'Ajouter'}
                </Button>
            </div>
        </form>
    )
}

/**
 * Formulaire de configuration pour le widget Clock
 */
function ClockConfigForm({
    config,
    updateConfig,
}: {
    config: ClockWidgetConfig
    updateConfig: (key: string, value: any) => void
}) {
    return (
        <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
                <Label htmlFor="clock-format">Format d'heure</Label>
                <Select
                    value={config.format || '24h'}
                    onValueChange={(value) => updateConfig('format', value)}
                >
                    <SelectTrigger id="clock-format">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="24h">24 heures</SelectItem>
                        <SelectItem value="12h">12 heures (AM/PM)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox
                    id="show-date"
                    checked={config.showDate !== false}
                    onCheckedChange={(checked) => updateConfig('showDate', checked === true)}
                />
                <Label htmlFor="show-date" className="cursor-pointer">
                    Afficher la date
                </Label>
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox
                    id="show-seconds"
                    checked={config.showSeconds !== false}
                    onCheckedChange={(checked) => updateConfig('showSeconds', checked === true)}
                />
                <Label htmlFor="show-seconds" className="cursor-pointer">
                    Afficher les secondes
                </Label>
            </div>
        </div>
    )
}

/**
 * Formulaire de configuration pour le widget Weather
 */
function WeatherConfigForm({
    config,
    updateConfig,
}: {
    config: WeatherWidgetConfig
    updateConfig: (key: string, value: any) => void
}) {
    return (
        <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
                <Label htmlFor="weather-city">Ville</Label>
                <Input
                    id="weather-city"
                    value={config.city || ''}
                    onChange={(e) => updateConfig('city', e.target.value)}
                    placeholder="Paris"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="weather-unit">Unité de température</Label>
                <Select
                    value={config.unit || 'celsius'}
                    onValueChange={(value) => updateConfig('unit', value)}
                >
                    <SelectTrigger id="weather-unit">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="celsius">Celsius (°C)</SelectItem>
                        <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="weather-api-key">Clé API OpenWeatherMap (optionnel)</Label>
                <Input
                    id="weather-api-key"
                    type="password"
                    value={config.apiKey || ''}
                    onChange={(e) => updateConfig('apiKey', e.target.value)}
                    placeholder="Laissez vide pour utiliser la variable d'environnement"
                />
                <p className="text-xs text-muted-foreground">
                    Si non renseignée, utilise NEXT_PUBLIC_WEATHER_API_KEY
                </p>
            </div>
        </div>
    )
}

/**
 * Formulaire de configuration pour le widget SystemInfo
 */
function SystemInfoConfigForm({
    config,
    updateConfig,
}: {
    config: SystemInfoWidgetConfig
    updateConfig: (key: string, value: any) => void
}) {
    return (
        <div className="space-y-4 border-t pt-4">
            <div className="flex items-center space-x-2">
                <Checkbox
                    id="show-uptime"
                    checked={config.showUptime !== false}
                    onCheckedChange={(checked) => updateConfig('showUptime', checked === true)}
                />
                <Label htmlFor="show-uptime" className="cursor-pointer">
                    Afficher l'uptime
                </Label>
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox
                    id="show-last-update"
                    checked={config.showLastUpdate !== false}
                    onCheckedChange={(checked) => updateConfig('showLastUpdate', checked === true)}
                />
                <Label htmlFor="show-last-update" className="cursor-pointer">
                    Afficher la date de dernière mise à jour
                </Label>
            </div>
        </div>
    )
}

