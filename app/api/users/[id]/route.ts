/**
 * API Route pour la gestion d'un utilisateur spécifique
 * 
 * Endpoints :
 * - PUT /api/users/[id] : Met à jour un utilisateur (admin seulement)
 * - DELETE /api/users/[id] : Supprime un utilisateur (admin seulement)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { updateUser, deleteUser } from '@/lib/users'

/**
 * PUT /api/users/[id]
 * Met à jour un utilisateur (admin seulement)
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

    // Récupérer l'ID depuis les params
    const { id } = await params

    // Lire les données de la requête
    const body = await request.json()
    const { email, password, role } = body

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

    if (role !== undefined && role !== 'user' && role !== 'admin') {
      return NextResponse.json(
        { error: 'Rôle invalide. Doit être "user" ou "admin"' },
        { status: 400 }
      )
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await updateUser(id, {
      email,
      password,
      role: role as 'user' | 'admin' | undefined,
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error)
    
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
      { error: 'Erreur lors de la mise à jour de l\'utilisateur' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/[id]
 * Supprime un utilisateur (admin seulement)
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

    // Récupérer l'ID depuis les params
    const { id } = await params

    // Supprimer l'utilisateur
    await deleteUser(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error)
    
    // Gérer les erreurs spécifiques
    if (error.message === 'Utilisateur introuvable') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    if (error.message === 'Impossible de supprimer le dernier administrateur') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    )
  }
}

