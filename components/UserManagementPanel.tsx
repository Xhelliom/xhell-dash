/**
 * Composant UserManagementPanel
 * 
 * Panneau de gestion des utilisateurs pour les administrateurs
 * Permet de créer, modifier et supprimer des utilisateurs
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Edit, Trash2, Loader2, AlertCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface User {
  id: string
  email: string
  role: 'user' | 'admin'
  createdAt: string
  updatedAt: string
}

interface UserManagementPanelProps {
  className?: string
}

export function UserManagementPanel({ className }: UserManagementPanelProps) {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Champs du formulaire
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'user' | 'admin'>('user')

  /**
   * Charge la liste des utilisateurs
   */
  const loadUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors du chargement des utilisateurs')
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
      setError('Erreur lors du chargement des utilisateurs')
    } finally {
      setIsLoading(false)
    }
  }

  // Charger les utilisateurs au montage
  useEffect(() => {
    loadUsers()
  }, [])

  /**
   * Ouvre le dialog pour créer un nouvel utilisateur
   */
  const handleAddUser = () => {
    setEditingUser(null)
    setEmail('')
    setPassword('')
    setRole('user')
    setError(null)
    setSuccess(null)
    setIsDialogOpen(true)
  }

  /**
   * Ouvre le dialog pour modifier un utilisateur
   */
  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEmail(user.email)
    setPassword('')
    setRole(user.role)
    setError(null)
    setSuccess(null)
    setIsDialogOpen(true)
  }

  /**
   * Supprime un utilisateur
   */
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuccess('Utilisateur supprimé avec succès')
        await loadUsers()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors de la suppression')
        setTimeout(() => setError(null), 5000)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      setError('Erreur lors de la suppression de l\'utilisateur')
      setTimeout(() => setError(null), 5000)
    }
  }

  /**
   * Valide le formulaire
   */
  const validateForm = (): boolean => {
    setError(null)

    if (!email || email.trim() === '') {
      setError('L\'email est requis')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Format d\'email invalide')
      return false
    }

    // Le mot de passe est requis pour la création, optionnel pour la modification
    if (!editingUser && (!password || password.length < 8)) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return false
    }

    if (editingUser && password && password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return false
    }

    return true
  }

  /**
   * Sauvegarde l'utilisateur (création ou modification)
   */
  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (editingUser) {
        // Modification
        const updateData: { email?: string; password?: string; role?: string } = {
          email,
          role,
        }

        // Ne mettre à jour le mot de passe que s'il est fourni
        if (password) {
          updateData.password = password
        }

        const response = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        })

        if (response.ok) {
          setSuccess('Utilisateur modifié avec succès')
          setIsDialogOpen(false)
          await loadUsers()
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Erreur lors de la modification')
        }
      } else {
        // Création
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            role,
          }),
        })

        if (response.ok) {
          setSuccess('Utilisateur créé avec succès')
          setIsDialogOpen(false)
          await loadUsers()
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Erreur lors de la création')
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      setError('Erreur lors de la sauvegarde de l\'utilisateur')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* En-tête avec bouton d'ajout */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestion des utilisateurs</h3>
          <p className="text-sm text-muted-foreground">
            Créez, modifiez et supprimez des utilisateurs
          </p>
        </div>
        <Button onClick={handleAddUser}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un utilisateur
        </Button>
      </div>

      {/* Messages d'erreur et de succès */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 rounded-md">
          <Check className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Liste des utilisateurs */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{user.email}</p>
                  <span
                    className={cn(
                      'px-2 py-1 text-xs rounded-full',
                      user.role === 'admin'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Créé le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditUser(user)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteUser(user.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de création/modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Modifiez les informations de l\'utilisateur'
                : 'Remplissez les informations pour créer un nouvel utilisateur'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Message d'erreur */}
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Champ Email */}
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="utilisateur@example.com"
                required
              />
            </div>

            {/* Champ Mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="user-password">
                Mot de passe {editingUser && '(laissez vide pour ne pas changer)'}
              </Label>
              <Input
                id="user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editingUser ? 'Laissez vide pour ne pas changer' : 'Minimum 8 caractères'}
                minLength={8}
                required={!editingUser}
              />
            </div>

            {/* Champ Rôle */}
            <div className="space-y-2">
              <Label htmlFor="user-role">Rôle</Label>
              <Select value={role} onValueChange={(value) => setRole(value as 'user' | 'admin')}>
                <SelectTrigger id="user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Boutons */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

