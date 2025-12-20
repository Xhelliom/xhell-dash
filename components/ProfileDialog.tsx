/**
 * Composant ProfileDialog
 * 
 * Dialog pour modifier son email et mot de passe
 * Formulaire avec validation et gestion des erreurs
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react'

interface UserProfile {
  id: string
  email: string
  role: string
}

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [emailChanged, setEmailChanged] = useState(false)

  // Champs du formulaire
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [needsReauth, setNeedsReauth] = useState(false)

  // Charger le profil au montage ou quand le dialog s'ouvre
  useEffect(() => {
    if (open) {
      loadProfile()
    } else {
      // Réinitialiser le formulaire quand le dialog se ferme
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setCurrentPassword('')
      setError(null)
      setSuccess(false)
      setEmailChanged(false)
      setNeedsReauth(false)
    }
  }, [open])

  /**
   * Charge le profil de l'utilisateur connecté
   */
  const loadProfile = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/users/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setEmail(data.email || '')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors du chargement du profil')
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error)
      setError('Erreur lors du chargement du profil')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Valide le formulaire
   */
  const validateForm = (): boolean => {
    setError(null)

    // Si l'email change, vérifier qu'un mot de passe actuel est fourni pour réauthentification
    const emailIsChanging = email && email !== profile?.email
    if (emailIsChanging && !currentPassword) {
      setNeedsReauth(true)
      setError('Pour modifier votre email, veuillez d\'abord entrer votre mot de passe actuel')
      return false
    }

    // Validation de l'email
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setError('Format d\'email invalide')
        return false
      }
    }

    // Validation du mot de passe si fourni
    if (password) {
      if (password.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères')
        return false
      }

      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas')
        return false
      }
    }

    // Vérifier qu'au moins un champ est modifié
    if (!email || email === profile?.email) {
      if (!password) {
        setError('Aucune modification à sauvegarder')
        return false
      }
    }

    return true
  }

  /**
   * Sauvegarde les modifications du profil
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const updateData: { email?: string; password?: string; currentPassword?: string } = {}

      // Ne mettre à jour l'email que s'il a changé
      if (email && email !== profile?.email) {
        updateData.email = email
        // Inclure le mot de passe actuel pour réauthentification
        if (currentPassword) {
          updateData.currentPassword = currentPassword
        }
      }

      // Ne mettre à jour le mot de passe que s'il est fourni
      if (password) {
        updateData.password = password
        // Si l'email ne change pas mais le mot de passe oui, demander aussi le mot de passe actuel
        if (!updateData.email && currentPassword) {
          updateData.currentPassword = currentPassword
        }
      }

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        // Si l'email a été modifié, il faut déconnecter l'utilisateur
        // car la session NextAuth contient encore l'ancien email
        const emailWasChanged = email && email !== profile?.email
        
        if (emailWasChanged) {
          // Marquer que l'email a été changé pour afficher un message spécial
          setEmailChanged(true)
          setSuccess(true)
          
          // Attendre un peu pour que l'utilisateur voie le message
          setTimeout(async () => {
            // Déconnecter et rediriger vers la page de login
            await signOut({ redirect: true, callbackUrl: '/login' })
          }, 2000)
        } else {
          // Si seul le mot de passe a été modifié, recharger le profil
          setSuccess(true)
          await loadProfile()
          // Réinitialiser tous les champs de mot de passe
          setPassword('')
          setConfirmPassword('')
          setCurrentPassword('')
          setNeedsReauth(false)
          // Fermer le dialog après un court délai
          setTimeout(() => {
            onOpenChange(false)
          }, 1500)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      setError('Erreur lors de la sauvegarde du profil')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mon profil</DialogTitle>
          <DialogDescription>
            Modifiez votre email et/ou votre mot de passe
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Message d'erreur */}
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Message de succès */}
            {success && (
              <div className="flex items-center gap-2 p-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 rounded-md">
                <Check className="h-4 w-4 shrink-0" />
                <span>
                  {emailChanged
                    ? 'Profil mis à jour. Vous allez être déconnecté pour vous reconnecter avec votre nouvel email...'
                    : 'Profil mis à jour avec succès'}
                </span>
              </div>
            )}

            {/* Champ Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  // Si l'email change, réinitialiser le flag de réauthentification
                  if (e.target.value !== profile?.email) {
                    setNeedsReauth(true)
                  } else {
                    setNeedsReauth(false)
                  }
                }}
                placeholder="votre@email.com"
                required
              />
            </div>

            {/* Champ Mot de passe actuel (requis si l'email change) */}
            {(needsReauth || password) && (
              <div className="space-y-2">
                <Label htmlFor="currentPassword">
                  Mot de passe actuel {needsReauth && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe actuel"
                  required={needsReauth || !!password}
                />
                <p className="text-xs text-muted-foreground">
                  {needsReauth
                    ? 'Requis pour modifier votre email (sécurité)'
                    : 'Requis pour modifier votre mot de passe'}
                </p>
              </div>
            )}

            {/* Champ Mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Laissez vide pour ne pas changer"
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 8 caractères. Laissez vide pour ne pas modifier.
              </p>
            </div>

            {/* Champ Confirmation mot de passe */}
            {password && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez le mot de passe"
                  minLength={8}
                />
              </div>
            )}

            {/* Boutons */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  'Sauvegarder'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

