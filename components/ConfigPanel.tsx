/**
 * Composant ConfigPanel
 * 
 * Panneau de configuration permettant de :
 * - Voir la liste des applications
 * - Ajouter une nouvelle application
 * - Modifier une application existante
 * - Supprimer une application
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AppCard } from '@/components/AppCard'
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

  if (!open) return null

  return (
    <>
      {/* Overlay avec fond sombre */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Panneau latéral */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl bg-background shadow-lg overflow-y-auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Configuration</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Fermer
            </Button>
          </div>

          {/* Contenu */}
          <div className="flex-1 p-6">
            {/* Bouton d'ajout */}
            <div className="mb-6">
              <Button onClick={handleAdd} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une application
              </Button>
            </div>

            {/* Liste des applications */}
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">
                Chargement...
              </div>
            ) : apps.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Aucune application configurée. Cliquez sur "Ajouter une application" pour commencer.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {apps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    showActions={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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

