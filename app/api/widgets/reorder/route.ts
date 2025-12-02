/**
 * API Route pour réordonner les widgets
 * 
 * PATCH : Met à jour l'ordre des widgets
 */

import { NextRequest, NextResponse } from 'next/server'
import { readWidgets, writeWidgets } from '@/lib/db'

/**
 * PATCH /api/widgets/reorder
 * Réordonne les widgets selon l'ordre fourni
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Valider que widgetIds est un tableau
    if (!Array.isArray(body.widgetIds)) {
      return NextResponse.json(
        { error: 'widgetIds doit être un tableau' },
        { status: 400 }
      )
    }
    
    // Lire les widgets existants
    const widgets = await readWidgets()
    
    // Créer un map pour un accès rapide
    const widgetMap = new Map(widgets.map(w => [w.id, w]))
    
    // Réordonner selon l'ordre fourni
    const reorderedWidgets = body.widgetIds.map((widgetId: string, index: number) => {
      const widget = widgetMap.get(widgetId)
      if (!widget) {
        throw new Error(`Widget ${widgetId} non trouvé`)
      }
      return {
        ...widget,
        order: index + 1,
      }
    })
    
    // Ajouter les widgets qui ne sont pas dans la liste (au cas où)
    const remainingWidgets = widgets.filter(w => !body.widgetIds.includes(w.id))
    reorderedWidgets.push(...remainingWidgets)
    
    // Sauvegarder
    await writeWidgets(reorderedWidgets)
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Erreur lors du réordonnement des widgets:', error)
    return NextResponse.json(
      { error: error.message || 'Impossible de réordonner les widgets' },
      { status: 500 }
    )
  }
}

