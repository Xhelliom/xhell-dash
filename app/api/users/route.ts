/**
 * API Route pour la gestion des utilisateurs
 * 
 * Endpoints :
 * - GET /api/users : Liste tous les utilisateurs (admin seulement)
 * - POST /api/users : Crée un nouvel utilisateur (admin seulement)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAllUsers, createUser } from '@/lib/users'

/**
 * GET /api/users
 * Liste tous les utilisateurs (admin seulement)
 */
export async function GET() {
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

    // Récupérer tous les utilisateurs
    const users = await getAllUsers()

    return NextResponse.json(users)
  } catch (error: any) {
    console.error('Erreur lors de la récupération des utilisateurs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users
 * Crée un nouvel utilisateur (admin seulement)
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

    // Lire les données de la requête
    const body = await request.json()
    const { email, password, role } = body

    // Validation des données
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, mot de passe et rôle sont requis' },
        { status: 400 }
      )
    }

    if (role !== 'user' && role !== 'admin') {
      return NextResponse.json(
        { error: 'Rôle invalide. Doit être "user" ou "admin"' },
        { status: 400 }
      )
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      )
    }

    // Validation du mot de passe (minimum 8 caractères)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    // Créer l'utilisateur
    const user = await createUser({
      email,
      password,
      role: role as 'user' | 'admin',
    })

    // Retourner l'utilisateur sans le hash de mot de passe
    const { passwordHash, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error: any) {
    console.error('Erreur lors de la création de l\'utilisateur:', error)
    
    // Gérer les erreurs spécifiques
    if (error.message === 'Un utilisateur avec cet email existe déjà') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    )
  }
}

