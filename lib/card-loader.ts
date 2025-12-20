/**
 * Chargeur automatique de cartes modulaires
 * 
 * Ce module scanne le dossier cards/ et charge automatiquement toutes les cartes
 * trouvées. Chaque carte doit exporter une CardDefinition depuis son index.ts
 */

import { cardRegistry } from './card-registry'
import type { CardDefinition } from './card-registry'
import fs from 'fs'
import path from 'path'

/**
 * Indique si les cartes ont déjà été chargées
 * Évite de recharger plusieurs fois
 */
let cardsLoaded = false

/**
 * Chemin vers le dossier des cartes (relatif à la racine du projet)
 */
const CARDS_DIR = path.join(process.cwd(), 'cards')

/**
 * Charge toutes les cartes disponibles depuis le dossier cards/
 * 
 * Cette fonction :
 * 1. Scanne le dossier cards/ pour trouver tous les sous-dossiers
 * 2. Pour chaque sous-dossier, essaie de charger le fichier index.ts
 * 3. Enregistre chaque carte trouvée dans le registre
 * 4. Gère les erreurs gracieusement (affiche un warning mais continue)
 * 
 * @param forceReload - Force le rechargement même si déjà chargé (utile pour les tests)
 */
export function loadCards(forceReload = false): void {
  // Ne pas recharger si déjà chargé (sauf si forceReload)
  if (cardsLoaded && !forceReload) {
    return
  }

  // Vérifier que le dossier cards/ existe
  if (!fs.existsSync(CARDS_DIR)) {
    console.warn(
      `[CardLoader] Le dossier cards/ n'existe pas à ${CARDS_DIR}. Aucune carte ne sera chargée.`
    )
    cardsLoaded = true
    return
  }

  // Lire le contenu du dossier cards/
  const entries = fs.readdirSync(CARDS_DIR, { withFileTypes: true })

  // Filtrer pour ne garder que les dossiers (pas les fichiers)
  const cardDirs = entries.filter(
    (entry) => entry.isDirectory() && entry.name !== 'TEMPLATE'
  )

  console.log(`[CardLoader] Découverte de ${cardDirs.length} dossier(s) de carte(s)`)

  // Charger chaque carte
  for (const dir of cardDirs) {
    const cardId = dir.name
    const cardPath = path.join(CARDS_DIR, cardId)

    try {
      loadCard(cardId, cardPath)
    } catch (error: any) {
      console.error(
        `[CardLoader] Erreur lors du chargement de la carte "${cardId}":`,
        error.message
      )
      // Continuer avec les autres cartes même en cas d'erreur
    }
  }

  cardsLoaded = true
  console.log(
    `[CardLoader] Chargement terminé. ${cardRegistry.getAll().length} carte(s) enregistrée(s)`
  )
}

/**
 * Charge une carte spécifique depuis son dossier
 * 
 * @param cardId - ID de la carte (nom du dossier)
 * @param cardPath - Chemin complet vers le dossier de la carte
 */
function loadCard(cardId: string, cardPath: string): void {
  // Vérifier que le fichier index.ts existe
  const indexPath = path.join(cardPath, 'index.ts')
  const indexPathJs = path.join(cardPath, 'index.js')

  // Essayer d'abord avec .ts, puis .js
  let indexFile: string | null = null
  if (fs.existsSync(indexPath)) {
    indexFile = indexPath
  } else if (fs.existsSync(indexPathJs)) {
    indexFile = indexPathJs
  } else {
    console.warn(
      `[CardLoader] Aucun fichier index.ts ou index.js trouvé pour la carte "${cardId}" dans ${cardPath}`
    )
    return
  }

  try {
    // Charger dynamiquement le module
    // En Next.js, on peut utiliser require pour charger les modules
    // Note: En production, les fichiers .ts sont compilés en .js
    // On doit donc gérer les deux cas
    
    // Pour le développement avec TypeScript, on peut utiliser require
    // mais il faut que le fichier soit compilé ou qu'on utilise ts-node
    // Pour Next.js, on va plutôt utiliser une approche différente :
    // Les cartes seront importées statiquement dans un fichier central
    
    // Pour l'instant, on va utiliser une approche avec require
    // qui fonctionne en runtime Node.js
    delete require.cache[require.resolve(indexFile)]
    const cardModule = require(indexFile)

    // Récupérer la définition de la carte
    // La carte doit exporter soit une CardDefinition, soit un objet avec une propriété default
    const cardDefinition: CardDefinition =
      cardModule.default || cardModule.cardDefinition || cardModule

    // Valider que c'est bien une CardDefinition
    if (!cardDefinition || typeof cardDefinition !== 'object') {
      throw new Error(
        `La carte "${cardId}" n'exporte pas une CardDefinition valide`
      )
    }

    if (!cardDefinition.id) {
      throw new Error(`La carte "${cardId}" n'a pas d'ID défini`)
    }

    if (!cardDefinition.template) {
      throw new Error(`La carte "${cardId}" n'a pas de template défini`)
    }

    // Enregistrer la carte dans le registre
    cardRegistry.register(cardDefinition)
    console.log(`[CardLoader] Carte "${cardId}" chargée avec succès`)
  } catch (error: any) {
    // Si c'est une erreur de module non trouvé, c'est normal en développement
    // car les fichiers .ts ne sont pas directement require-ables
    if (error.code === 'MODULE_NOT_FOUND' || error.message.includes('Cannot find module')) {
      console.warn(
        `[CardLoader] Impossible de charger la carte "${cardId}" : le module n'est pas encore compilé. ` +
          `Assurez-vous que le fichier index.ts existe et est correctement exporté.`
      )
    } else {
      throw error
    }
  }
}

/**
 * Recharge toutes les cartes
 * Utile pour le développement ou les tests
 */
export function reloadCards(): void {
  cardRegistry.clear()
  cardsLoaded = false
  loadCards()
}

/**
 * Initialise le chargement des cartes
 * À appeler au démarrage de l'application (côté serveur)
 * 
 * En Next.js, on peut l'appeler dans :
 * - Un fichier d'initialisation côté serveur
 * - Un middleware
 * - Les routes API qui en ont besoin
 */
export function initializeCards(): void {
  // Ne charger que côté serveur
  if (typeof window === 'undefined') {
    loadCards()
  }
}

// Auto-initialisation si on est côté serveur
// Note: En Next.js, ce code s'exécute à la fois côté serveur et client
// On doit donc vérifier qu'on est côté serveur
if (typeof window === 'undefined') {
  // En Next.js, on ne peut pas charger les modules dynamiquement de cette façon
  // car les fichiers .ts ne sont pas directement require-ables
  // On va plutôt utiliser une approche avec des imports statiques
  // Voir la fonction loadCardsWithImports ci-dessous
}

/**
 * Alternative : charger les cartes avec des imports statiques
 * 
 * Cette approche fonctionne mieux avec Next.js car elle utilise
 * les imports ES6 standard qui sont gérés par le bundler
 * 
 * Pour utiliser cette approche, créez un fichier cards/index.ts qui
 * importe et enregistre toutes les cartes manuellement, ou utilisez
 * une fonction qui importe dynamiquement avec import()
 */
export async function loadCardsWithImports(): Promise<void> {
  // Cette fonction sera implémentée différemment selon l'approche choisie
  // Pour l'instant, on va utiliser une approche hybride :
  // Les cartes s'enregistreront elles-mêmes au moment de leur import
  // Voir l'exemple dans cards/plex/index.ts
}

