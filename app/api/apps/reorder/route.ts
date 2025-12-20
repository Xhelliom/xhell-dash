/**
 * API Route pour réordonner les applications
 * 
 * PATCH /api/apps/reorder : Met à jour l'ordre des applications
 * 
 * Body attendu :
 * {
 *   appIds: string[] - Tableau des IDs d'apps dans le nouvel ordre
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { readApps, writeApps } from '@/lib/db'

/**
 * PATCH /api/apps/reorder
 * Met à jour l'ordre des applications selon le tableau d'IDs fourni (admin seulement)
 */
export async function PATCH(request: NextRequest) {
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

    // Récupérer les données du body
    const body = await request.json()
    
    // Valider que appIds est fourni et est un tableau
    if (!body.appIds || !Array.isArray(body.appIds)) {
      return NextResponse.json(
        { error: 'Le champ appIds doit être un tableau' },
        { status: 400 }
      )
    }
    
    // Lire les applications existantes
    const apps = await readApps()
    
    // Créer un Map pour un accès rapide aux apps par ID
    const appsMap = new Map(apps.map(app => [app.id, app]))
    
    // Vérifier que tous les IDs fournis existent
    const missingIds = body.appIds.filter((id: string) => !appsMap.has(id))
    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: `Applications non trouvées : ${missingIds.join(', ')}` },
        { status: 404 }
      )
    }
    
    // Vérifier que tous les IDs existants sont présents dans le nouveau ordre
    const existingIds = new Set(apps.map(app => app.id))
    const providedIds = new Set(body.appIds)
    const missingInOrder = Array.from(existingIds).filter(id => !providedIds.has(id))
    if (missingInOrder.length > 0) {
      return NextResponse.json(
        { error: `Toutes les applications doivent être présentes dans le nouvel ordre. Manquantes : ${missingInOrder.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Réordonner les apps selon le nouvel ordre fourni
    const reorderedApps = body.appIds.map((id: string, index: number) => {
      const app = appsMap.get(id)!
      return {
        ...app,
        order: index,
      }
    })
    
    // Sauvegarder
    await writeApps(reorderedApps)
    
    return NextResponse.json({ message: 'Ordre mis à jour avec succès' }, { status: 200 })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'ordre:', error)
    return NextResponse.json(
      { error: 'Impossible de mettre à jour l\'ordre des applications' },
      { status: 500 }
    )
  }
}

