// Script Node pur (sans tsx) pour réinitialiser le mot de passe d'un
// utilisateur existant, sans détruire la base (contrairement à
// reset-admin.sh/.ps1).
//
// Écrit en ESM et n'utilisant que @prisma/client et bcryptjs, afin de pouvoir
// tourner aussi bien en dev qu'à l'intérieur de l'image Docker de prod (mode
// standalone), où ni tsx ni les sources TypeScript ne sont disponibles.
//
// Usage (dev) :
//   node scripts/reset-password.mjs <email> [nouveau-mot-de-passe]
//
// Usage (prod Docker) :
//   docker exec -it xhell-dash node scripts/reset-password.mjs <email> [mdp]
//
// Si le mot de passe est omis, un mot de passe aléatoire est généré et affiché.
// DATABASE_URL doit être défini dans l'environnement (c'est déjà le cas dans le
// conteneur de prod via docker-compose).

import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Doit rester en phase avec lib/users.ts (hashPassword).
const SALT_ROUNDS = 10;

const prisma = new PrismaClient();

async function resetPassword() {
  const [emailArg, passwordArg] = process.argv.slice(2);

  // Vérification des arguments
  if (!emailArg) {
    console.error("❌ Email manquant.");
    console.error("   Usage: node scripts/reset-password.mjs <email> [nouveau-mot-de-passe]");
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
  const newPassword = passwordArg || randomBytes(12).toString("base64url");

  // Mise à jour du hash via la même logique bcrypt que le reste de l'app
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { email },
    data: { passwordHash },
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
