/**
 * Handler API pour la route des statistiques Lidarr
 *
 * GET /api/apps/[id]/stats/lidarr
 *
 * Récupère les statistiques depuis l'API Lidarr
 */

import {
  createCardStatsRoute,
  getAppUrl,
  getCredential,
  parseQueueResponse,
  CardConfigError,
} from "@/lib/card-route";
import type { LidarrStats } from "./types";

export const GET = createCardStatsRoute<LidarrStats>({
  templateId: "lidarr",
  templateLabel: "Lidarr",
  fetchStats: async (app) => {
    const apiUrl = getAppUrl(app);
    const apiKey = getCredential(app, "apiKey", "lidarrApiKey");

    if (!apiKey) {
      throw new CardConfigError(
        "Clé API non configurée. Veuillez configurer la clé API dans les paramètres de l'application."
      );
    }
    if (!apiUrl) {
      throw new CardConfigError(
        "URL non configurée. Veuillez configurer l'URL du serveur Lidarr dans les paramètres de l'application."
      );
    }

    return fetchLidarrStats(apiUrl, apiKey);
  },
});

/**
 * Récupère les statistiques depuis l'API Lidarr
 */
async function fetchLidarrStats(apiUrl: string, apiKey: string): Promise<LidarrStats> {
  const headers = {
    "X-Api-Key": apiKey,
    Accept: "application/json",
  };

  // Récupérer les artistes
  const artistsResponse = await fetch(`${apiUrl}/api/v1/artist`, {
    headers,
    signal: AbortSignal.timeout(10000),
  });

  if (!artistsResponse.ok) {
    throw new Error(`Erreur API Lidarr: ${artistsResponse.status}`);
  }

  const artists = await artistsResponse.json();
  const totalArtists = artists.length || 0;

  // Récupérer les albums
  const albumsResponse = await fetch(`${apiUrl}/api/v1/album`, {
    headers,
    signal: AbortSignal.timeout(10000),
  });

  let totalAlbums = 0;
  let downloadedAlbums = 0;
  let missingAlbums = 0;

  if (albumsResponse.ok) {
    const albums = await albumsResponse.json();
    totalAlbums = albums.length || 0;

    for (const album of albums) {
      if (album.statistics?.trackCount > 0 && album.statistics?.sizeOnDisk > 0) {
        downloadedAlbums++;
      } else {
        missingAlbums++;
      }
    }
  }

  // Récupérer la queue
  const queueResponse = await fetch(`${apiUrl}/api/v1/queue`, {
    headers,
    signal: AbortSignal.timeout(10000),
  });
  const queue = await parseQueueResponse(queueResponse);

  return {
    totalArtists,
    totalAlbums,
    downloadedAlbums,
    missingAlbums,
    queuePending: queue.pending,
    queueDownloading: queue.downloading,
    queueCompleted: queue.completed,
    queueFailed: queue.failed,
    queueStats: queue,
  };
}
