/**
 * Composant ConfigPanel
 * 
 * Panneau de configuration utilisant le composant Sheet de shadcn/ui
 * Affiche une liste d'applications pour une meilleure UX de configuration
 * 
 * Permet de :
 * - Voir la liste des applications
 * - Ajouter une nouvelle application
 * - Modifier une application existante
 * - Supprimer une application
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { AppListItem } from '@/components/AppListItem'
import { AppForm } from '@/components/AppForm'
import { Plus, Settings } from 'lucide-react'
import type { App, CreateAppInput } from '@/lib/types'

interface ConfigPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConfigPanel({ open, onOpenChange }: ConfigPanelProps) {
  const [apps, setApps] = useState<App[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<App | null>(null)

  /**
   * Charge la liste des applications depuis l'API
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

  // Charger les apps au montage et quand le panel s'ouvre
  useEffect(() => {
    if (open) {
      loadApps()
    }
  }, [open])

  /**
   * Gère l'ajout d'une nouvelle application
   */
  const handleAdd = () => {
    setEditingApp(null)
    setIsFormOpen(true)
  }

  /**
   * Gère l'édition d'une application
   */
  const handleEdit = (app: App) => {
    setEditingApp(app)
    setIsFormOpen(true)
  }

  /**
   * Gère la suppression d'une application
   */
  const handleDelete = async (appId: string) => {
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
   * Gère la soumission du formulaire (création ou modification)
   */
  const handleFormSubmit = async (data: CreateAppInput) => {
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

      // Recharger la liste après modification/création
      await loadApps()
      setIsFormOpen(false)
    } catch (error: any) {
      throw error // Propager l'erreur pour qu'AppForm puisse l'afficher
    }
  }

  return (
    <>
      {/* Panneau latéral avec animations fluides via Sheet */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-lg overflow-y-auto"
        >
          {/* Header avec titre */}
          <SheetHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <SheetTitle>Configuration</SheetTitle>
            </div>
            <SheetDescription>
              Gérez vos applications et leurs raccourcis
            </SheetDescription>
          </SheetHeader>

          {/* Contenu scrollable avec padding horizontal */}
          <div className="px-4 pb-4 space-y-4">
            {/* Bouton d'ajout */}
            <Button onClick={handleAdd} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une application
            </Button>

            {/* Liste des applications */}
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">
                Chargement...
              </div>
            ) : apps.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 border rounded-lg px-4">
                <p className="mb-2 font-medium">Aucune application</p>
                <p className="text-sm">
                  Cliquez sur "Ajouter une application" pour commencer.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {apps.map((app) => (
                  <AppListItem
                    key={app.id}
                    app={app}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Formulaire d'ajout/modification */}
      <AppForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        app={editingApp}
        onSubmit={handleFormSubmit}
      />
    </>
  )
}
