/**
 * Composant WidgetListItem
 * 
 * Affiche un widget dans une liste pour le panneau de configuration
 */

'use client'

import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Clock, Cloud, Server } from 'lucide-react'
import type { Widget } from '@/lib/types'

interface WidgetListItemProps {
    widget: Widget
    onEdit: (widget: Widget) => void
    onDelete: (widgetId: string) => void
}

/**
 * Retourne l'icône et le nom du type de widget
 */
function getWidgetInfo(type: string) {
    switch (type) {
        case 'clock':
            return { icon: Clock, name: 'Horloge' }
        case 'weather':
            return { icon: Cloud, name: 'Météo' }
        case 'system-info':
            return { icon: Server, name: 'Système' }
        default:
            return { icon: Clock, name: 'Widget' }
    }
}

export function WidgetListItem({ widget, onEdit, onDelete }: WidgetListItemProps) {
    const { icon: Icon, name } = getWidgetInfo(widget.type)

    /**
     * Gère la suppression avec confirmation
     */
    const handleDelete = () => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer le widget "${name}" ?`)) {
            onDelete(widget.id)
        }
    }

    return (
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
            {/* Informations du widget */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Icône */}
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                </div>

                {/* Nom et statut */}
                <div className="flex-1 min-w-0">
                    <div className="font-medium">{name}</div>
                    <div className="text-sm text-muted-foreground">
                        {widget.enabled ? 'Activé' : 'Désactivé'}
                    </div>
                    {widget.config && Object.keys(widget.config).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                            Configuré
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(widget)}
                    className="h-8 w-8 p-0"
                    title="Modifier"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    title="Supprimer"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

