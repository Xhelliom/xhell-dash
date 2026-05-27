/**
 * Handler API pour la route des statistiques Overseerr
 *
 * GET /api/apps/[id]/stats/overseerr
 *
 * Récupère les statistiques depuis l'API Overseerr
 */

import { createCardStatsRoute, getAppUrl, getCredential, CardConfigError } from "@/lib/card-route";
import type { OverseerrStats } from "./types";

export const GET = createCardStatsRoute<OverseerrStats>({
  templateId: "overseerr",
  templateLabel: "Overseerr",
  fetchStats: async (app) => {
    const apiUrl = getAppUrl(app);
    const apiKey = getCredential(app, "apiKey", "overseerrApiKey");

    if (!apiKey) {
      throw new CardConfigError(
        "Token API non configuré. Veuillez configurer le token API dans les paramètres de l'application."
      );
    }
    if (!apiUrl) {
      throw new CardConfigError(
        "URL non configurée. Veuillez configurer l'URL du serveur Overseerr dans les paramètres de l'application."
      );
    }

    return fetchOverseerrStats(apiUrl, apiKey);
  },
});

/**
 * Récupère les statistiques depuis l'API Overseerr
 */
async function fetchOverseerrStats(apiUrl: string, apiKey: string): Promise<OverseerrStats> {
  const headers = {
    "X-Api-Key": apiKey,
    Accept: "application/json",
  };

  // Récupérer les compteurs de demandes
  const requestCountResponse = await fetch(`${apiUrl}/api/v1/request/count`, {
    headers,
    signal: AbortSignal.timeout(10000),
  });

  let totalRequests = 0;
  let pendingRequests = 0;
  let approvedRequests = 0;
  let declinedRequests = 0;
  let processingRequests = 0;
  let availableMedia = 0;

  if (requestCountResponse.ok) {
    const requestCountData = await requestCountResponse.json();
    totalRequests = requestCountData.total || 0;
    pendingRequests = requestCountData.pending || 0;
    approvedRequests = requestCountData.approved || 0;
    declinedRequests = requestCountData.declined || 0;
    processingRequests = requestCountData.processing || 0;
    availableMedia = requestCountData.available || 0;
  }

  // Récupérer les statistiques du serveur
  const aboutResponse = await fetch(`${apiUrl}/api/v1/settings/about`, {
    headers,
    signal: AbortSignal.timeout(10000),
  });

  let totalMovies = 0;
  let totalTvShows = 0;
  let totalUsers = 0;

  if (aboutResponse.ok) {
    const aboutData = await aboutResponse.json();
    // Les statistiques peuvent être dans différents champs selon la version
    totalMovies = aboutData.totalMovies || 0;
    totalTvShows = aboutData.totalTvShows || 0;
    totalUsers = aboutData.totalUsers || 0;
  }

  return {
    totalRequests,
    pendingRequests,
    approvedRequests,
    declinedRequests,
    processingRequests,
    availableMedia,
    totalMovies,
    totalTvShows,
    totalUsers,
    requestStats: {
      total: totalRequests,
      pending: pendingRequests,
      approved: approvedRequests,
      declined: declinedRequests,
      processing: processingRequests,
      available: availableMedia,
    },
  };
}
