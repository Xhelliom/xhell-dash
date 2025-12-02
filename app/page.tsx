/**
 * Page Dashboard principale
 * 
 * Affiche une grille de cards représentant les applications configurées
 * Permet d'ouvrir le panneau de configuration pour gérer les applications
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AppCard } from '@/components/AppCard'
import { ConfigPanel } from '@/components/ConfigPanel'
import { Settings } from 'lucide-react'
import type { App } from '@/lib/types'

export default function Home() {
  const [apps, setApps] = useState<App[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConfigOpen, setIsConfigOpen] = useState(false)

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

  // Charger les apps au montage du composant
  useEffect(() => {
    loadApps()
  }, [])

  // Recharger les apps quand le panneau de config se ferme
  useEffect(() => {
    if (!isConfigOpen) {
      loadApps()
    }
  }, [isConfigOpen])

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec titre et bouton de configuration */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button
            variant="outline"
            onClick={() => setIsConfigOpen(true)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Configuration
          </Button>
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
            <Button onClick={() => setIsConfigOpen(true)}>
              Ajouter une application
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {apps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </main>

      {/* Panneau de configuration */}
      <ConfigPanel open={isConfigOpen} onOpenChange={setIsConfigOpen} />
    </div>
  )
}
