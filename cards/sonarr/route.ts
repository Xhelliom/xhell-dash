/**
 * Handler API pour la route des statistiques Sonarr
 *
 * GET /api/apps/[id]/stats/sonarr
 *
 * Récupère les statistiques depuis l'API Sonarr
 */

import {
  createCardStatsRoute,
  getAppUrl,
  getCredential,
  parseQueueResponse,
  CardConfigError,
} from "@/lib/card-route";
import type { SonarrStats, SonarrUpcomingEpisode } from "./types";

export const GET = createCardStatsRoute<SonarrStats>({
  templateId: "sonarr",
  templateLabel: "Sonarr",
  fetchStats: async (app) => {
    const apiUrl = getAppUrl(app);
    const apiKey = getCredential(app, "apiKey", "sonarrApiKey");

    if (!apiKey) {
      throw new CardConfigError(
        "Clé API non configurée. Veuillez configurer la clé API dans les paramètres de l'application."
      );
    }
    if (!apiUrl) {
      throw new CardConfigError(
        "URL non configurée. Veuillez configurer l'URL du serveur Sonarr dans les paramètres de l'application."
      );
    }

    return fetchSonarrStats(apiUrl, apiKey);
  },
});

/**
 * Récupère les statistiques depuis l'API Sonarr
 */
async function fetchSonarrStats(apiUrl: string, apiKey: string): Promise<SonarrStats> {
  const headers = {
    "X-Api-Key": apiKey,
    Accept: "application/json",
  };

  // Récupérer les séries
  const seriesResponse = await fetch(`${apiUrl}/api/v3/series`, {
    headers,
    signal: AbortSignal.timeout(10000),
  });

  if (!seriesResponse.ok) {
    throw new Error(`Erreur API Sonarr: ${seriesResponse.status}`);
  }

  const series = await seriesResponse.json();
  const totalSeries = series.length || 0;

  // Calculer le total d'épisodes
  let totalEpisodes = 0;
  for (const serie of series) {
    if (serie.statistics?.episodeCount) {
      totalEpisodes += serie.statistics.episodeCount;
    }
  }

  // Récupérer la queue
  const queueResponse = await fetch(`${apiUrl}/api/v3/queue`, {
    headers,
    signal: AbortSignal.timeout(10000),
  });
  const queue = await parseQueueResponse(queueResponse);

  // Récupérer le calendrier (prochains épisodes)
  const calendarResponse = await fetch(
    `${apiUrl}/api/v3/calendar?start=${new Date().toISOString()}&end=${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}`,
    {
      headers,
      signal: AbortSignal.timeout(10000),
    }
  );

  const upcomingEpisodes: SonarrUpcomingEpisode[] = [];
  if (calendarResponse.ok) {
    const calendarData = await calendarResponse.json();
    const episodes = calendarData.slice(0, 10); // Limiter à 10 prochains épisodes

    for (const episode of episodes) {
      upcomingEpisodes.push({
        seriesTitle: episode.series?.title || "Unknown",
        episodeTitle: episode.title || "Unknown",
        seasonNumber: episode.seasonNumber || 0,
        episodeNumber: episode.episodeNumber || 0,
        airDate: episode.airDate || "",
        airDateUtc: episode.airDateUtc || "",
      });
    }
  }

  return {
    totalSeries,
    totalEpisodes,
    queuePending: queue.pending,
    queueDownloading: queue.downloading,
    queueCompleted: queue.completed,
    queueFailed: queue.failed,
    upcomingEpisodes,
    queueStats: queue,
  };
}
