/**
 * Composant AutoFillButton
 * 
 * Bouton client pour pré-remplir automatiquement les champs email et password
 * sur la page de login. Doit être un Client Component car il utilise onClick.
 */

'use client'

export function AutoFillButton() {
  const handleAutoFill = () => {
    // Autofill les champs email et password si présents dans le DOM
    const emailInput = document.getElementById("email") as HTMLInputElement | null
    const passInput = document.getElementById("password") as HTMLInputElement | null
    if (emailInput) emailInput.value = "xhell-admin@example.com"
    if (passInput) passInput.value = "Admin123!"
    // Tente de mettre le focus sur le bouton Se connecter
    const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null
    if (btn) btn.focus()
  }

  return (
    <button
      type="button"
      className="underline text-xs mt-1"
      style={{ color: "inherit", cursor: "pointer", background: "none", border: "none", padding: 0 }}
      onClick={handleAutoFill}
    >
      Remplir automatiquement ces identifiants
    </button>
  )
}

