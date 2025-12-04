/**
 * Composant BackgroundConfigButton
 * 
 * Bouton flottant pour ouvrir le panneau de configuration du background
 * Apparaît uniquement en mode édition, au-dessus du bouton de configuration
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BackgroundConfigButtonProps {
  /**
   * Callback appelé quand on clique sur le bouton
   */
  onClick: () => void
  /**
   * Classes CSS additionnelles
   */
  className?: string
}

/**
 * Bouton flottant pour configurer le background
 */
export function BackgroundConfigButton({
  onClick,
  className,
}: BackgroundConfigButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={onClick}
      className={cn(
        'h-14 rounded-full shadow-lg',
        'transition-[width,padding] duration-300 ease-in-out',
        'flex items-center',
        'overflow-hidden',
        // Centrer quand replié, aligner à gauche quand agrandi
        isHovered ? 'justify-start px-4' : 'justify-center px-0',
        // Largeur qui s'anime depuis le centre
        isHovered ? 'w-[160px]' : 'w-14',
        className
      )}
      aria-label="Configurer le background"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          'flex items-center',
          isHovered ? 'justify-start' : 'justify-center w-full'
        )}
      >
        <Palette className="h-5 w-5 shrink-0" />
        <span
          className={cn(
            'whitespace-nowrap font-medium',
            'overflow-hidden inline-block',
            'transition-[max-width,opacity,margin-left] duration-300 ease-in-out',
            isHovered
              ? 'max-w-[130px] opacity-100 ml-2 delay-150'
              : 'max-w-0 opacity-0 ml-0'
          )}
        >
          Background
        </span>
      </div>
    </Button>
  )
}


