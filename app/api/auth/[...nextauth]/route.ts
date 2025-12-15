// Route handler Auth.js / NextAuth pour l'App Router
// Cette route gère toutes les actions d'authentification :
// - /api/auth/signin
// - /api/auth/signout
// - /api/auth/session
// - etc.

import { handlers } from "@/auth"

// On réexporte simplement les handlers fournis par Auth.js
export const { GET, POST } = handlers


