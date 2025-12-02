/**
 * Widget Weather - Météo
 * 
 * Affiche les informations météorologiques pour une ville donnée
 * Utilise l'API OpenWeatherMap (nécessite une clé API)
 */

'use client'

import { useState, useEffect } from 'react'
import { WeatherWidgetConfig } from '@/lib/types'
import { Cloud, CloudRain, Sun, CloudSnow, Wind } from 'lucide-react'

interface WeatherWidgetProps {
    config?: WeatherWidgetConfig
}

interface WeatherData {
    temp: number
    description: string
    icon: string
    humidity: number
    windSpeed: number
    city: string
}

export function WeatherWidget({ config }: WeatherWidgetProps) {
    const [weather, setWeather] = useState<WeatherData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const city = config?.city || 'Paris'
    const unit = config?.unit || 'celsius'
    const apiKey = config?.apiKey || process.env.NEXT_PUBLIC_WEATHER_API_KEY

    useEffect(() => {
        if (!apiKey) {
            setError('Clé API météo non configurée')
            setIsLoading(false)
            return
        }

        const fetchWeather = async () => {
            try {
                setIsLoading(true)
                // Note: En production, il faudrait créer une route API Next.js pour éviter d'exposer la clé API
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${unit === 'celsius' ? 'metric' : 'imperial'}&lang=fr`
                )

                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération de la météo')
                }

                const data = await response.json()
                setWeather({
                    temp: Math.round(data.main.temp),
                    description: data.weather[0].description,
                    icon: data.weather[0].icon,
                    humidity: data.main.humidity,
                    windSpeed: data.wind?.speed || 0,
                    city: data.name
                })
                setError(null)
            } catch (err: any) {
                setError(err.message || 'Impossible de charger la météo')
            } finally {
                setIsLoading(false)
            }
        }

        fetchWeather()
        // Rafraîchir toutes les 10 minutes
        const interval = setInterval(fetchWeather, 10 * 60 * 1000)

        return () => clearInterval(interval)
    }, [city, unit, apiKey])

    /**
     * Retourne l'icône appropriée selon le code météo
     */
    const getWeatherIcon = () => {
        if (!weather) return <Sun className="h-8 w-8" />

        const iconCode = weather.icon
        if (iconCode.includes('01')) return <Sun className="h-8 w-8 text-yellow-500" />
        if (iconCode.includes('02') || iconCode.includes('03') || iconCode.includes('04')) {
            return <Cloud className="h-8 w-8 text-gray-500" />
        }
        if (iconCode.includes('09') || iconCode.includes('10')) {
            return <CloudRain className="h-8 w-8 text-blue-500" />
        }
        if (iconCode.includes('13')) return <CloudSnow className="h-8 w-8 text-blue-300" />
        return <Wind className="h-8 w-8 text-gray-400" />
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[150px] w-full">
            <div className="flex items-center gap-4 mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Météo</h3>
                {getWeatherIcon()}
            </div>

            {isLoading ? (
                <div className="text-sm text-muted-foreground text-center">Chargement...</div>
            ) : error ? (
                <div className="text-sm text-destructive text-center">{error}</div>
            ) : weather ? (
                <div className="flex flex-col items-center">
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold">{weather.temp}°</span>
                        <span className="text-sm text-muted-foreground">
                            {unit === 'celsius' ? 'C' : 'F'}
                        </span>
                    </div>
                    <div className="text-sm font-medium mb-2 capitalize text-center">
                        {weather.description}
                    </div>
                    <div className="text-xs text-muted-foreground text-center mb-4">
                        {weather.city}
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Humidité: {weather.humidity}%</span>
                        <span>Vent: {weather.windSpeed.toFixed(1)} m/s</span>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

