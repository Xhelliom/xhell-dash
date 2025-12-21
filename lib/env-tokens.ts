/**
 * Support des variables d'environnement pour les tokens API
 * 
 * Permet d'utiliser des variables d'environnement au lieu de stocker
 * les tokens directement dans la base de données.
 * 
 * Format supporté :
 * - ${ENV_VAR_NAME} : Référence à une variable d'environnement
 * - ${ENV_VAR_NAME:default} : Avec valeur par défaut si la variable n'existe pas
 * 
 * @example
 * ```typescript
 * // Dans la base de données, stocker :
 * plexToken: "${PLEX_TOKEN}"
 * 
 * // Dans .env.local :
 * PLEX_TOKEN=my-secret-token
 * 
 * // Lors de la lecture, le token sera résolu depuis la variable d'environnement
 * ```
 */

import type { App } from './types'

/**
 * Pattern pour détecter les références aux variables d'environnement
 * Format: ${VAR_NAME} ou ${VAR_NAME:default}
 */
const ENV_VAR_PATTERN = /\$\{([^}:]+)(?::([^}]+))?\}/g

/**
 * Résout une valeur qui peut contenir des références aux variables d'environnement
 * 
 * @param value - La valeur à résoudre (peut contenir ${VAR_NAME})
 * @returns La valeur résolue avec les variables d'environnement remplacées
 * 
 * @example
 * ```typescript
 * // Avec variable définie
 * process.env.MY_TOKEN = 'secret123'
 * resolveEnvValue('${MY_TOKEN}') // 'secret123'
 * 
 * // Avec variable non définie et valeur par défaut
 * resolveEnvValue('${MY_TOKEN:default-value}') // 'default-value'
 * 
 * // Avec variable non définie sans valeur par défaut
 * resolveEnvValue('${MY_TOKEN}') // ''
 * 
 * // Valeur normale (sans référence)
 * resolveEnvValue('my-token') // 'my-token'
 * ```
 */
export function resolveEnvValue(value: string | undefined | null): string {
  if (!value || typeof value !== 'string') {
    return ''
  }
  
  // Si la valeur ne contient pas de référence à une variable d'environnement, la retourner telle quelle
  if (!value.includes('${')) {
    return value
  }
  
  // Remplacer toutes les références aux variables d'environnement
  return value.replace(ENV_VAR_PATTERN, (match, varName, defaultValue) => {
    // Nettoyer le nom de la variable (supprimer les espaces)
    const cleanVarName = varName.trim()
    
    // Récupérer la valeur depuis les variables d'environnement
    const envValue = process.env[cleanVarName]
    
    // Si la variable existe, l'utiliser
    if (envValue !== undefined) {
      return envValue
    }
    
    // Si une valeur par défaut est fournie, l'utiliser
    if (defaultValue !== undefined) {
      return defaultValue.trim()
    }
    
    // Si la variable n'existe pas et qu'il n'y a pas de valeur par défaut,
    // retourner une chaîne vide et afficher un avertissement
    console.warn(
      `⚠️  Variable d'environnement "${cleanVarName}" non définie. ` +
      `Utilisez le format \${${cleanVarName}:default} pour fournir une valeur par défaut.`
    )
    
    return ''
  })
}

/**
 * Liste des noms de champs qui peuvent utiliser des variables d'environnement
 */
const TOKEN_FIELD_NAMES = [
  'plexToken',
  'plex_token',
  'apiKey',
  'apikey',
  'api_key',
  'token',
  'sonarrApiKey',
  'radarrApiKey',
  'lidarrApiKey',
  'truenasApiKey',
  'homeassistantApiKey',
  'proxmoxApiKey',
  'kubernetesToken',
  'password',
  'secret',
]

/**
 * Vérifie si un champ peut utiliser des variables d'environnement
 * 
 * @param fieldName - Le nom du champ
 * @returns true si le champ peut utiliser des variables d'environnement
 */
function isTokenField(fieldName: string): boolean {
  const lowerFieldName = fieldName.toLowerCase()
  return TOKEN_FIELD_NAMES.some(tokenName => 
    lowerFieldName.includes(tokenName.toLowerCase())
  )
}

/**
 * Résout les variables d'environnement pour tous les champs de tokens d'une application
 * 
 * @param app - L'application avec potentiellement des références aux variables d'environnement
 * @returns L'application avec les variables d'environnement résolues
 * 
 * @example
 * ```typescript
 * const app = {
 *   name: 'My App',
 *   plexToken: '${PLEX_TOKEN}',
 *   url: 'http://example.com'
 * }
 * 
 * // Si PLEX_TOKEN=secret123 dans .env.local
 * const resolved = resolveTokenFromEnv(app)
 * // { name: 'My App', plexToken: 'secret123', url: 'http://example.com' }
 * ```
 */
export function resolveTokenFromEnv<T extends App>(app: T): T {
  const resolved: any = { ...app }
  
  // Résoudre les champs de tokens au niveau racine
  for (const [key, value] of Object.entries(app)) {
    if (typeof value === 'string' && isTokenField(key) && value) {
      resolved[key] = resolveEnvValue(value)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Récursivement résoudre les objets imbriqués (ex: statsConfig)
      resolved[key] = resolveTokenFromEnvObject(value)
    }
  }
  
  return resolved
}

/**
 * Résout les variables d'environnement dans un objet générique
 * 
 * @param obj - L'objet à traiter
 * @returns L'objet avec les variables d'environnement résolues
 */
function resolveTokenFromEnvObject<T extends Record<string, any>>(obj: T): T {
  const resolved: any = { ...obj }
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && isTokenField(key) && value) {
      resolved[key] = resolveEnvValue(value)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Récursivement résoudre les objets imbriqués
      resolved[key] = resolveTokenFromEnvObject(value)
    }
  }
  
  return resolved
}

