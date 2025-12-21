/**
 * Système de chiffrement pour les tokens sensibles
 * 
 * Utilise AES-256-GCM pour chiffrer/déchiffrer les tokens sensibles
 * stockés dans la base de données.
 * 
 * La clé de chiffrement doit être définie dans la variable d'environnement
 * ENCRYPTION_KEY (32 bytes en hexadécimal ou base64).
 * 
 * Si la clé n'est pas définie, un avertissement est affiché et les tokens
 * sont stockés en clair (mode dégradé pour la compatibilité).
 */

import crypto from 'crypto'

/**
 * Algorithme de chiffrement utilisé
 */
const ALGORITHM = 'aes-256-gcm'

/**
 * Taille de la clé en bytes (256 bits = 32 bytes)
 */
const KEY_LENGTH = 32

/**
 * Taille de l'IV (Initialization Vector) en bytes
 */
const IV_LENGTH = 16

/**
 * Taille de l'authentification tag en bytes
 */
const AUTH_TAG_LENGTH = 16

/**
 * Préfixe pour identifier les valeurs chiffrées
 */
const ENCRYPTED_PREFIX = 'encrypted:'

/**
 * Récupère la clé de chiffrement depuis les variables d'environnement
 * 
 * @returns Buffer contenant la clé de chiffrement ou null si non définie
 */
function getEncryptionKey(): Buffer | null {
  const keyEnv = process.env.ENCRYPTION_KEY
  
  if (!keyEnv) {
    console.warn(
      '⚠️  ENCRYPTION_KEY n\'est pas définie. Les tokens seront stockés en clair. ' +
      'Pour activer le chiffrement, définissez ENCRYPTION_KEY dans votre fichier .env.local'
    )
    return null
  }
  
  try {
    // Essayer de décoder en hexadécimal
    if (keyEnv.length === KEY_LENGTH * 2) {
      return Buffer.from(keyEnv, 'hex')
    }
    
    // Essayer de décoder en base64
    const decoded = Buffer.from(keyEnv, 'base64')
    if (decoded.length === KEY_LENGTH) {
      return decoded
    }
    
    // Si la longueur ne correspond pas, utiliser directement (avec padding si nécessaire)
    const key = Buffer.from(keyEnv, 'utf-8')
    if (key.length === KEY_LENGTH) {
      return key
    }
    
    // Padding ou troncature pour obtenir exactement KEY_LENGTH bytes
    const paddedKey = Buffer.alloc(KEY_LENGTH)
    key.copy(paddedKey, 0, 0, Math.min(key.length, KEY_LENGTH))
    
    console.warn(
      '⚠️  La clé de chiffrement n\'a pas la bonne longueur. ' +
      'Elle a été ajustée. Pour une sécurité optimale, utilisez une clé de 32 bytes.'
    )
    
    return paddedKey
  } catch (error) {
    console.error('Erreur lors du décodage de la clé de chiffrement:', error)
    return null
  }
}

/**
 * Génère une nouvelle clé de chiffrement
 * 
 * @returns String hexadécimale de la clé générée
 * 
 * @example
 * ```typescript
 * const key = generateEncryptionKey()
 * console.log('ENCRYPTION_KEY=' + key)
 * ```
 */
export function generateEncryptionKey(): string {
  const key = crypto.randomBytes(KEY_LENGTH)
  return key.toString('hex')
}

/**
 * Chiffre une valeur sensible
 * 
 * @param plaintext - La valeur en clair à chiffrer
 * @returns La valeur chiffrée avec le préfixe "encrypted:" ou la valeur originale si le chiffrement échoue
 * 
 * @example
 * ```typescript
 * const encrypted = encryptValue('my-secret-token')
 * // Retourne: "encrypted:base64encodeddata..."
 * ```
 */
export function encryptValue(plaintext: string | undefined | null): string {
  // Si la valeur est vide, retourner vide
  if (!plaintext || plaintext.trim() === '') {
    return ''
  }
  
  // Si la valeur est déjà chiffrée, la retourner telle quelle
  if (plaintext.startsWith(ENCRYPTED_PREFIX)) {
    return plaintext
  }
  
  const key = getEncryptionKey()
  
  // Si la clé n'est pas disponible, retourner la valeur en clair
  if (!key) {
    return plaintext
  }
  
  try {
    // Générer un IV aléatoire
    const iv = crypto.randomBytes(IV_LENGTH)
    
    // Créer le cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    // Chiffrer la valeur
    let encrypted = cipher.update(plaintext, 'utf-8', 'base64')
    encrypted += cipher.final('base64')
    
    // Récupérer l'authentification tag
    const authTag = cipher.getAuthTag()
    
    // Combiner IV, authTag et données chiffrées
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'base64'),
    ])
    
    // Retourner avec le préfixe
    return ENCRYPTED_PREFIX + combined.toString('base64')
  } catch (error) {
    console.error('Erreur lors du chiffrement:', error)
    // En cas d'erreur, retourner la valeur en clair (mode dégradé)
    return plaintext
  }
}

/**
 * Déchiffre une valeur chiffrée
 * 
 * @param encryptedValue - La valeur chiffrée avec le préfixe "encrypted:"
 * @returns La valeur déchiffrée ou la valeur originale si le déchiffrement échoue
 * 
 * @example
 * ```typescript
 * const decrypted = decryptValue('encrypted:base64encodeddata...')
 * // Retourne: "my-secret-token"
 * ```
 */
export function decryptValue(encryptedValue: string | undefined | null): string {
  // Si la valeur est vide, retourner vide
  if (!encryptedValue || encryptedValue.trim() === '') {
    return ''
  }
  
  // Si la valeur n'est pas chiffrée, la retourner telle quelle
  if (!encryptedValue.startsWith(ENCRYPTED_PREFIX)) {
    return encryptedValue
  }
  
  const key = getEncryptionKey()
  
  // Si la clé n'est pas disponible, retourner la valeur telle quelle
  if (!key) {
    // Retirer le préfixe si présent
    return encryptedValue.replace(ENCRYPTED_PREFIX, '')
  }
  
  try {
    // Retirer le préfixe
    const base64Data = encryptedValue.replace(ENCRYPTED_PREFIX, '')
    
    // Décoder les données
    const combined = Buffer.from(base64Data, 'base64')
    
    // Extraire IV, authTag et données chiffrées
    const iv = combined.subarray(0, IV_LENGTH)
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
    
    // Créer le decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    
    // Déchiffrer la valeur
    let decrypted = decipher.update(encrypted, undefined, 'utf-8')
    decrypted += decipher.final('utf-8')
    
    return decrypted
  } catch (error) {
    console.error('Erreur lors du déchiffrement:', error)
    // En cas d'erreur, retourner la valeur telle quelle (mode dégradé)
    return encryptedValue
  }
}

/**
 * Chiffre tous les champs sensibles d'un objet
 * 
 * @param obj - L'objet contenant potentiellement des champs sensibles
 * @returns Un nouvel objet avec les champs sensibles chiffrés
 * 
 * @example
 * ```typescript
 * const encrypted = encryptSensitiveFields({
 *   name: 'My App',
 *   plexToken: 'my-secret-token',
 *   url: 'http://example.com'
 * })
 * // { name: 'My App', plexToken: 'encrypted:...', url: 'http://example.com' }
 * ```
 */
export function encryptSensitiveFields<T extends Record<string, any>>(obj: T): T {
  // Import synchronisé pour éviter les dépendances circulaires
  const tokenUtils = require('./token-utils')
  const isSensitiveField = tokenUtils.isSensitiveField
  const encrypted: any = { ...obj }
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && isSensitiveField(key) && value) {
      encrypted[key] = encryptValue(value)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Récursivement chiffrer les objets imbriqués
      encrypted[key] = encryptSensitiveFields(value)
    }
  }
  
  return encrypted
}

/**
 * Déchiffre tous les champs sensibles d'un objet
 * 
 * @param obj - L'objet contenant potentiellement des champs sensibles chiffrés
 * @returns Un nouvel objet avec les champs sensibles déchiffrés
 * 
 * @example
 * ```typescript
 * const decrypted = decryptSensitiveFields({
 *   name: 'My App',
 *   plexToken: 'encrypted:...',
 *   url: 'http://example.com'
 * })
 * // { name: 'My App', plexToken: 'my-secret-token', url: 'http://example.com' }
 * ```
 */
export function decryptSensitiveFields<T extends Record<string, any>>(obj: T): T {
  // Import synchronisé pour éviter les dépendances circulaires
  const tokenUtils = require('./token-utils')
  const isSensitiveField = tokenUtils.isSensitiveField
  const decrypted: any = { ...obj }
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && isSensitiveField(key) && value) {
      decrypted[key] = decryptValue(value)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Récursivement déchiffrer les objets imbriqués
      decrypted[key] = decryptSensitiveFields(value)
    }
  }
  
  return decrypted
}

