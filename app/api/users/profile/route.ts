/**
 * API Route pour la gestion du profil de l'utilisateur connecté
 * 
 * Endpoints :
 * - GET /api/users/profile : Récupère le profil de l'utilisateur connecté (accessible à tous)
 * - PUT /api/users/profile : Met à jour le profil de l'utilisateur connecté (email/mot de passe, accessible à tous)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { findUserByEmail, updateUserProfile } from '@/lib/users'

/**
 * GET /api/users/profile
 * Récupère le profil de l'utilisateur connecté (accessible à tous)
 */
export async function GET() {
  try {
    // Vérifier l'authentification
    const session = await auth()
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer l'utilisateur depuis la base de données
    const user = await findUserByEmail(session.user.email)

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    // Retourner l'utilisateur sans le hash de mot de passe
    const { passwordHash, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword)
  } catch (error: any) {
    console.error('Erreur lors de la récupération du profil:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du profil' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/users/profile
 * Met à jour le profil de l'utilisateur connecté (email/mot de passe, accessible à tous)
 */
export async function PUT(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth()
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer l'utilisateur depuis la base de données pour obtenir son ID
    const user = await findUserByEmail(session.user.email)

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    // Lire les données de la requête
    const body = await request.json()
    const { email, password } = body

    // Validation des données
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Format d\'email invalide' },
          { status: 400 }
        )
      }
    }

    if (password !== undefined && password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    // Mettre à jour le profil de l'utilisateur
    const updatedUser = await updateUserProfile(user.id, {
      email,
      password,
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du profil:', error)
    
    // Gérer les erreurs spécifiques
    if (error.message === 'Utilisateur introuvable') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    if (error.message === 'Un utilisateur avec cet email existe déjà') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    )
  }
}

