/**
 * Page de connexion principale
 *
 * Utilise un formulaire simple (email / mot de passe) basé sur les
 * composants shadcn/ui. Le formulaire déclenche une Server Action
 * qui appelle `signIn("credentials")` fourni par Auth.js.
 *
 * Cette implémentation est volontairement minimaliste pour servir de base.
 * En production, il faudra :
 * - connecter le provider Credentials à une vraie base utilisateur
 * - gérer les messages d'erreur de façon plus fine (toast, etc.)
 * - éventuellement ajouter d'autres providers (GitHub, Google, ...)
 */

import { redirect } from "next/navigation"
import { AuthError } from "next-auth"
import { signIn } from "@/auth"
import { isDefaultPasswordStillActive } from "@/lib/users"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { AutoFillButton } from "@/components/AutoFillButton"

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string
    error?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // Dans Next.js 16, searchParams est une Promise, il faut l'await
  const params = await searchParams
  
  // URL de redirection après login réussi (par défaut, le dashboard racine)
  const callbackUrl = params.callbackUrl ?? "/"

  // Vérifie si le mot de passe admin par défaut est toujours actif
  // pour décider d'afficher ou non les instructions de connexion
  const showDefaultCredentials = await isDefaultPasswordStillActive()

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            Connexion au Xhell Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Message d'erreur simple basé sur le paramètre de la query string */}
          {params.error && (
            <p className="mb-4 text-sm text-red-500">
              Échec de la connexion. Vérifiez vos identifiants.
            </p>
          )}

          {/* Formulaire géré par une Server Action */}
          <form
            action={async (formData) => {
              "use server"

              try {
                // Appelle le provider "credentials" défini dans auth.ts
                await signIn("credentials", formData)

                // En cas de succès, on redirige vers la page souhaitée
                redirect(callbackUrl)
              } catch (error) {
                // Gestion d'erreur recommandée par Auth.js
                if (error instanceof AuthError) {
                  const url = new URL("/login", process.env.AUTH_URL ?? "http://localhost:3000")
                  url.searchParams.set("error", error.type)
                  if (callbackUrl) {
                    url.searchParams.set("callbackUrl", callbackUrl)
                  }
                  redirect(url.toString())
                }

                throw error
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="vous@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full">
              Se connecter
            </Button>
          </form>

          {/* Petit texte d'aide pour la configuration de la démo */}
          {/* Affiche les identifiants ET pré-remplit si le mot de passe n'a pas été changé */}
          {showDefaultCredentials && (
            <>
              <p className="mt-4 text-xs text-muted-foreground text-center">
                Un administrateur par défaut est créé automatiquement s&apos;il
                n&apos;existe pas : email{" "}
                <code className="font-mono">xhell-admin@example.com</code> / mot de passe{" "}
                <code className="font-mono">Admin123!</code>.
                <br />
                <AutoFillButton />
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


