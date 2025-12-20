/**
 * Route API dynamique pour les statistiques des cartes
 * 
 * GET /api/apps/[id]/stats/[templateId]
 * 
 * Cette route délègue dynamiquement au handler de la carte correspondante
 * selon le templateId. Si la carte a un apiRouteHandler défini, il sera utilisé.
 * Sinon, une erreur sera retournée.
 * 
 * Exemples :
 * - GET /api/apps/123/stats/plex → délègue à cards/plex/route.ts
 * - GET /api/apps/123/stats/sonarr → délègue à cards/sonarr/route.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { cardRegistry } from '@/lib/card-registry'

// Importer toutes les cartes pour qu'elles s'enregistrent
// Cela garantit que le registre est peuplé avant d'utiliser les handlers
import '@/cards'

/**
 * GET /api/apps/[id]/stats/[templateId]
 * 
 * Route dynamique qui délègue au handler de la carte correspondante
 * Le handler est chargé dynamiquement pour éviter d'importer fs dans les composants client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  try {
    const { id, templateId } = await params

    // Récupérer la carte depuis le registre
    const card = cardRegistry.get(templateId)

    if (!card) {
      return NextResponse.json(
        {
          error: `Carte "${templateId}" non trouvée`,
          hint: `Assurez-vous que la carte "${templateId}" existe et est correctement enregistrée dans le dossier cards/`,
        },
        { status: 404 }
      )
    }

    // Charger dynamiquement le handler API depuis le fichier route.ts de la carte
    // Cela évite d'importer fs dans les composants client
    let apiRouteHandler
    try {
      // Import dynamique du handler (côté serveur uniquement)
      const routeModule = await import(`@/cards/${templateId}/route`)
      apiRouteHandler = routeModule.GET
    } catch (importError: any) {
      console.error(
        `Impossible de charger le handler API pour la carte "${templateId}":`,
        importError
      )
      return NextResponse.json(
        {
          error: `Handler API non trouvé pour la carte "${templateId}"`,
          hint: `Assurez-vous que le fichier cards/${templateId}/route.ts existe et exporte une fonction GET`,
        },
        { status: 501 }
      )
    }

    if (!apiRouteHandler) {
      return NextResponse.json(
        {
          error: `La carte "${templateId}" n'a pas de handler API configuré`,
          hint: `Le fichier cards/${templateId}/route.ts doit exporter une fonction GET`,
        },
        { status: 501 }
      )
    }

    // Déléguer au handler de la carte
    // Le handler reçoit la requête et les paramètres (avec seulement l'id)
    return await apiRouteHandler(request, {
      params: Promise.resolve({ id }),
    })
  } catch (error: any) {
    console.error(
      `Erreur lors du routage vers la carte pour templateId "${templateId}":`,
      error
    )

    return NextResponse.json(
      {
        error: error.message || 'Erreur lors de la récupération des statistiques',
      },
      { status: 500 }
    )
  }
}

