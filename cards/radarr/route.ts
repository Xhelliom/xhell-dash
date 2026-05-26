/**
 * Handler API pour la route des statistiques Radarr
 *
 * GET /api/apps/[id]/stats/radarr
 *
 * Récupère les statistiques depuis l'API Radarr
 */

import {
  createCardStatsRoute,
  getAppUrl,
  getCredential,
  parseQueueResponse,
  CardConfigError,
} from "@/lib/card-route";
import type { RadarrStats } from "./types";

export const GET = createCardStatsRoute<RadarrStats>({
  templateId: "radarr",
  templateLabel: "Radarr",
  fetchStats: async (app) => {
    const apiUrl = getAppUrl(app);
    const apiKey = getCredential(app, "apiKey", "radarrApiKey");

    if (!apiKey) {
      throw new CardConfigError(
        "Clé API non configurée. Veuillez configurer la clé API dans les paramètres de l'application."
      );
    }
    if (!apiUrl) {
      throw new CardConfigError(
        "URL non configurée. Veuillez configurer l'URL du serveur Radarr dans les paramètres de l'application."
      );
    }

    return fetchRadarrStats(apiUrl, apiKey);
  },
});

/**
 * Récupère les statistiques depuis l'API Radarr
 */
async function fetchRadarrStats(apiUrl: string, apiKey: string): Promise<RadarrStats> {
  const headers = {
    "X-Api-Key": apiKey,
    Accept: "application/json",
  };

  // Récupérer les films
  const moviesResponse = await fetch(`${apiUrl}/api/v3/movie`, {
    headers,
    signal: AbortSignal.timeout(10000),
  });

  if (!moviesResponse.ok) {
    throw new Error(`Erreur API Radarr: ${moviesResponse.status}`);
  }

  const movies = await moviesResponse.json();
  const totalMovies = movies.length || 0;

  // Compter les films téléchargés et manquants
  let downloadedMovies = 0;
  let missingMovies = 0;

  for (const movie of movies) {
    if (movie.hasFile) {
      downloadedMovies++;
    } else {
      missingMovies++;
    }
  }

  // Récupérer la queue
  const queueResponse = await fetch(`${apiUrl}/api/v3/queue`, {
    headers,
    signal: AbortSignal.timeout(10000),
  });
  const queue = await parseQueueResponse(queueResponse);

  return {
    totalMovies,
    downloadedMovies,
    missingMovies,
    queuePending: queue.pending,
    queueDownloading: queue.downloading,
    queueCompleted: queue.completed,
    queueFailed: queue.failed,
    queueStats: queue,
  };
}
