/**
 * Utilitaires pour masquer et gérer les tokens sensibles
 * 
 * Fournit des fonctions pour masquer les tokens dans l'interface utilisateur
 * et détecter les champs sensibles
 */

/**
 * Masque un token en affichant uniquement les premiers et derniers caractères
 * 
 * @param token - Le token à masquer
 * @param visibleChars - Nombre de caractères visibles au début et à la fin (défaut: 4)
 * @returns Le token masqué (ex: "abcd...xyz")
 * 
 * @example
 * ```typescript
 * maskToken("abcdefghijklmnopqrstuvwxyz") // "abcd...wxyz"
 * maskToken("1234567890", 2) // "12...90"
 * ```
 */
export function maskToken(token: string | undefined | null, visibleChars: number = 4): string {
  if (!token || token.length === 0) {
    return ''
  }
  
  // Si le token est trop court, masquer complètement
  if (token.length <= visibleChars * 2) {
    return '*'.repeat(Math.min(token.length, 8))
  }
  
  const start = token.substring(0, visibleChars)
  const end = token.substring(token.length - visibleChars)
  return `${start}${'*'.repeat(Math.max(8, token.length - visibleChars * 2))}${end}`
}

/**
 * Liste des noms de champs considérés comme sensibles (tokens, clés API, etc.)
 * Ces champs seront automatiquement masqués dans l'interface
 */
const SENSITIVE_FIELD_NAMES = [
  'token',
  'apiKey',
  'apikey',
  'api_key',
  'password',
  'secret',
  'credential',
  'auth',
  'key',
  'plexToken',
  'plex_token',
  'sonarrApiKey',
  'radarrApiKey',
  'lidarrApiKey',
  'truenasApiKey',
  'homeassistantApiKey',
  'proxmoxApiKey',
  'kubernetesToken',
]

/**
 * Vérifie si un nom de champ est considéré comme sensible
 * 
 * @param fieldName - Le nom du champ à vérifier
 * @returns true si le champ est sensible, false sinon
 * 
 * @example
 * ```typescript
 * isSensitiveField('plexToken') // true
 * isSensitiveField('name') // false
 * ```
 */
export function isSensitiveField(fieldName: string): boolean {
  const lowerFieldName = fieldName.toLowerCase()
  return SENSITIVE_FIELD_NAMES.some(sensitiveName => 
    lowerFieldName.includes(sensitiveName.toLowerCase())
  )
}

/**
 * Masque automatiquement un champ si c'est un champ sensible
 * 
 * @param fieldName - Le nom du champ
 * @param value - La valeur du champ
 * @param visibleChars - Nombre de caractères visibles (défaut: 4)
 * @returns La valeur masquée si le champ est sensible, la valeur originale sinon
 * 
 * @example
 * ```typescript
 * maskSensitiveField('plexToken', 'abcdefghijklmnop') // "abcd...mnop"
 * maskSensitiveField('name', 'My App') // "My App"
 * ```
 */
export function maskSensitiveField(
  fieldName: string, 
  value: string | undefined | null,
  visibleChars: number = 4
): string {
  if (!value) {
    return ''
  }
  
  if (isSensitiveField(fieldName)) {
    return maskToken(value, visibleChars)
  }
  
  return value
}

/**
 * Masque tous les champs sensibles d'un objet
 * 
 * @param obj - L'objet contenant potentiellement des champs sensibles
 * @param visibleChars - Nombre de caractères visibles (défaut: 4)
 * @returns Un nouvel objet avec les champs sensibles masqués
 * 
 * @example
 * ```typescript
 * maskSensitiveFields({
 *   name: 'My App',
 *   plexToken: 'abcdefghijklmnop',
 *   url: 'http://example.com'
 * })
 * // { name: 'My App', plexToken: 'abcd...mnop', url: 'http://example.com' }
 * ```
 */
export function maskSensitiveFields<T extends Record<string, any>>(
  obj: T,
  visibleChars: number = 4
): T {
  const masked: any = { ...obj }
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && isSensitiveField(key)) {
      masked[key] = maskToken(value, visibleChars)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Récursivement masquer les objets imbriqués
      masked[key] = maskSensitiveFields(value, visibleChars)
    }
  }
  
  return masked
}

