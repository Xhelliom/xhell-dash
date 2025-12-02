/**
 * Composant SortableAppCard
 * 
 * Wrapper draggable pour AppCard utilisant dnd-kit
 * Permet de rendre chaque card draggable dans le dashboard en mode édition
 * Les boutons d'action sont placés au-dessus de la card pour éviter les conflits avec le drag & drop
 */

'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { AppCard } from './AppCard'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import type { App } from '@/lib/types'

interface SortableAppCardProps {
  app: App
  onEdit?: (app: App) => void
  onDelete?: (appId: string) => void
  showActions?: boolean
  isDragging?: boolean // État global du drag (depuis le DndContext parent)
}

/**
 * Composant AppCard rendu draggable avec dnd-kit
 * Les boutons d'action sont placés au-dessus de la card pour éviter les conflits
 * Les boutons sont cachés pendant le drag (global) et ont un curseur pointer
 */
export function SortableAppCard({ app, onEdit, onDelete, showActions, isDragging: globalIsDragging }: SortableAppCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: localIsDragging,
  } = useSortable({ id: app.id })

  // Utiliser l'état global du drag si fourni, sinon utiliser l'état local
  const isDragging = globalIsDragging ?? localIsDragging

  // Styles pour la transformation lors du drag
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  /**
   * Gère le clic sur le bouton d'édition
   * Stop la propagation pour éviter de déclencher le drag
   */
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onEdit?.(app)
  }

  /**
   * Gère le clic sur le bouton de suppression
   * Stop la propagation pour éviter de déclencher le drag
   */
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsDeleteDialogOpen(true)
  }

  /**
   * Confirme la suppression
   */
  const handleConfirmDelete = () => {
    onDelete?.(app.id)
  }

  return (
    <div className="relative">
      {/* Barre d'actions au-dessus de la card - cachée pendant le drag */}
      {showActions && !isDragging && (
        <div 
          className="absolute -top-2 right-2 z-20 flex gap-1"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleEdit}
              onMouseDown={(e) => e.stopPropagation()}
              className="h-8 w-8 p-0 shadow-md cursor-pointer hover:bg-secondary/80"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteClick}
              onMouseDown={(e) => e.stopPropagation()}
              className="h-8 w-8 p-0 shadow-md cursor-pointer hover:bg-destructive/80"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      
      {/* Card draggable */}
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
      >
        <AppCard
          app={app}
          onEdit={undefined}
          onDelete={undefined}
          showActions={false}
        />
      </div>

      {/* Dialog de confirmation de suppression */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Supprimer l'application"
        description={`Êtes-vous sûr de vouloir supprimer "${app.name}" ? Cette action est irréversible.`}
      />
    </div>
  )
}

