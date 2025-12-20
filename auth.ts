// Configuration centrale d'Auth.js / NextAuth pour l'App Router Next 16
// Ce fichier définit les providers, la gestion de session et expose
// les helpers `auth`, `signIn`, `signOut` et les `handlers` pour l'API.

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import {
  ensureDefaultAdmin,
  findUserByEmail,
  verifyPassword,
} from "@/lib/users"

/**
 * Implémentation avec un provider "credentials" basé sur Prisma :
 * - login = email
 * - mot de passe = hashé avec bcrypt en base de données
 * - rôle = "user" ou "admin"
 *
 * Si aucun admin n'existe dans la base au moment de la première connexion,
 * un admin par défaut est créé :
 * - login : xhell-admin
 * - mot de passe : Admin123!
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      // ID et nom visibles côté client
      id: "credentials",
      name: "Identifiants",
      // Champs du formulaire que NextAuth va générer côté /api/auth/signin (non utilisé ici,
      // on fait une page de login custom, mais c'est utile pour la config)
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        // On s'assure qu'un admin par défaut existe si nécessaire
        await ensureDefaultAdmin()

        const email = credentials?.email
        const password = credentials?.password

        // Vérification que les credentials sont présents et de type string
        if (!email || !password || typeof email !== "string" || typeof password !== "string") {
          return null
        }

        // Recherche de l'utilisateur dans la base via Prisma
        const user = await findUserByEmail(email)
        if (!user) {
          return null
        }

        // Vérification du mot de passe à partir du hash stocké
        const isValid = await verifyPassword(password, user)
        if (!isValid) {
          return null
        }

        // L'objet retourné sera stocké dans le token / la session
        return {
          id: user.id,
          name: user.email,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    // Utilise un JWT côté serveur pour la session, adapté aux apps stateless
    strategy: "jwt",
  },
  pages: {
    // Page de login custom (App Router : app/login/page.tsx)
    signIn: "/login",
  },
  callbacks: {
    /**
     * Personnalise le contenu du JWT
     */
    async jwt({ token, user }) {
      // Lors de la première connexion, on fusionne les infos utilisateur
      if (user) {
        token.name = user.name
        token.email = user.email
        // @ts-expect-error - champ custom
        token.role = (user as any).role ?? "user"
      }
      return token
    },

    /**
     * Transforme le token en objet session exposé au frontend
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name
        session.user.email = token.email ?? ""
        // @ts-expect-error - champ custom
        session.user.role = (token as any).role ?? "user"
      }
      return session
    },
  },
  /**
   * Options de sécurité : en prod, Auth.js recommande de définir AUTH_SECRET
   * et AUTH_URL dans les variables d'environnement.
   */
  trustHost: true,
})


