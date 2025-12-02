/**
 * Widget Clock - Horloge numérique
 * 
 * Affiche l'heure actuelle avec possibilité d'afficher la date
 * Format 12h ou 24h configurable
 */

'use client'

import { useState, useEffect } from 'react'
import { ClockWidgetConfig } from '@/lib/types'
import { Clock } from 'lucide-react'

interface ClockWidgetProps {
    config?: ClockWidgetConfig
}

export function ClockWidget({ config }: ClockWidgetProps) {
    const [time, setTime] = useState(new Date())
    const format = config?.format || '24h'
    const showDate = config?.showDate !== false // Par défaut, afficher la date
    const showSeconds = config?.showSeconds !== false // Par défaut, afficher les secondes

    // Mettre à jour l'heure chaque seconde
    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date())
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    /**
     * Formate l'heure selon le format configuré
     */
    const formatTime = () => {
        const hours = time.getHours()
        const minutes = time.getMinutes().toString().padStart(2, '0')
        const seconds = showSeconds ? time.getSeconds().toString().padStart(2, '0') : null

        if (format === '12h') {
            const period = hours >= 12 ? 'PM' : 'AM'
            const displayHours = hours % 12 || 12
            return `${displayHours}:${minutes}${seconds ? `:${seconds}` : ''} ${period}`
        } else {
            const displayHours = hours.toString().padStart(2, '0')
            return `${displayHours}:${minutes}${seconds ? `:${seconds}` : ''}`
        }
    }

    /**
     * Formate la date en français
     */
    const formatDate = () => {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }
        return time.toLocaleDateString('fr-FR', options)
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[150px] w-full">
            <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">Horloge</h3>
            </div>

            {/* Affichage de l'heure */}
            <div className="text-4xl font-bold mb-2 font-mono text-center">
                {formatTime()}
            </div>

            {/* Affichage de la date */}
            {showDate && (
                <div className="text-sm text-muted-foreground text-center">
                    {formatDate()}
                </div>
            )}
        </div>
    )
}

