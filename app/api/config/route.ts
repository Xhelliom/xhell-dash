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

    // Migration: convertir spacing en density si présent dans les nouvelles valeurs
    let mergedConfig = { ...config }
    if (mergedConfig.stylePreset && 'spacing' in mergedConfig.stylePreset && !('density' in mergedConfig.stylePreset)) {
      const spacingToDensity: Record<string, 'compact' | 'normal' | 'comfortable'> = {
        'compact': 'compact',
        'normal': 'normal',
        'spacious': 'comfortable',
      }
      const oldSpacing = (mergedConfig.stylePreset as any).spacing as string
      const newDensity = spacingToDensity[oldSpacing] || 'normal'
      mergedConfig.stylePreset = {
        ...mergedConfig.stylePreset,
        density: newDensity,
      }
      delete (mergedConfig.stylePreset as any).spacing
    }

    // Fusionner avec les nouvelles valeurs
    const updatedConfig: AppConfig = {
      ...currentConfig,
      ...mergedConfig,
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

    // Valider que theme est valide si fourni
    const validThemes = ['default', 'violet', 'caramel']
    if (updatedConfig.theme && !validThemes.includes(updatedConfig.theme)) {
      return NextResponse.json(
        { error: 'Thème invalide' },
        { status: 400 }
      )
    }

    // Valider que stylePreset est valide si fourni
    if (updatedConfig.stylePreset) {
      const validRadius = ['small', 'medium', 'large']
      const validShadow = ['subtle', 'pronounced']
      const validFont = ['sans', 'serif', 'mono']
      const validDensity = ['compact', 'normal', 'comfortable']

      if (
        !validRadius.includes(updatedConfig.stylePreset.radius) ||
        !validShadow.includes(updatedConfig.stylePreset.shadow) ||
        !validFont.includes(updatedConfig.stylePreset.font) ||
        !validDensity.includes(updatedConfig.stylePreset.density)
      ) {
        return NextResponse.json(
          { error: 'Preset de style invalide' },
          { status: 400 }
        )
      }
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


