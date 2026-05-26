/**
 * Tests d'intégration pour le handler de statistiques Sonarr
 *
 * Vérifie le câblage factory + récupération + agrégation de la file
 * (le squelette commun est testé séparément dans lib/card-route.test.ts).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GET } from "@/cards/sonarr/route";
import { readApps } from "@/lib/db";
import { createTestApp } from "../setup/test-helpers";

vi.mock("@/lib/db", () => ({
  readApps: vi.fn(),
}));

function callRoute(id: string) {
  return GET({} as any, { params: Promise.resolve({ id }) });
}

const sonarrApp = createTestApp({
  id: "sonarr1",
  url: "https://sonarr.example.com/",
  statsConfig: { templateId: "sonarr" },
});
(sonarrApp as any).apiKey = "secret-key";

function jsonResponse(body: unknown, ok = true) {
  return { ok, status: ok ? 200 : 500, json: async () => body } as unknown as Response;
}

describe("Sonarr stats route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readApps).mockResolvedValue([sonarrApp]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retourne 400 si la clé API est absente", async () => {
    const noKey = createTestApp({ id: "nokey", statsConfig: { templateId: "sonarr" } });
    vi.mocked(readApps).mockResolvedValue([noKey]);

    const response = await callRoute("nokey");
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("Clé API");
  });

  it("agrège séries, épisodes, file et calendrier", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/api/v3/series")) {
        return jsonResponse([
          { statistics: { episodeCount: 10 } },
          { statistics: { episodeCount: 5 } },
        ]);
      }
      if (url.includes("/api/v3/queue")) {
        return jsonResponse({
          records: [{ status: "downloading" }, { status: "queued" }, { status: "completed" }],
        });
      }
      if (url.includes("/api/v3/calendar")) {
        return jsonResponse([
          {
            series: { title: "Show" },
            title: "Episode",
            seasonNumber: 1,
            episodeNumber: 2,
            airDate: "2026-01-01",
            airDateUtc: "2026-01-01T00:00:00Z",
          },
        ]);
      }
      throw new Error(`URL inattendue: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await callRoute("sonarr1");
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.totalSeries).toBe(2);
    expect(json.totalEpisodes).toBe(15);
    expect(json.queueStats).toEqual({
      total: 3,
      pending: 1,
      downloading: 1,
      completed: 1,
      failed: 0,
    });
    expect(json.queuePending).toBe(1);
    expect(json.upcomingEpisodes).toHaveLength(1);
    expect(json.upcomingEpisodes[0].seriesTitle).toBe("Show");

    // L'URL doit être normalisée (sans slash final)
    expect(fetchMock).toHaveBeenCalledWith(
      "https://sonarr.example.com/api/v3/series",
      expect.anything()
    );
  });

  it("retourne 500 si l'API séries échoue", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(null, false));
    vi.stubGlobal("fetch", fetchMock);

    const response = await callRoute("sonarr1");
    expect(response.status).toBe(500);
  });
});
