// Script pour réinitialiser le mot de passe d'un utilisateur existant
// sans détruire la base de données (contrairement à reset-admin.sh/.ps1).
//
// Usage: npx tsx scripts/reset-password.ts <email> <nouveau-mot-de-passe>
// Exemple: npx tsx scripts/reset-password.ts xhell-admin@example.com MonNouveauMDP!
//
// Si <nouveau-mot-de-passe> est omis, un mot de passe aléatoire est généré
// et affiché dans la console.

import { randomBytes } from "node:crypto";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/users";

async function resetPassword() {
  const [emailArg, passwordArg] = process.argv.slice(2);

  // Vérification des arguments
  if (!emailArg) {
    console.error("❌ Email manquant.");
    console.error("   Usage: npx tsx scripts/reset-password.ts <email> [nouveau-mot-de-passe]");
    process.exitCode = 1;
    return;
  }

  const email = emailArg.toLowerCase();

  // Recherche de l'utilisateur ciblé
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`❌ Aucun utilisateur trouvé avec l'email : ${email}`);
    process.exitCode = 1;
    return;
  }

  // Si aucun mot de passe n'est fourni, on en génère un aléatoire et sûr
  const generated = !passwordArg;
  const newPassword = passwordArg ?? randomBytes(12).toString("base64url");

  // Mise à jour du hash via la même logique bcrypt que le reste de l'app
  await prisma.user.update({
    where: { email },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  console.log(`✅ Mot de passe réinitialisé pour : ${email} (${user.role})`);
  if (generated) {
    console.log("");
    console.log("🔑 Nouveau mot de passe généré (à communiquer puis à changer) :");
    console.log(`   ${newPassword}`);
  }
}

resetPassword()
  .catch((error) => {
    console.error("❌ Erreur lors de la réinitialisation du mot de passe:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
