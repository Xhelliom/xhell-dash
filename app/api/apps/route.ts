/**
 * API Route pour gérer les applications
 * 
 * GET : Récupère la liste de toutes les applications
 * POST : Crée une nouvelle application
 */

import { NextRequest, NextResponse } from 'next/server'
import { readApps, writeApps, generateAppId } from '@/lib/db'
import type { App, CreateAppInput } from '@/lib/types'

/**
 * GET /api/apps
 * Retourne la liste de toutes les applications
 */
export async function GET() {
  try {
    const apps = await readApps()
    return NextResponse.json(apps, { status: 200 })
  } catch (error) {
    console.error('Erreur lors de la lecture des apps:', error)
    return NextResponse.json(
      { error: 'Impossible de récupérer les applications' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/apps
 * Crée une nouvelle application
 * 
 * Body attendu :
 * {
 *   name: string
 *   url: string
 *   logo: string
 *   logoType: 'icon' | 'url'
 *   statApiUrl?: string
 *   statLabel?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Récupérer les données du body
    const body: CreateAppInput = await request.json()
    
    // Valider les champs obligatoires
    if (!body.name || !body.url || !body.logo || !body.logoType) {
      return NextResponse.json(
        { error: 'Les champs name, url, logo et logoType sont obligatoires' },
        { status: 400 }
      )
    }
    
    // Valider le logoType
    if (body.logoType !== 'icon' && body.logoType !== 'url') {
      return NextResponse.json(
        { error: 'logoType doit être "icon" ou "url"' },
        { status: 400 }
      )
    }
    
    // Valider l'URL
    try {
      new URL(body.url)
    } catch {
      return NextResponse.json(
        { error: 'URL invalide' },
        { status: 400 }
      )
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
    
    // Lire les applications existantes
    const apps = await readApps()
    
    // Créer la nouvelle application
    const newApp: App = {
      id: generateAppId(),
      name: body.name,
      url: body.url,
      logo: body.logo,
      logoType: body.logoType,
      statApiUrl: body.statApiUrl,
      statLabel: body.statLabel,
    }
    
    // Ajouter à la liste
    apps.push(newApp)
    
    // Sauvegarder
    await writeApps(apps)
    
    return NextResponse.json(newApp, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de l\'app:', error)
    return NextResponse.json(
      { error: 'Impossible de créer l\'application' },
      { status: 500 }
    )
  }
}

