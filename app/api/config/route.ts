/**
 * API Route pour la configuration globale de l'application
 * 
 * Endpoints :
 * - GET /api/config : Récupère la configuration actuelle
 * - PUT /api/config : Met à jour la configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { readConfig, writeConfig } from '@/lib/db'
import type { AppConfig } from '@/lib/types'

/**
 * GET /api/config
 * Récupère la configuration actuelle de l'application
 */
export async function GET() {
  try {
    const config = await readConfig()
    return NextResponse.json(config)
  } catch (error: any) {
    console.error('Erreur lors de la lecture de la configuration:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la lecture de la configuration' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/config
 * Met à jour la configuration de l'application
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const config = body as Partial<AppConfig>

    // Lire la configuration actuelle
    const currentConfig = await readConfig()

    // Fusionner avec les nouvelles valeurs
    const updatedConfig: AppConfig = {
      ...currentConfig,
      ...config,
    }

    // Valider que backgroundEffect est valide si fourni
    const validEffects = [
      'none',
      'gradient-radial',
      'gradient-linear',
      'gradient-mesh',
      'gradient-animated',
      'glow',
      'grid-pattern',
      'dot-pattern',
      'noise',
      'mesh-animated',
      'shimmer',
    ]

    if (
      updatedConfig.backgroundEffect &&
      !validEffects.includes(updatedConfig.backgroundEffect)
    ) {
      return NextResponse.json(
        { error: 'Effet de background invalide' },
        { status: 400 }
      )
    }

    // Sauvegarder la configuration
    await writeConfig(updatedConfig)

    return NextResponse.json(updatedConfig)
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la configuration:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la configuration' },
      { status: 500 }
    )
  }
}


