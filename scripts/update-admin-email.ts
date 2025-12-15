// Script pour mettre à jour l'email de l'admin existant
// Usage: npx tsx scripts/update-admin-email.ts

import { prisma } from "../lib/prisma"

async function updateAdminEmail() {
  console.log("🔄 Mise à jour de l'email de l'admin...")

  // Chercher l'ancien admin avec l'ancien email
  const oldAdmin = await prisma.user.findUnique({
    where: { email: "xhell-admin" },
  })

  if (oldAdmin) {
    // Vérifier si le nouvel email existe déjà
    const newAdminExists = await prisma.user.findUnique({
      where: { email: "xhell-admin@example.com" },
    })

    if (newAdminExists) {
      console.log("⚠️  Un admin avec l'email xhell-admin@example.com existe déjà")
      console.log("   Suppression de l'ancien admin...")
      await prisma.user.delete({
        where: { email: "xhell-admin" },
      })
      console.log("✅ Ancien admin supprimé")
    } else {
      // Mettre à jour l'email
      await prisma.user.update({
        where: { email: "xhell-admin" },
        data: { email: "xhell-admin@example.com" },
      })
      console.log("✅ Email de l'admin mis à jour : xhell-admin@example.com")
    }
  } else {
    console.log("ℹ️  Aucun admin avec l'ancien email trouvé")
    console.log("   L'admin sera créé automatiquement au prochain démarrage")
  }

  await prisma.$disconnect()
}

updateAdminEmail().catch(console.error)

