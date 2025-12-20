/**
 * API Route pour gérer un widget spécifique
 * 
 * GET : Récupère un widget par son ID
 * PUT : Met à jour un widget
 * DELETE : Supprime un widget
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { readWidgets, writeWidgets } from '@/lib/db'
import type { Widget } from '@/lib/types'

/**
 * GET /api/widgets/[id]
 * Retourne un widget spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const widgets = await readWidgets()
    const widget = widgets.find(w => w.id === id)
    
    if (!widget) {
      return NextResponse.json(
        { error: 'Widget non trouvé' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(widget, { status: 200 })
  } catch (error) {
    console.error('Erreur lors de la lecture du widget:', error)
    return NextResponse.json(
      { error: 'Impossible de récupérer le widget' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/widgets/[id]
 * Met à jour un widget (admin seulement)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()
    
    const widgets = await readWidgets()
    const widgetIndex = widgets.findIndex(w => w.id === id)
    
    if (widgetIndex === -1) {
      return NextResponse.json(
        { error: 'Widget non trouvé' },
        { status: 404 }
      )
    }
    
    // Mettre à jour le widget
    widgets[widgetIndex] = {
      ...widgets[widgetIndex],
      ...body,
      id, // S'assurer que l'ID ne change pas
    }
    
    // Sauvegarder
    await writeWidgets(widgets)
    
    return NextResponse.json(widgets[widgetIndex], { status: 200 })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du widget:', error)
    return NextResponse.json(
      { error: 'Impossible de mettre à jour le widget' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/widgets/[id]
 * Supprime un widget (admin seulement)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const widgets = await readWidgets()
    const filteredWidgets = widgets.filter(w => w.id !== id)
    
    if (filteredWidgets.length === widgets.length) {
      return NextResponse.json(
        { error: 'Widget non trouvé' },
        { status: 404 }
      )
    }
    
    // Sauvegarder
    await writeWidgets(filteredWidgets)
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Erreur lors de la suppression du widget:', error)
    return NextResponse.json(
      { error: 'Impossible de supprimer le widget' },
      { status: 500 }
    )
  }
}

