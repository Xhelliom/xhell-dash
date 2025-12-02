/**
 * Composant FloatingConfigButton
 * 
 * Bouton de configuration flottant avec animation :
 * - Icône seule par défaut
 * - Au survol, s'agrandit et révèle le texte "Configuration"
 * - Toggle le mode édition du dashboard au lieu de rediriger
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FloatingConfigButtonProps {
    className?: string
    isEditMode?: boolean
}

export function FloatingConfigButton({ className, isEditMode = false }: FloatingConfigButtonProps) {
    const [isHovered, setIsHovered] = useState(false)

    /**
     * Gère le clic sur le bouton
     * Émet un événement personnalisé pour toggle le mode édition
     */
    const handleClick = () => {
        // Émettre un événement personnalisé pour toggle le mode édition
        window.dispatchEvent(new CustomEvent('toggleEditMode'))
    }

    return (
        <Button
            variant={isEditMode ? "destructive" : "default"}
            size="icon"
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
                'fixed bottom-6 right-6 z-50',
                'h-14 rounded-full shadow-lg',
                'transition-[width,padding] duration-300 ease-in-out',
                'flex items-center',
                'overflow-hidden',
                // Centrer quand replié, aligner à gauche quand agrandi
                isHovered ? 'justify-start px-4' : 'justify-center px-0',
                // Largeur qui s'anime depuis le centre
                isHovered
                    ? 'w-[180px]'
                    : 'w-14',
                className
            )}
            aria-label={isEditMode ? "Quitter le mode édition" : "Configuration"}
        >
            <div className={cn(
                'flex items-center',
                isHovered ? 'justify-start' : 'justify-center w-full'
            )}>
                {isEditMode ? (
                    <X className="h-5 w-5 shrink-0" />
                ) : (
                    <Settings className="h-5 w-5 shrink-0" />
                )}
                <span
                    className={cn(
                        'whitespace-nowrap font-medium',
                        'overflow-hidden inline-block',
                        'transition-[max-width,opacity,margin-left] duration-300 ease-in-out',
                        isHovered
                            ? 'max-w-[150px] opacity-100 ml-2 delay-150'
                            : 'max-w-0 opacity-0 ml-0'
                    )}
                >
                    {isEditMode ? 'Quitter' : 'Configuration'}
                </span>
            </div>
        </Button>
    )
}

