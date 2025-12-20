/**
 * Composant UserAvatarButton
 * 
 * Bouton flottant en haut à droite avec avatar généré via DiceBear
 * Menu dropdown avec options : "Mon profil", "Déconnexion"
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { createAvatar } from '@dicebear/core'
import { lorelei } from '@dicebear/collection'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { User, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react'

interface UserSession {
  user?: {
    email?: string | null
    name?: string | null
    role?: string | null
  }
}

interface UserAvatarButtonProps {
  onProfileClick?: () => void
}

export function UserAvatarButton({ onProfileClick }: UserAvatarButtonProps) {
  const [session, setSession] = useState<UserSession | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Charger la session au montage
  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/session')
        if (response.ok) {
          const data = await response.json()
          setSession(data)
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [])

  // Générer l'avatar de manière déterministe basé sur l'email
  const avatarUrl = useMemo(() => {
    if (!session?.user?.email) {
      return null
    }

    try {
      return createAvatar(lorelei, {
        seed: session.user.email,
        size: 128,
        radius: 50,
      }).toDataUri()
    } catch (error) {
      console.error('Erreur lors de la génération de l\'avatar:', error)
      return null
    }
  }, [session?.user?.email])

  // Gérer la déconnexion
  const handleSignOut = async () => {
    setIsMenuOpen(false)
    await signOut({ redirect: true, callbackUrl: '/login' })
  }

  // Gérer l'ouverture du profil
  const handleProfileClick = () => {
    setIsMenuOpen(false)
    if (onProfileClick) {
      onProfileClick()
    }
  }

  if (isLoading || !session?.user) {
    return null
  }

  const userEmail = session.user.email || ''
  const userName = session.user.name || userEmail.split('@')[0]

  return (
    <div className="fixed top-6 right-6 z-[100]">
      <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-12 w-12 rounded-full p-0 overflow-hidden',
              'border-2 border-border hover:border-primary',
              'transition-all duration-200',
              'shadow-lg hover:shadow-xl'
            )}
            aria-label="Menu utilisateur"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`Avatar de ${userName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="w-80 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-3">
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt={`Avatar de ${userName}`}
                  className="h-12 w-12 rounded-full border-2 border-border"
                />
              )}
              <div className="flex flex-col">
                <span className="text-base font-semibold">{userName}</span>
                <span className="text-sm text-muted-foreground">{userEmail}</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={handleProfileClick}
            >
              <User className="h-4 w-4" />
              <span>Mon profil</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span>Déconnexion</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

