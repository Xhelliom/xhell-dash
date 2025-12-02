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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Plus, Edit } from 'lucide-react'
import type { App, CreateAppInput } from '@/lib/types'

export default function Home() {
  const [apps, setApps] = useState<App[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isAppFormOpen, setIsAppFormOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<App | null>(null)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

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
   * Gère le début du drag & drop
   * Masque tous les boutons d'édition
   */
  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true)
  }

  /**
   * Gère la fin du drag & drop
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

  // Charger les apps au montage du composant
  useEffect(() => {
    loadApps()
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

  // IDs des apps pour le SortableContext
  const appIds = apps.map((app) => app.id)

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec titre */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            {isEditMode && (
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                <Edit className="h-4 w-4" />
                Mode édition
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="container mx-auto px-4 py-8">
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
    </div>
  )
}
