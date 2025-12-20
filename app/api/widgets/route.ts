/**
 * API Route pour gérer les widgets
 * 
 * GET : Récupère la liste de tous les widgets
 * POST : Crée un nouveau widget
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { readWidgets, writeWidgets, generateWidgetId } from '@/lib/db'
import type { Widget, WidgetType } from '@/lib/types'

/**
 * GET /api/widgets
 * Retourne la liste de tous les widgets
 */
export async function GET() {
  try {
    const widgets = await readWidgets()
    return NextResponse.json(widgets, { status: 200 })
  } catch (error) {
    console.error('Erreur lors de la lecture des widgets:', error)
    return NextResponse.json(
      { error: 'Impossible de récupérer les widgets' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/widgets
 * Crée un nouveau widget (admin seulement)
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification et le rôle admin
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // @ts-expect-error - champ custom role
    const userRole = session.user.role as string | undefined

    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé. Administrateur requis.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Valider les champs requis
    if (!body.type || !['clock', 'weather', 'system-info'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Type de widget invalide' },
        { status: 400 }
      )
    }
    
    // Lire les widgets existants
    const widgets = await readWidgets()
    
    // Déterminer l'ordre du nouveau widget
    let order = 1
    if (widgets.length > 0) {
      const maxOrder = Math.max(...widgets.map(w => w.order || 0))
      order = maxOrder + 1
    }
    
    // Créer le nouveau widget
    const newWidget: Widget = {
      id: generateWidgetId(),
      type: body.type as WidgetType,
      enabled: body.enabled !== undefined ? body.enabled : true,
      config: body.config || {},
      order,
    }
    
    // Ajouter à la liste
    widgets.push(newWidget)
    
    // Sauvegarder
    await writeWidgets(widgets)
    
    return NextResponse.json(newWidget, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du widget:', error)
    return NextResponse.json(
      { error: 'Impossible de créer le widget' },
      { status: 500 }
    )
  }
}

