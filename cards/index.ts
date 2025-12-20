/**
 * Point d'entrée pour le chargement de toutes les cartes
 * 
 * Ce fichier importe toutes les cartes disponibles, ce qui déclenche
 * leur enregistrement automatique dans le registre de cartes.
 * 
 * Pour ajouter une nouvelle carte :
 * 1. Créez un dossier dans cards/ avec votre carte
 * 2. Ajoutez un import ici : import './votre-carte'
 */

// Importer toutes les cartes disponibles
// Chaque import déclenche l'enregistrement automatique de la carte
import './plex'

// Note: Les cartes s'enregistrent automatiquement lors de l'import
// grâce à l'appel à cardRegistry.register() dans leur index.ts

// Exporter le registre pour utilisation externe
export { cardRegistry } from '@/lib/card-registry'
export type { CardDefinition } from '@/lib/card-registry'

