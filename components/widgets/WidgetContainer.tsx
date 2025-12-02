/**
 * Composant WidgetContainer
 * 
 * Conteneur générique pour afficher les widgets du dashboard
 * Gère l'affichage en grille et le rendu conditionnel selon le type de widget
 * Supporte le mode édition avec drag & drop
 */

'use client'

import { Widget } from '@/lib/types'
import { SortableWidgetContainer } from './SortableWidgetContainer'
import { ClockWidget } from './ClockWidget'
import { WeatherWidget } from './WeatherWidget'
import { SystemInfoWidget } from './SystemInfoWidget'

interface WidgetContainerProps {
    widgets: Widget[]
    isEditMode?: boolean
    onEdit?: (widget: Widget) => void
    onDelete?: (widgetId: string) => void
    isDragging?: boolean
}

/**
 * Composant qui rend le bon widget selon son type (pour le mode normal)
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

/**
 * Composant qui affiche tous les widgets
 */
export function WidgetContainer({
    widgets,
    isEditMode = false,
    onEdit,
    onDelete,
    isDragging = false,
}: WidgetContainerProps) {
    // En mode normal, filtrer uniquement les widgets activés
    // En mode édition, afficher tous les widgets
    const displayWidgets = isEditMode
        ? widgets.sort((a, b) => (a.order || 0) - (b.order || 0))
        : widgets
            .filter(widget => widget.enabled)
            .sort((a, b) => (a.order || 0) - (b.order || 0))

    if (displayWidgets.length === 0) {
        return null
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {displayWidgets.map((widget) =>
                isEditMode ? (
                    <SortableWidgetContainer
                        key={widget.id}
                        widget={widget}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        showActions={true}
                        isDragging={isDragging}
                    />
                ) : (
                    <WidgetRenderer key={widget.id} widget={widget} />
                )
            )}
        </div>
    )
}

