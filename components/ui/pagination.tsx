/**
 * Composant Pagination
 * 
 * Composant de pagination réutilisable pour les listes
 * Basé sur shadcn/ui avec support de la navigation précédent/suivant
 */

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Props pour le composant Pagination
 */
interface PaginationProps {
  /** Page actuelle (commence à 1) */
  currentPage: number
  /** Nombre total de pages */
  totalPages: number
  /** Fonction appelée quand la page change */
  onPageChange: (page: number) => void
  /** Nombre d'éléments par page */
  itemsPerPage: number
  /** Nombre total d'éléments */
  totalItems: number
  /** Classe CSS supplémentaire */
  className?: string
}

/**
 * Composant Pagination
 * 
 * Affiche les contrôles de pagination avec navigation précédent/suivant
 * et indicateur de page actuelle
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  className,
}: PaginationProps) {
  // Calculer les informations d'affichage
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Ne rien afficher si une seule page
  if (totalPages <= 1) {
    return null
  }

  return (
    <div className={cn("flex items-center justify-between px-2", className)}>
      <div className="text-sm text-muted-foreground">
        Affichage de {startItem} à {endItem} sur {totalItems} résultat{totalItems > 1 ? 's' : ''}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Page précédente</span>
        </Button>
        
        <div className="flex items-center gap-1">
          {/* Afficher les numéros de page */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number
            
            // Calculer quelles pages afficher selon la page actuelle
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (currentPage <= 3) {
              pageNum = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = currentPage - 2 + i
            }
            
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className="h-8 w-8 p-0"
              >
                {pageNum}
              </Button>
            )
          })}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Page suivante</span>
        </Button>
      </div>
    </div>
  )
}

