// Utilitaires de gestion des utilisateurs côté serveur (mode "prod")
// - Stockage dans une base SQLite via Prisma
// - Hash de mot de passe robuste avec bcryptjs (implémentation JS pure)
//
// Cette couche isole l'accès aux données utilisateur pour que le reste
// de l'application (Auth.js, UI, etc.) n'ait pas à connaître Prisma.

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import type { Role, User } from "@prisma/client"

// Rôle possible pour un utilisateur (doit rester en phase avec l'enum Prisma Role)
export type UserRole = "user" | "admin"

// Représentation d'un utilisateur exposée par cette couche
export type StoredUser = User

/**
 * Hash un mot de passe avec bcrypt.
 * Le "salt" est géré en interne par bcrypt, avec un cost factor (rounds) configurable.
 */
export async function hashPassword(password: string): Promise<string> {
  // 10 est un compromis courant entre sécurité et performances
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

/**
 * Vérifie qu'un mot de passe en clair correspond au hash stocké pour un utilisateur.
 */
export async function verifyPassword(password: string, user: StoredUser): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash)
}

/**
 * Recherche un utilisateur par email (login)
 */
export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const normalized = email.toLowerCase()
  return prisma.user.findUnique({
    where: { email: normalized },
  })
}

/**
 * Crée un nouvel utilisateur en base
 */
export async function createUser(params: {
  email: string
  password: string
  role: UserRole
}): Promise<StoredUser> {
  const normalized = params.email.toLowerCase()

  const existing = await prisma.user.findUnique({
    where: { email: normalized },
  })

  if (existing) {
    throw new Error("Un utilisateur avec cet email existe déjà")
  }

  const passwordHash = await hashPassword(params.password)

  const user = await prisma.user.create({
    data: {
      email: normalized,
      passwordHash,
      role: params.role as Role,
    },
  })

  return user
}

/**
 * S'assure qu'au moins un admin existe.
 * Si aucun admin n'est trouvé, un admin par défaut est créé :
 * - login (email) : xhell-admin@example.com
 * - mot de passe  : Admin123!
 */
export async function ensureDefaultAdmin(): Promise<void> {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "admin" },
  })

  if (existingAdmin) {
    return
  }

  const email = "xhell-admin@example.com"
  const password = "Admin123!"

  console.log(
    "[AUTH] Aucun admin trouvé, création d'un admin par défaut (Prisma) :",
    email
  )

  await createUser({
    email,
    password,
    role: "admin",
  })
}

/**
 * Vérifie si l'admin par défaut utilise encore le mot de passe par défaut.
 * Cette fonction permet de savoir si l'utilisateur a déjà changé le mot de passe
 * initial, pour masquer les instructions de connexion par défaut dans l'UI.
 * 
 * @returns true si l'admin par défaut existe et utilise encore le mot de passe "Admin123!"
 */
export async function isDefaultPasswordStillActive(): Promise<boolean> {
  const defaultEmail = "xhell-admin@example.com"
  const defaultPassword = "Admin123!"

  // Recherche de l'utilisateur admin par défaut
  const user = await findUserByEmail(defaultEmail)
  
  // Si l'utilisateur n'existe pas, le mot de passe par défaut n'est pas actif
  if (!user) {
    return false
  }

  // Vérifie si le mot de passe correspond toujours au mot de passe par défaut
  return verifyPassword(defaultPassword, user)
}

