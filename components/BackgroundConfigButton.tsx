/**
 * Composant BackgroundConfigButton
 * 
 * Bouton flottant pour ouvrir le panneau de configuration des paramètres
 * Apparaît uniquement en mode édition, au-dessus du bouton de configuration
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, Save, Loader2 } from 'lucide-react'
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
  /**
   * Si true, le bouton affiche "Sauvegarder" au lieu de "Paramètres"
   */
  isSaveMode?: boolean
  /**
   * Fonction de sauvegarde à appeler en mode save
   */
  onSave?: () => Promise<void>
  /**
   * État de chargement pour le bouton sauvegarder
   */
  isSaving?: boolean
}

/**
 * Bouton flottant pour configurer les paramètres
 * Peut se transformer en bouton "Sauvegarder" quand le drawer est ouvert
 * Gère son propre état pour éviter les conflits après la sauvegarde
 */
export function BackgroundConfigButton({
  onClick,
  className,
  isSaveMode = false,
  onSave,
  isSaving = false,
}: BackgroundConfigButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false) // Bloque les interactions après sauvegarde
  const justSavedRef = useRef(false)
  // IMPORTANT:
  // Quand le Sheet (Radix) est ouvert, un clic sur ce bouton est considéré comme un clic "outside"
  // et peut déclencher une fermeture via un `pointerdown` AVANT l'événement `click`.
  // Résultat: le composant re-render, `isSaveMode` peut passer à false, et le même clic peut être
  // interprété comme un clic "ouvrir" → fermeture puis réouverture (le bug décrit).
  // On mémorise donc l'intention (save vs open) au pointerdown pour la rendre stable.
  const clickIntentRef = useRef<'save' | 'open' | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Surveiller les changements d'état pour détecter la fin de sauvegarde
  useEffect(() => {
    // Si on est en train de sauvegarder, marquer qu'on va sauvegarder
    if (isSaving) {
      justSavedRef.current = true
      setIsBlocked(true)
      return
    }

    // Si on vient de finir de sauvegarder (isSaving passe de true à false)
    // et qu'on n'est plus en mode save, on vient de sauvegarder et fermer
    if (!isSaving && !isSaveMode && justSavedRef.current) {
      // Bloquer temporairement pour éviter les interactions accidentelles
      setIsBlocked(true)
      // Nettoyer le timeout précédent si il existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      // Débloquer après 1500ms (délai plus long pour être sûr)
      timeoutRef.current = setTimeout(() => {
        setIsBlocked(false)
        justSavedRef.current = false
      }, 1500)
    }

    // Si on revient en mode save, NE PAS réinitialiser justSavedRef immédiatement
    // Cela permettrait au drawer de se rouvrir accidentellement
    // Seulement réinitialiser le blocage si on n'a pas juste sauvegardé
    if (isSaveMode && !justSavedRef.current) {
      setIsBlocked(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    // Nettoyage
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isSaving, isSaveMode])

  /**
   * Gère le clic sur le bouton
   * En mode save, appelle la fonction de sauvegarde
   * Sinon, ouvre le panneau de configuration
   */
  const handleClick = async (e: React.MouseEvent) => {
    // Empêcher la propagation pour éviter les événements indésirables
    e.preventDefault()
    e.stopPropagation()
    
    // Si le bouton est bloqué, ne rien faire
    if (isBlocked) {
      return
    }

    // Utiliser l'intention capturée au pointerdown si disponible.
    // Cela évite qu'un re-render entre pointerdown et click ne change le comportement.
    const intent =
      clickIntentRef.current ??
      ((isSaveMode && onSave) ? 'save' : 'open')

    // Réinitialiser après consommation (évite les effets de bord au clic suivant)
    clickIntentRef.current = null

    if (intent === 'save' && onSave) {
      await onSave()
      return
    }

    onClick()
  }

  // Déterminer le texte et les styles selon le mode
  const buttonText = isSaveMode ? 'Sauvegarder' : 'Paramètres'
  const buttonLabel = isSaveMode ? 'Sauvegarder les paramètres' : 'Configurer les paramètres'
  const buttonWidth = isSaveMode ? 'w-[180px]' : 'w-[160px]'
  const maxTextWidth = isSaveMode ? 'max-w-[150px]' : 'max-w-[130px]'

  return (
    <Button
      variant={isSaveMode ? "default" : "secondary"}
      size="icon"
      onPointerDown={() => {
        // Capturer l'intention le plus tôt possible (avant que Radix/Sheet ne modifie `open`)
        if (isBlocked) return
        clickIntentRef.current = (isSaveMode && onSave) ? 'save' : 'open'
      }}
      onClick={handleClick}
      disabled={isSaving || isBlocked}
      className={cn(
        'h-14 rounded-full shadow-lg',
        'transition-[width,padding] duration-300 ease-in-out',
        'flex items-center',
        'overflow-hidden',
        isBlocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        // Centrer quand replié, aligner à gauche quand agrandi
        isHovered ? 'justify-start px-4' : 'justify-center px-0',
        // Largeur qui s'anime depuis le centre
        isHovered ? buttonWidth : 'w-14',
        className
      )}
      aria-label={buttonLabel}
      onMouseEnter={() => !isBlocked && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          'flex items-center',
          isHovered ? 'justify-start' : 'justify-center w-full'
        )}
      >
        {isSaving ? (
          <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
        ) : isSaveMode ? (
          <Save className="h-5 w-5 shrink-0" />
        ) : (
          <Settings className="h-5 w-5 shrink-0" />
        )}
        <span
          className={cn(
            'whitespace-nowrap font-medium',
            'overflow-hidden inline-block',
            'transition-[max-width,opacity,margin-left] duration-300 ease-in-out',
            isHovered
              ? `${maxTextWidth} opacity-100 ml-2 delay-150`
              : 'max-w-0 opacity-0 ml-0'
          )}
        >
          {isSaving ? 'Sauvegarde...' : buttonText}
        </span>
      </div>
    </Button>
  )
}


