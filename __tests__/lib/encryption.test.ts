/**
 * Tests pour le module de chiffrement
 *
 * Teste toutes les fonctions de chiffrement/déchiffrement
 * et la gestion des champs sensibles
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  generateEncryptionKey,
  encryptValue,
  decryptValue,
  encryptSensitiveFields,
  decryptSensitiveFields,
} from "@/lib/encryption";

describe("encryption", () => {
  // Sauvegarder la clé d'encryption originale
  const originalEncryptionKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    // Réinitialiser la clé d'encryption pour chaque test
    process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  });

  afterEach(() => {
    // Restaurer la clé originale
    if (originalEncryptionKey) {
      process.env.ENCRYPTION_KEY = originalEncryptionKey;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
  });

  describe("generateEncryptionKey", () => {
    it("devrait générer une clé valide de 64 caractères hex", () => {
      const key = generateEncryptionKey();

      expect(key).toBeDefined();
      expect(key.length).toBe(64); // 32 bytes = 64 caractères hex
      expect(key).toMatch(/^[0-9a-f]{64}$/); // Format hexadécimal
    });

    it("devrait générer des clés différentes à chaque appel", () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();

      expect(key1).not.toBe(key2);
    });
  });

  describe("encryptValue", () => {
    it("devrait chiffrer correctement une valeur", () => {
      const plaintext = "my-secret-token-123";
      const encrypted = encryptValue(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toMatch(/^encrypted:/); // Doit avoir le préfixe
    });

    it("devrait retourner une chaîne vide pour une valeur vide", () => {
      expect(encryptValue("")).toBe("");
      expect(encryptValue("   ")).toBe("");
    });

    it("devrait retourner une chaîne vide pour null/undefined", () => {
      expect(encryptValue(null as any)).toBe("");
      expect(encryptValue(undefined as any)).toBe("");
    });

    it("ne devrait pas rechiffrer une valeur déjà chiffrée", () => {
      const plaintext = "my-secret-token";
      const encrypted1 = encryptValue(plaintext);
      const encrypted2 = encryptValue(encrypted1);

      expect(encrypted1).toBe(encrypted2); // Doit rester identique
    });

    it("devrait retourner la valeur en clair si ENCRYPTION_KEY n'est pas définie", () => {
      delete process.env.ENCRYPTION_KEY;
      const plaintext = "my-secret-token";
      const encrypted = encryptValue(plaintext);

      expect(encrypted).toBe(plaintext); // Doit retourner en clair
    });
  });

  describe("decryptValue", () => {
    it("devrait déchiffrer correctement une valeur chiffrée", () => {
      const plaintext = "my-secret-token-123";
      const encrypted = encryptValue(plaintext);
      const decrypted = decryptValue(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("devrait retourner une chaîne vide pour une valeur vide", () => {
      expect(decryptValue("")).toBe("");
      expect(decryptValue("   ")).toBe("");
    });

    it("devrait retourner une chaîne vide pour null/undefined", () => {
      expect(decryptValue(null as any)).toBe("");
      expect(decryptValue(undefined as any)).toBe("");
    });

    it("devrait retourner la valeur originale si non chiffrée", () => {
      const plaintext = "my-secret-token";
      const decrypted = decryptValue(plaintext);

      expect(decrypted).toBe(plaintext);
    });

    it("devrait gérer le round-trip (chiffrer puis déchiffrer)", () => {
      const originalValues = [
        "simple-token",
        "very-long-token-with-many-characters-123456789",
        "token-with-special-chars-!@#$%^&*()",
        "token-with-unicode-émojis-🎉🚀",
      ];

      for (const original of originalValues) {
        const encrypted = encryptValue(original);
        const decrypted = decryptValue(encrypted);

        expect(decrypted).toBe(original);
      }
    });
  });

  describe("encryptSensitiveFields", () => {
    it("devrait chiffrer uniquement les champs sensibles", () => {
      const obj = {
        name: "My App",
        url: "https://example.com",
        plexToken: "my-secret-token",
        apiKey: "my-api-key",
      };

      const encrypted = encryptSensitiveFields(obj);

      expect(encrypted.name).toBe("My App"); // Non chiffré
      expect(encrypted.url).toBe("https://example.com"); // Non chiffré
      expect(encrypted.plexToken).toMatch(/^encrypted:/); // Chiffré
      expect(encrypted.apiKey).toMatch(/^encrypted:/); // Chiffré
    });

    it("devrait chiffrer récursivement les objets imbriqués", () => {
      const obj = {
        name: "My App",
        config: {
          plexToken: "nested-token",
          publicSetting: "public-value",
        },
      };

      const encrypted = encryptSensitiveFields(obj);

      expect(encrypted.name).toBe("My App");
      expect(encrypted.config.plexToken).toMatch(/^encrypted:/);
      expect(encrypted.config.publicSetting).toBe("public-value");
    });

    it("ne devrait pas chiffrer les valeurs vides", () => {
      const obj = {
        name: "My App",
        plexToken: "",
        apiKey: null,
      };

      const encrypted = encryptSensitiveFields(obj);

      expect(encrypted.plexToken).toBe("");
      expect(encrypted.apiKey).toBeNull();
    });
  });

  describe("decryptSensitiveFields", () => {
    it("devrait déchiffrer uniquement les champs sensibles", () => {
      const obj = {
        name: "My App",
        url: "https://example.com",
        plexToken: encryptValue("my-secret-token"),
        apiKey: encryptValue("my-api-key"),
      };

      const decrypted = decryptSensitiveFields(obj);

      expect(decrypted.name).toBe("My App");
      expect(decrypted.url).toBe("https://example.com");
      expect(decrypted.plexToken).toBe("my-secret-token");
      expect(decrypted.apiKey).toBe("my-api-key");
    });

    it("devrait déchiffrer récursivement les objets imbriqués", () => {
      const obj = {
        name: "My App",
        config: {
          plexToken: encryptValue("nested-token"),
          publicSetting: "public-value",
        },
      };

      const decrypted = decryptSensitiveFields(obj);

      expect(decrypted.name).toBe("My App");
      expect(decrypted.config.plexToken).toBe("nested-token");
      expect(decrypted.config.publicSetting).toBe("public-value");
    });

    it("devrait gérer le round-trip avec encryptSensitiveFields", () => {
      const original = {
        name: "My App",
        url: "https://example.com",
        plexToken: "my-secret-token",
        apiKey: "my-api-key",
        config: {
          nestedToken: "nested-secret",
          publicValue: "public",
        },
      };

      const encrypted = encryptSensitiveFields(original);
      const decrypted = decryptSensitiveFields(encrypted);

      expect(decrypted.name).toBe(original.name);
      expect(decrypted.url).toBe(original.url);
      expect(decrypted.plexToken).toBe(original.plexToken);
      expect(decrypted.apiKey).toBe(original.apiKey);
      expect(decrypted.config.nestedToken).toBe(original.config.nestedToken);
      expect(decrypted.config.publicValue).toBe(original.config.publicValue);
    });
  });
});
