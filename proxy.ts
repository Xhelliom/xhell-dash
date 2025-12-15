// Proxy global pour protéger les routes avec Auth.js v5 (Next.js 16+)
// - Redirige vers /login si l'utilisateur n'est pas authentifié
// - Laisse passer librement les routes publiques (login, ressources statiques, API, etc.)
//
// Note : Next.js 16 a remplacé "middleware" par "proxy" pour clarifier
// le rôle de cette couche (interception réseau et routage).
//
// Auth.js v5 : utilise `auth()` comme wrapper qui enrichit la requête avec `req.auth`
// Compatible avec Next.js 16 proxy via `export function proxy`

import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

/**
 * Fonction proxy qui intercepte les requêtes et vérifie l'authentification.
 * Remplace l'ancien middleware.ts dans Next.js 16.
 * 
 * Next.js 16 exige `export function proxy(request: Request)`.
 * Auth.js v5 : on utilise `auth()` comme wrapper qui enrichit req.auth.
 * 
 * Note : Pour Next.js 16 proxy, on doit wrapper manuellement car
 * `export default auth(...)` n'est pas compatible avec `export function proxy`.
 */
export async function proxy(request: NextRequest) {
  // Dans Next.js 16 proxy, auth() peut être appelé sans paramètre
  // car le contexte de la requête est automatiquement disponible
  // via les headers/cookies de la requête
  const session = await auth()

  const { pathname } = request.nextUrl

  // Routes publiques explicites
  const publicRoutes = ["/login"]

  // Si la route est publique, on laisse passer
  if (publicRoutes.includes(pathname)) {
    // Si utilisateur déjà connecté et tente d'accéder à /login, on le renvoie au dashboard
    if (pathname === "/login" && session) {
      const dashboardUrl = new URL("/", request.nextUrl.origin)
      return NextResponse.redirect(dashboardUrl)
    }
    return NextResponse.next()
  }

  // Si pas de session et route non publique, on redirige vers /login
  if (!session) {
    const loginUrl = new URL("/login", request.nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Utilisateur authentifié, on laisse passer
  return NextResponse.next()
}

// Configure les chemins sur lesquels le proxy est appliqué
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

