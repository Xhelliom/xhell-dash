/**
 * Composant Background
 * 
 * Composant configurable pour afficher différents effets de background
 * Supporte plusieurs types d'effets : gradient, mesh, glow, pattern, etc.
 */

'use client'

import { cn } from '@/lib/utils'

export type BackgroundEffect =
    | 'none'
    | 'gradient-radial'
    | 'gradient-linear'
    | 'gradient-mesh'
    | 'gradient-animated'
    | 'glow'
    | 'grid-pattern'
    | 'dot-pattern'
    | 'noise'
    | 'mesh-animated'
    | 'shimmer'

interface BackgroundProps {
    /**
     * Type d'effet de background à appliquer
     */
    effect?: BackgroundEffect
    /**
     * Classes CSS additionnelles
     */
    className?: string
    /**
     * Contenu à afficher par-dessus le background
     */
    children: React.ReactNode
}

/**
 * Composant Background configurable
 * 
 * Affiche différents effets de background selon le type sélectionné
 */
export function Background({ effect = 'mesh-animated', className, children }: BackgroundProps) {
    // Classes CSS selon l'effet sélectionné
    const effectClasses = {
        'none': '',
        'gradient-radial': 'bg-gradient-radial',
        'gradient-linear': 'bg-gradient-linear',
        'gradient-mesh': 'bg-gradient-mesh',
        'gradient-animated': 'bg-gradient-animated',
        'glow': 'bg-glow',
        'grid-pattern': 'bg-grid-pattern',
        'dot-pattern': 'bg-dot-pattern',
        'noise': 'bg-noise',
        'mesh-animated': 'bg-mesh-animated',
        'shimmer': 'bg-shimmer',
    }

    return (
        <div
            className={cn(
                'min-h-screen bg-background',
                effectClasses[effect],
                className
            )}
        >
            {children}
        </div>
    )
}

