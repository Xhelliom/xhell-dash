/**
 * Page de configuration des applications
 * 
 * Page principale pour configurer une application avec navigation par sidebar
 */

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { ConfigForm } from '@/components/config/ConfigForm'
import type { App } from '@/lib/types'

function ConfigPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const appId = searchParams.get('id')
  const [app, setApp] = useState<App | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Charge l'application à configurer depuis l'API
   */
  useEffect(() => {
    const loadApp = async () => {
      if (!appId) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/apps/${appId}`)
        if (response.ok) {
          const data = await response.json()
          setApp(data)
        } else {
          console.error('Erreur lors du chargement de l\'application')
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'application:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadApp()
  }, [appId])

  /**
   * Gère la soumission du formulaire
   */
  const handleSubmit = async (data: any) => {
    try {
      if (app) {
        // Mode modification
        const response = await fetch(`/api/apps/${app.id}`, {
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

      // Rediriger vers la page principale après succès
      router.push('/')
    } catch (error: any) {
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b bg-card px-6 py-4">
        <h1 className="text-2xl font-bold">
          {app ? `Modifier ${app.name}` : 'Nouvelle application'}
        </h1>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        <ConfigForm app={app} onSubmit={handleSubmit} />
      </main>
    </div>
  )
}

export default function ConfigPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    }>
      <ConfigPageContent />
    </Suspense>
  )
}

