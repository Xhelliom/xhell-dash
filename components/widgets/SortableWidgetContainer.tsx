/**
 * Composant SortableWidgetContainer
 * 
 * Wrapper draggable pour les widgets utilisant dnd-kit
 * Permet de rendre chaque widget draggable dans le dashboard en mode édition
 */

'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { ClockWidget } from './ClockWidget'
import { WeatherWidget } from './WeatherWidget'
import { SystemInfoWidget } from './SystemInfoWidget'
import type { Widget } from '@/lib/types'

interface SortableWidgetContainerProps {
    widget: Widget
    onEdit?: (widget: Widget) => void
    onDelete?: (widgetId: string) => void
    showActions?: boolean
    isDragging?: boolean
}

/**
 * Composant qui rend le bon widget selon son type
 */
function WidgetRenderer({ widget }: { widget: Widget }) {
    switch (widget.type) {
        case 'clock':
            return <ClockWidget config={widget.config} />
        case 'weather':
            return <WeatherWidget config={widget.config} />
        case 'system-info':
            return <SystemInfoWidget config={widget.config} />
        default:
            return null
    }
}

export function SortableWidgetContainer({
    widget,
    onEdit,
    onDelete,
    showActions,
    isDragging: globalIsDragging,
}: SortableWidgetContainerProps) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: localIsDragging,
    } = useSortable({ id: widget.id })

    const isDragging = globalIsDragging ?? localIsDragging

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        onEdit?.(widget)
    }

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        setIsDeleteDialogOpen(true)
    }

    const handleConfirmDelete = () => {
        onDelete?.(widget.id)
    }

    // Obtenir le nom du widget pour l'affichage
    const getWidgetName = () => {
        switch (widget.type) {
            case 'clock':
                return 'Horloge'
            case 'weather':
                return 'Météo'
            case 'system-info':
                return 'Informations système'
            default:
                return 'Widget'
        }
    }

    return (
        <div className="relative">
            {/* Barre d'actions au-dessus du widget - cachée pendant le drag */}
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

            {/* Widget draggable */}
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
            >
                <WidgetRenderer widget={widget} />
            </div>

            {/* Dialog de confirmation de suppression */}
            <DeleteConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleConfirmDelete}
                title="Supprimer le widget"
                description={`Êtes-vous sûr de vouloir supprimer le widget "${getWidgetName()}" ? Cette action est irréversible.`}
            />
        </div>
    )
}

