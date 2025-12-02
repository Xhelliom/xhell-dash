/**
 * API Route pour gérer une application spécifique
 * 
 * GET /api/apps/[id] : Récupère une application
 * PUT /api/apps/[id] : Met à jour une application
 * DELETE /api/apps/[id] : Supprime une application
 */

import { NextRequest, NextResponse } from 'next/server'
import { readApps, writeApps } from '@/lib/db'
import type { App, UpdateAppInput } from '@/lib/types'

/**
 * GET /api/apps/[id]
 * Récupère une application par son ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Lire les applications existantes
    const apps = await readApps()
    
    // Trouver l'application
    const app = apps.find((a) => a.id === id)
    
    if (!app) {
      return NextResponse.json(
        { error: 'Application non trouvée' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(app, { status: 200 })
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'app:', error)
    return NextResponse.json(
      { error: 'Impossible de récupérer l\'application' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/apps/[id]
 * Met à jour une application existante
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Récupérer les données du body
    const body: UpdateAppInput = await request.json()
    
    // Lire les applications existantes
    const apps = await readApps()
    
    // Trouver l'application à mettre à jour
    const appIndex = apps.findIndex((app) => app.id === id)
    
    if (appIndex === -1) {
      return NextResponse.json(
        { error: 'Application non trouvée' },
        { status: 404 }
      )
    }
    
    // Valider logoType si fourni
    if (body.logoType && body.logoType !== 'icon' && body.logoType !== 'url') {
      return NextResponse.json(
        { error: 'logoType doit être "icon" ou "url"' },
        { status: 400 }
      )
    }
    
    // Valider l'URL si fournie
    if (body.url) {
      try {
        new URL(body.url)
      } catch {
        return NextResponse.json(
          { error: 'URL invalide' },
          { status: 400 }
        )
      }
    }
    
    // Valider statApiUrl si fourni
    if (body.statApiUrl) {
      try {
        new URL(body.statApiUrl)
      } catch {
        return NextResponse.json(
          { error: 'statApiUrl invalide' },
          { status: 400 }
        )
      }
    }
    
    // Mettre à jour l'application
    const updatedApp: App = {
      ...apps[appIndex],
      ...body,
      // S'assurer que l'id ne change pas
      id: apps[appIndex].id,
    }
    
    apps[appIndex] = updatedApp
    
    // Sauvegarder
    await writeApps(apps)
    
    return NextResponse.json(updatedApp, { status: 200 })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'app:', error)
    return NextResponse.json(
      { error: 'Impossible de mettre à jour l\'application' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/apps/[id]
 * Supprime une application
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Lire les applications existantes
    const apps = await readApps()
    
    // Trouver l'application à supprimer
    const appIndex = apps.findIndex((app) => app.id === id)
    
    if (appIndex === -1) {
      return NextResponse.json(
        { error: 'Application non trouvée' },
        { status: 404 }
      )
    }
    
    // Supprimer l'application
    apps.splice(appIndex, 1)
    
    // Sauvegarder
    await writeApps(apps)
    
    return NextResponse.json({ message: 'Application supprimée' }, { status: 200 })
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'app:', error)
    return NextResponse.json(
      { error: 'Impossible de supprimer l\'application' },
      { status: 500 }
    )
  }
}

