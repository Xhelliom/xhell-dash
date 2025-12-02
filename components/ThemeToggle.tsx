/**
 * Composant ThemeToggle
 * 
 * Permet de basculer entre les thèmes light, dark et system
 * Utilise next-themes pour la gestion du thème et shadcn ToggleGroup pour l'interface
 * Affiche trois boutons pour sélectionner directement le thème souhaité
 */

'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Moon, Sun, Monitor } from 'lucide-react'

export function ThemeToggle() {
    const [mounted, setMounted] = useState(false)
    const { theme, setTheme } = useTheme()

    // Prévenir les problèmes d'hydratation
    useEffect(() => {
        setMounted(true)
    }, [])

    // Ne pas rendre avant le montage pour éviter les problèmes d'hydratation
    if (!mounted) {
        return null
    }

    /**
     * Gère le changement de thème
     * @param value - La valeur du thème sélectionné ('light', 'dark' ou 'system')
     */
    const handleThemeChange = (value: string) => {
        if (value && ['light', 'dark', 'system'].includes(value)) {
            setTheme(value)
        }
    }

    return (
        <ToggleGroup
            type="single"
            value={theme || 'system'}
            onValueChange={handleThemeChange}
            className="gap-0"
            size="sm"
            variant="outline"
        >
            {/* Bouton pour le thème clair */}
            <ToggleGroupItem
                value="light"
                aria-label="Thème clair"
                title="Thème clair"
            >
                <Sun className="h-4 w-4" />
            </ToggleGroupItem>

            {/* Bouton pour le thème système */}
            <ToggleGroupItem
                value="system"
                aria-label="Thème système"
                title="Thème système"
            >
                <Monitor className="h-4 w-4" />
            </ToggleGroupItem>

            {/* Bouton pour le thème sombre */}
            <ToggleGroupItem
                value="dark"
                aria-label="Thème sombre"
                title="Thème sombre"
            >
                <Moon className="h-4 w-4" />
            </ToggleGroupItem>
        </ToggleGroup>
    )
}

