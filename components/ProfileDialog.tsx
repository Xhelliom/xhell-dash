/**
 * Composant ProfileDialog
 * 
 * Dialog pour modifier son email et mot de passe
 * Formulaire avec validation et gestion des erreurs
 */

'use client'

import { useState, useEffect } from 'react'
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
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Champs du formulaire
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Charger le profil au montage ou quand le dialog s'ouvre
  useEffect(() => {
    if (open) {
      loadProfile()
    } else {
      // Réinitialiser le formulaire quand le dialog se ferme
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setError(null)
      setSuccess(false)
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
      const updateData: { email?: string; password?: string } = {}

      // Ne mettre à jour l'email que s'il a changé
      if (email && email !== profile?.email) {
        updateData.email = email
      }

      // Ne mettre à jour le mot de passe que s'il est fourni
      if (password) {
        updateData.password = password
      }

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        setSuccess(true)
        // Recharger le profil pour avoir les données à jour
        await loadProfile()
        // Réinitialiser les champs de mot de passe
        setPassword('')
        setConfirmPassword('')
        // Fermer le dialog après un court délai
        setTimeout(() => {
          onOpenChange(false)
        }, 1500)
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
                <span>Profil mis à jour avec succès</span>
              </div>
            )}

            {/* Champ Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
              />
            </div>

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

