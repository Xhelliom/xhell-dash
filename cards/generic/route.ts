/**
 * Handler API pour la route des statistiques génériques
 *
 * GET /api/apps/[id]/stats/generic
 * Récupère les statistiques depuis l'API externe configurée dans statApiUrl
 */

import { createCardStatsRoute, CardConfigError } from "@/lib/card-route";
import type { GenericStats } from "./types";

export const GET = createCardStatsRoute<GenericStats>({
  templateId: "generic",
  templateLabel: "génériques",
  fetchStats: async (app) => {
    if (!app.statApiUrl) {
      throw new CardConfigError(
        "Aucune API de statistiques configurée pour cette application",
        400,
        "Veuillez configurer l'URL de l'API de statistiques (statApiUrl) dans les paramètres de l'application."
      );
    }

    const response = await fetch(app.statApiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`API retourne une erreur: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as GenericStats;
  },
});
