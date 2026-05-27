/**
 * Tests pour les helpers partagés des routes de statistiques de cartes
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  CardConfigError,
  getAppUrl,
  getCredential,
  parseQueueRecords,
  parseQueueResponse,
  createCardStatsRoute,
  STATS_CACHE_HEADERS,
} from "@/lib/card-route";
import { readApps } from "@/lib/db";
import { createTestApp } from "../setup/test-helpers";

vi.mock("@/lib/db", () => ({
  readApps: vi.fn(),
}));

function callRoute(handler: ReturnType<typeof createCardStatsRoute>, id: string) {
  return handler({} as any, { params: Promise.resolve({ id }) });
}

describe("getAppUrl", () => {
  it("supprime le slash final", () => {
    expect(getAppUrl(createTestApp({ url: "https://example.com/" }))).toBe("https://example.com");
  });

  it("retourne une chaîne vide si l'URL est absente", () => {
    expect(getAppUrl(createTestApp({ url: "" }))).toBe("");
  });
});

describe("getCredential", () => {
  it("retourne le premier champ non vide", () => {
    const app = createTestApp();
    (app as any).apiKey = "primary";
    (app as any).sonarrApiKey = "fallback";
    expect(getCredential(app, "apiKey", "sonarrApiKey")).toBe("primary");
  });

  it("utilise le champ de repli si le premier est vide", () => {
    const app = createTestApp();
    (app as any).apiKey = "";
    (app as any).sonarrApiKey = "fallback";
    expect(getCredential(app, "apiKey", "sonarrApiKey")).toBe("fallback");
  });

  it("retourne undefined si aucun champ n'est défini", () => {
    expect(getCredential(createTestApp(), "apiKey", "sonarrApiKey")).toBeUndefined();
  });

  it("ignore les valeurs non-string", () => {
    const app = createTestApp();
    (app as any).apiKey = 42;
    expect(getCredential(app, "apiKey")).toBeUndefined();
  });
});

describe("parseQueueRecords", () => {
  it("agrège les statuts par catégorie", () => {
    const queue = parseQueueRecords([
      { status: "queued" },
      { status: "paused" },
      { status: "downloading" },
      { status: "completed" },
      { status: "failed" },
      { status: "warning" },
    ]);
    expect(queue).toEqual({ total: 6, pending: 2, downloading: 1, completed: 1, failed: 2 });
  });

  it("ignore les statuts inconnus et insensibilise la casse", () => {
    const queue = parseQueueRecords([{ status: "DOWNLOADING" }, { status: "unknown" }, {}]);
    expect(queue).toEqual({ total: 1, pending: 0, downloading: 1, completed: 0, failed: 0 });
  });

  it("retourne une file vide pour une liste vide", () => {
    expect(parseQueueRecords([])).toEqual({
      total: 0,
      pending: 0,
      downloading: 0,
      completed: 0,
      failed: 0,
    });
  });
});

describe("parseQueueResponse", () => {
  it("retourne une file vide si la réponse a échoué", async () => {
    const response = { ok: false, json: vi.fn() } as unknown as Response;
    const queue = await parseQueueResponse(response);
    expect(queue.total).toBe(0);
    expect(response.json).not.toHaveBeenCalled();
  });

  it("parse les enregistrements si la réponse est OK", async () => {
    const response = {
      ok: true,
      json: async () => ({ records: [{ status: "downloading" }, { status: "queued" }] }),
    } as unknown as Response;
    const queue = await parseQueueResponse(response);
    expect(queue).toEqual({ total: 2, pending: 1, downloading: 1, completed: 0, failed: 0 });
  });
});

describe("createCardStatsRoute", () => {
  const fetchStats = vi.fn();
  const handler = createCardStatsRoute({
    templateId: "demo",
    templateLabel: "Demo",
    fetchStats,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne 404 si l'application est introuvable", async () => {
    vi.mocked(readApps).mockResolvedValue([]);
    const response = await callRoute(handler, "missing");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Application non trouvée" });
    expect(fetchStats).not.toHaveBeenCalled();
  });

  it("retourne 400 si le template ne correspond pas", async () => {
    vi.mocked(readApps).mockResolvedValue([
      createTestApp({ id: "app1", statsConfig: { templateId: "autre" } }),
    ]);
    const response = await callRoute(handler, "app1");
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("Demo");
  });

  it("retourne 200 avec les stats et les en-têtes de cache", async () => {
    vi.mocked(readApps).mockResolvedValue([
      createTestApp({ id: "app1", statsConfig: { templateId: "demo" } }),
    ]);
    fetchStats.mockResolvedValue({ value: 42 });

    const response = await callRoute(handler, "app1");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ value: 42 });
    expect(response.headers.get("Cache-Control")).toBe(STATS_CACHE_HEADERS["Cache-Control"]);
    expect(fetchStats).toHaveBeenCalledOnce();
  });

  it("mappe CardConfigError sur son statut et inclut le hint", async () => {
    vi.mocked(readApps).mockResolvedValue([
      createTestApp({ id: "app1", statsConfig: { templateId: "demo" } }),
    ]);
    fetchStats.mockRejectedValue(new CardConfigError("Clé manquante", 400, "Configurez la clé"));

    const response = await callRoute(handler, "app1");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Clé manquante", hint: "Configurez la clé" });
  });

  it("retourne 504 sur un timeout", async () => {
    vi.mocked(readApps).mockResolvedValue([
      createTestApp({ id: "app1", statsConfig: { templateId: "demo" } }),
    ]);
    const timeout = new Error("aborted");
    timeout.name = "TimeoutError";
    fetchStats.mockRejectedValue(timeout);

    const response = await callRoute(handler, "app1");

    expect(response.status).toBe(504);
  });

  it("retourne 500 sur une erreur générique", async () => {
    vi.mocked(readApps).mockResolvedValue([
      createTestApp({ id: "app1", statsConfig: { templateId: "demo" } }),
    ]);
    fetchStats.mockRejectedValue(new Error("Boom"));

    const response = await callRoute(handler, "app1");

    expect(response.status).toBe(500);
    expect((await response.json()).error).toBe("Boom");
  });
});
