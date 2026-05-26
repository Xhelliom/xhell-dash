/**
 * Handler API pour la route des statistiques de votre carte
 *
 * GET /api/apps/[id]/stats/template
 *
 * Remplacez "template" par l'ID de votre carte (ex: "sonarr", "radarr")
 *
 * Le squelette commun (lecture de l'app, vérification du template, en-têtes de
 * cache, gestion d'erreurs) est fourni par `createCardStatsRoute`. Il suffit
 * d'implémenter `fetchStats` : validez les identifiants en levant une
 * `CardConfigError` (renvoyée en 400 par défaut) puis récupérez les données.
 */

import { createCardStatsRoute, getAppUrl, getCredential, CardConfigError } from "@/lib/card-route";
import type { TemplateStats } from "./types";

export const GET = createCardStatsRoute<TemplateStats>({
  templateId: "template",
  templateLabel: "correspondant",
  fetchStats: async (app) => {
    // Adaptez selon votre API (token, clé API, URL, etc.)
    const apiUrl = getAppUrl(app);
    const apiKey = getCredential(app, "apiKey"); // ou un champ spécifique à votre carte

    if (!apiKey) {
      throw new CardConfigError(
        "Clé API non configurée. Veuillez configurer la clé API dans les paramètres de l'application."
      );
    }

    return fetchTemplateStats(apiUrl, apiKey);
  },
});

/**
 * Récupère les statistiques depuis l'API externe
 *
 * Adaptez cette fonction selon l'API que vous utilisez
 */
async function fetchTemplateStats(apiUrl: string, apiKey: string): Promise<TemplateStats> {
  const headers = {
    "X-Api-Key": apiKey, // Adaptez selon votre API
    Accept: "application/json",
  };

  // Exemple : récupérer les statistiques depuis l'API
  // Adaptez les endpoints selon votre API
  const response = await fetch(`${apiUrl}/api/v1/stats`, {
    headers,
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status}`);
  }

  const data = await response.json();

  // Transformer les données de l'API au format attendu
  // Adaptez selon la structure de votre API
  return {
    totalItems: data.totalItems || 0,
    pendingItems: data.pendingItems || 0,
    recentItems: data.recentItems || [],
  };
}
