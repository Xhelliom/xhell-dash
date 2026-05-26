/**
 * Helpers partagés pour les handlers de statistiques des cartes
 *
 * Chaque carte expose un handler `GET /api/apps/[id]/stats/[templateId]`.
 * Ces handlers partageaient le même squelette (lecture de l'app, vérification
 * du template, extraction des identifiants, gestion d'erreurs, en-têtes de
 * cache). Ce module centralise ce squelette pour éviter la duplication.
 */

import { NextRequest, NextResponse } from "next/server";
import { readApps } from "@/lib/db";
import type { App } from "@/lib/types";

/**
 * En-têtes de cache appliqués aux réponses de statistiques :
 * revalidation toutes les 5 minutes, stale-while-revalidate pendant 10 minutes.
 */
export const STATS_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
} as const;

/**
 * Erreur de configuration d'une carte (identifiants manquants, URL absente…).
 * Le statut HTTP associé est renvoyé tel quel par {@link createCardStatsRoute}.
 */
export class CardConfigError extends Error {
  readonly status: number;
  readonly hint?: string;

  constructor(message: string, status = 400, hint?: string) {
    super(message);
    this.name = "CardConfigError";
    this.status = status;
    this.hint = hint;
  }
}

/**
 * Normalise l'URL de base d'une application (supprime le slash final).
 */
export function getAppUrl(app: App): string {
  return app.url?.replace(/\/$/, "") || "";
}

/**
 * Récupère le premier identifiant non vide parmi les champs fournis.
 *
 * Les champs d'identifiants ne font pas partie de l'interface `App` typée
 * (ils dépendent de la carte), d'où l'accès indexé.
 */
export function getCredential(app: App, ...keys: string[]): string | undefined {
  const record = app as unknown as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

/**
 * Statistiques agrégées d'une file de téléchargement (Sonarr, Radarr, Lidarr).
 */
export interface QueueStats {
  total: number;
  pending: number;
  downloading: number;
  completed: number;
  failed: number;
}

const EMPTY_QUEUE: QueueStats = {
  total: 0,
  pending: 0,
  downloading: 0,
  completed: 0,
  failed: 0,
};

/**
 * Agrège les éléments d'une file *arr (Sonarr/Radarr/Lidarr) par statut.
 */
export function parseQueueRecords(records: Array<{ status?: string | null }>): QueueStats {
  let pending = 0;
  let downloading = 0;
  let completed = 0;
  let failed = 0;

  for (const item of records) {
    const status = item.status?.toLowerCase() || "";
    if (status === "queued" || status === "paused") {
      pending++;
    } else if (status === "downloading") {
      downloading++;
    } else if (status === "completed") {
      completed++;
    } else if (status === "failed" || status === "warning") {
      failed++;
    }
  }

  return { total: pending + downloading + completed + failed, pending, downloading, completed, failed };
}

/**
 * Récupère et agrège la file *arr depuis une réponse `fetch`.
 * Renvoie une file vide si la requête a échoué.
 */
export async function parseQueueResponse(queueResponse: Response): Promise<QueueStats> {
  if (!queueResponse.ok) {
    return { ...EMPTY_QUEUE };
  }
  const queueData = await queueResponse.json();
  return parseQueueRecords(queueData.records || []);
}

interface CardRouteOptions<T> {
  /** Identifiant du template attendu (ex: "sonarr"). */
  templateId: string;
  /** Libellé lisible utilisé dans les messages d'erreur (ex: "Sonarr"). */
  templateLabel: string;
  /** Récupère les statistiques pour une application validée. */
  fetchStats: (app: App) => Promise<T>;
}

/**
 * Construit un handler `GET` de statistiques de carte.
 *
 * Le handler gère le squelette commun : lecture de l'app, vérification du
 * template, en-têtes de cache et gestion d'erreurs. La récupération des
 * statistiques (et la validation des identifiants via {@link CardConfigError})
 * est déléguée à `fetchStats`.
 */
export function createCardStatsRoute<T>({
  templateId,
  templateLabel,
  fetchStats,
}: CardRouteOptions<T>) {
  return async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ): Promise<NextResponse> {
    try {
      const { id } = await params;
      const apps = await readApps();
      const app = apps.find((a) => a.id === id);

      if (!app) {
        return NextResponse.json({ error: "Application non trouvée" }, { status: 404 });
      }

      if (app.statsConfig?.templateId !== templateId) {
        return NextResponse.json(
          { error: `Cette route est réservée aux applications avec le template ${templateLabel}` },
          { status: 400 }
        );
      }

      const stats = await fetchStats(app);

      return NextResponse.json(stats, { status: 200, headers: STATS_CACHE_HEADERS });
    } catch (error: unknown) {
      if (error instanceof CardConfigError) {
        return NextResponse.json(
          error.hint ? { error: error.message, hint: error.hint } : { error: error.message },
          { status: error.status }
        );
      }

      console.error(`Erreur lors de la récupération des stats ${templateLabel}:`, error);

      const err = error as { name?: string; message?: string };
      if (err.name === "TimeoutError" || err.name === "AbortError") {
        return NextResponse.json(
          { error: "Timeout lors de la récupération des statistiques" },
          { status: 504 }
        );
      }

      return NextResponse.json(
        { error: err.message || `Impossible de récupérer les statistiques ${templateLabel}` },
        { status: 500 }
      );
    }
  };
}
