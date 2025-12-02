/**
 * Page Dashboard principale
 * 
 * Affiche une grille de cards représentant les applications configurées
 * Permet d'ouvrir le panneau de configuration pour gérer les applications
 * Mode édition : drag & drop pour réordonner, boutons d'édition, ajout d'apps
 */

'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { AppCard } from '@/components/AppCard'
import { SortableAppCard } from '@/components/SortableAppCard'
import { FloatingConfigButton } from '@/components/FloatingConfigButton'
import { AppForm } from '@/components/AppForm'
import { WidgetContainer } from '@/components/widgets/WidgetContainer'
import { WidgetForm } from '@/components/widgets/WidgetForm'
import { SortableWidgetContainer } from '@/components/widgets/SortableWidgetContainer'
import type { Widget } from '@/lib/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Plus } from 'lucide-react'
import type { App, CreateAppInput } from '@/lib/types'

export default function Home() {
  const [apps, setApps] = useState<App[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isAppFormOpen, setIsAppFormOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<App | null>(null)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [isWidgetFormOpen, setIsWidgetFormOpen] = useState(false)
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null)
  const [isSavingWidgetOrder, setIsSavingWidgetOrder] = useState(false)
  const [isDraggingWidget, setIsDraggingWidget] = useState(false)

  // Configuration des capteurs pour le drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  /**
   * Charge la liste des applications depuis l'API
   * Les apps sont déjà triées par ordre côté serveur (dans db.ts)
   */
  const loadApps = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/apps')
      if (response.ok) {
        const data = await response.json()
        setApps(data)
      } else {
        console.error('Erreur lors du chargement des apps')
      }
    } catch (error) {
      console.error('Erreur lors du chargement des apps:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Charge la liste des widgets depuis l'API
   */
  const loadWidgets = async () => {
    try {
      const response = await fetch('/api/widgets')
      if (response.ok) {
        const data = await response.json()
        setWidgets(data)
      } else {
        console.error('Erreur lors du chargement des widgets')
      }
    } catch (error) {
      console.error('Erreur lors du chargement des widgets:', error)
    }
  }

  /**
   * Gère le début du drag & drop pour les apps
   * Masque tous les boutons d'édition
   */
  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true)
  }

  /**
   * Gère le début du drag & drop pour les widgets
   */
  const handleWidgetDragStart = (event: DragStartEvent) => {
    setIsDraggingWidget(true)
  }

  /**
   * Gère la fin du drag & drop pour les apps
   * Met à jour l'ordre localement et sauvegarde via l'API
   */
  const handleDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false)
    
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    // Trouver les indices des apps déplacées
    const oldIndex = apps.findIndex((app) => app.id === active.id)
    const newIndex = apps.findIndex((app) => app.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    // Réordonner localement
    const reorderedApps = arrayMove(apps, oldIndex, newIndex)
    setApps(reorderedApps)

    // Sauvegarder le nouvel ordre via l'API
    setIsSavingOrder(true)
    try {
      const response = await fetch('/api/apps/reorder', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appIds: reorderedApps.map((app) => app.id),
        }),
      })

      if (!response.ok) {
        // En cas d'erreur, recharger les apps pour restaurer l'ordre
        console.error('Erreur lors de la sauvegarde de l\'ordre')
        await loadApps()
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'ordre:', error)
      // En cas d'erreur, recharger les apps pour restaurer l'ordre
      await loadApps()
    } finally {
      setIsSavingOrder(false)
    }
  }

  /**
   * Gère la fin du drag & drop pour les widgets
   */
  const handleWidgetDragEnd = async (event: DragEndEvent) => {
    setIsDraggingWidget(false)
    
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    // Trouver les indices des widgets déplacés
    const oldIndex = widgets.findIndex((widget) => widget.id === active.id)
    const newIndex = widgets.findIndex((widget) => widget.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    // Réordonner localement
    const reorderedWidgets = arrayMove(widgets, oldIndex, newIndex)
    setWidgets(reorderedWidgets)

    // Sauvegarder le nouvel ordre via l'API
    setIsSavingWidgetOrder(true)
    try {
      const response = await fetch('/api/widgets/reorder', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          widgetIds: reorderedWidgets.map((widget) => widget.id),
        }),
      })

      if (!response.ok) {
        console.error('Erreur lors de la sauvegarde de l\'ordre des widgets')
        await loadWidgets()
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'ordre des widgets:', error)
      await loadWidgets()
    } finally {
      setIsSavingWidgetOrder(false)
    }
  }

  /**
   * Gère l'ajout d'une nouvelle application
   */
  const handleAddApp = () => {
    setEditingApp(null)
    setIsAppFormOpen(true)
  }

  /**
   * Gère l'édition d'une application
   */
  const handleEditApp = (app: App) => {
    setEditingApp(app)
    setIsAppFormOpen(true)
  }

  /**
   * Gère la suppression d'une application
   */
  const handleDeleteApp = async (appId: string) => {
    try {
      const response = await fetch(`/api/apps/${appId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Recharger la liste après suppression
        await loadApps()
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error || 'Impossible de supprimer l\'application'}`)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Une erreur est survenue lors de la suppression')
    }
  }

  /**
   * Gère la soumission du formulaire d'application
   */
  const handleAppFormSubmit = async (data: CreateAppInput) => {
    try {
      if (editingApp) {
        // Mode modification
        const response = await fetch(`/api/apps/${editingApp.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erreur lors de la modification')
        }
      } else {
        // Mode création
        const response = await fetch('/api/apps', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erreur lors de la création')
        }
      }

      // Fermer le formulaire et recharger les apps
      setIsAppFormOpen(false)
      setEditingApp(null)
      await loadApps()
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Gère l'ajout d'un nouveau widget
   */
  const handleAddWidget = () => {
    setEditingWidget(null)
    setIsWidgetFormOpen(true)
  }

  /**
   * Gère l'édition d'un widget
   */
  const handleEditWidget = (widget: Widget) => {
    setEditingWidget(widget)
    setIsWidgetFormOpen(true)
  }

  /**
   * Gère la suppression d'un widget
   */
  const handleDeleteWidget = async (widgetId: string) => {
    try {
      const response = await fetch(`/api/widgets/${widgetId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadWidgets()
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error || 'Impossible de supprimer le widget'}`)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Une erreur est survenue lors de la suppression')
    }
  }

  /**
   * Gère la soumission du formulaire de widget
   */
  const handleWidgetFormSubmit = async (data: Partial<Widget>) => {
    try {
      if (editingWidget) {
        // Mode modification
        const response = await fetch(`/api/widgets/${editingWidget.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erreur lors de la modification')
        }
      } else {
        // Mode création
        const response = await fetch('/api/widgets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erreur lors de la création')
        }
      }

      // Fermer le formulaire et recharger les widgets
      setIsWidgetFormOpen(false)
      setEditingWidget(null)
      await loadWidgets()
    } catch (error: any) {
      throw error
    }
  }

  // Charger les apps et widgets au montage du composant
  useEffect(() => {
    loadApps()
    loadWidgets()
  }, [])

  // Toggle du mode édition depuis le bouton flottant
  useEffect(() => {
    const handleEditModeToggle = () => {
      setIsEditMode((prev) => !prev)
    }

    // Écouter l'événement personnalisé pour toggle le mode édition
    window.addEventListener('toggleEditMode', handleEditModeToggle)

    return () => {
      window.removeEventListener('toggleEditMode', handleEditModeToggle)
    }
  }, [])

  // IDs des apps et widgets pour le SortableContext
  const appIds = apps.map((app) => app.id)
  const widgetIds = widgets.map((widget) => widget.id)

  return (
    <div className="min-h-screen bg-background">
      {/* Contenu principal */}
      <main className="container mx-auto px-4 py-8">
        {/* Section des widgets avec drag & drop en mode édition */}
        {isEditMode ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleWidgetDragStart}
            onDragEnd={handleWidgetDragEnd}
          >
            <SortableContext items={widgetIds}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {widgets.map((widget) => (
                  <SortableWidgetContainer
                    key={widget.id}
                    widget={widget}
                    onEdit={handleEditWidget}
                    onDelete={handleDeleteWidget}
                    showActions={true}
                    isDragging={isDraggingWidget}
                  />
                ))}
                {/* Bouton + pour ajouter un widget en mode édition */}
                <div className="flex items-center justify-center min-h-[200px] border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 transition-colors">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleAddWidget}
                    className="h-full w-full flex flex-col gap-2"
                  >
                    <Plus className="h-8 w-8" />
                    <span>Ajouter un widget</span>
                  </Button>
                </div>
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <WidgetContainer widgets={widgets} />
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-muted-foreground">Chargement...</div>
          </div>
        ) : apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg text-muted-foreground mb-4">
              Aucune application configurée
            </p>
            <Button onClick={handleAddApp}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une application
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={appIds}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {apps.map((app) =>
                  isEditMode ? (
                    <SortableAppCard
                      key={app.id}
                      app={app}
                      onEdit={handleEditApp}
                      onDelete={handleDeleteApp}
                      showActions={true}
                      isDragging={isDragging}
                    />
                  ) : (
                    <AppCard key={app.id} app={app} />
                  )
                )}
                {/* Bouton + pour ajouter une app en mode édition */}
                {isEditMode && (
                  <div className="flex items-center justify-center min-h-[200px] border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 transition-colors">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleAddApp}
                      className="h-full w-full flex flex-col gap-2"
                    >
                      <Plus className="h-8 w-8" />
                      <span>Ajouter une application</span>
                    </Button>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        )}
        {isSavingOrder && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg text-sm">
            Sauvegarde de l'ordre...
          </div>
        )}
      </main>

      {/* Bouton flottant de configuration */}
      <FloatingConfigButton isEditMode={isEditMode} />

      {/* Sheet avec AppForm pour ajouter/éditer */}
      <Sheet open={isAppFormOpen} onOpenChange={setIsAppFormOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-hidden p-0 flex flex-col">
          <SheetHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
            <SheetTitle>
              {editingApp ? 'Modifier l\'application' : 'Ajouter une application'}
            </SheetTitle>
            <SheetDescription>
              {editingApp
                ? 'Modifiez les informations de l\'application'
                : 'Remplissez les informations pour ajouter une nouvelle application au dashboard'}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <AppForm
              open={isAppFormOpen}
              onOpenChange={setIsAppFormOpen}
              app={editingApp}
              onSubmit={handleAppFormSubmit}
              asSheet={true}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet avec WidgetForm pour ajouter/éditer */}
      <Sheet open={isWidgetFormOpen} onOpenChange={setIsWidgetFormOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-hidden p-0 flex flex-col">
          <SheetHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
            <SheetTitle>
              {editingWidget ? 'Modifier le widget' : 'Ajouter un widget'}
            </SheetTitle>
            <SheetDescription>
              {editingWidget
                ? 'Modifiez la configuration du widget'
                : 'Configurez un nouveau widget pour votre dashboard'}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <WidgetForm
              widget={editingWidget}
              onSubmit={handleWidgetFormSubmit}
              onCancel={() => {
                setIsWidgetFormOpen(false)
                setEditingWidget(null)
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
