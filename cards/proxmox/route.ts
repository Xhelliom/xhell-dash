/**
 * Handler API pour la route des statistiques Proxmox
 *
 * GET /api/apps/[id]/stats/proxmox
 *
 * Récupère les statistiques depuis l'API Proxmox
 */

import { createCardStatsRoute, getAppUrl, getCredential, CardConfigError } from "@/lib/card-route";
import type { ProxmoxStats, ProxmoxNode } from "./types";

export const GET = createCardStatsRoute<ProxmoxStats>({
  templateId: "proxmox",
  templateLabel: "Proxmox",
  fetchStats: async (app) => {
    const apiUrl = getAppUrl(app);
    const username = getCredential(app, "username", "proxmoxUsername");
    const password = getCredential(app, "password", "proxmoxPassword");
    const token = getCredential(app, "token", "proxmoxToken");

    if (!apiUrl) {
      throw new CardConfigError(
        "URL non configurée. Veuillez configurer l'URL du serveur Proxmox dans les paramètres de l'application."
      );
    }

    // Proxmox nécessite soit username/password, soit un token
    if (!token && (!username || !password)) {
      throw new CardConfigError(
        "Authentification non configurée. Veuillez configurer soit un token, soit un nom d'utilisateur et un mot de passe dans les paramètres de l'application."
      );
    }

    return fetchProxmoxStats(apiUrl, username, password, token);
  },
});

/**
 * Récupère un ticket d'authentification Proxmox
 */
async function getProxmoxTicket(
  apiUrl: string,
  username: string,
  password: string
): Promise<string> {
  const response = await fetch(`${apiUrl}/api2/json/access/ticket`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      username,
      password,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Erreur d'authentification Proxmox: ${response.status}`);
  }

  const data = await response.json();
  return data.data.ticket;
}

/**
 * Récupère les statistiques depuis l'API Proxmox
 *
 * @param apiUrl - URL de base de l'API Proxmox
 * @param username - Nom d'utilisateur (optionnel si token fourni)
 * @param password - Mot de passe (optionnel si token fourni)
 * @param token - Token d'authentification (optionnel)
 * @returns Les statistiques formatées
 */
async function fetchProxmoxStats(
  apiUrl: string,
  username?: string,
  password?: string,
  token?: string
): Promise<ProxmoxStats> {
  let authHeader: string;

  // Obtenir le ticket ou utiliser le token
  if (token) {
    authHeader = `PVEAPIToken=${token}`;
  } else if (username && password) {
    const ticket = await getProxmoxTicket(apiUrl, username, password);
    authHeader = `PVEAuthCookie=${ticket}`;
  } else {
    throw new Error("Authentification requise");
  }

  const headers = {
    Authorization: authHeader,
    Accept: "application/json",
  };

  // Récupérer les nœuds
  const nodesResponse = await fetch(`${apiUrl}/api2/json/nodes`, {
    headers,
    signal: AbortSignal.timeout(10000),
  });

  if (!nodesResponse.ok) {
    throw new Error(`Erreur API Proxmox: ${nodesResponse.status}`);
  }

  const nodesData = await nodesResponse.json();
  const nodes: ProxmoxNode[] = nodesData.data || [];
  const totalNodes = nodes.length;

  let totalVMs = 0;
  let totalContainers = 0;
  let activeVMs = 0;
  let inactiveVMs = 0;
  let activeContainers = 0;
  let inactiveContainers = 0;
  let totalCpu = 0;
  let totalMaxCpu = 0;
  let totalMem = 0;
  let totalMaxMem = 0;

  // Pour chaque nœud, récupérer les VMs et containers
  for (const node of nodes) {
    // Récupérer les VMs QEMU
    try {
      const qemuResponse = await fetch(`${apiUrl}/api2/json/nodes/${node.node}/qemu`, {
        headers,
        signal: AbortSignal.timeout(5000),
      });

      if (qemuResponse.ok) {
        const qemuData = await qemuResponse.json();
        const vms = qemuData.data || [];
        totalVMs += vms.length;

        for (const vm of vms) {
          if (vm.status === "running") {
            activeVMs++;
          } else {
            inactiveVMs++;
          }
        }
      }
    } catch (error) {
      console.warn(`Impossible de récupérer les VMs pour le nœud ${node.node}:`, error);
    }

    // Récupérer les containers LXC
    try {
      const lxcResponse = await fetch(`${apiUrl}/api2/json/nodes/${node.node}/lxc`, {
        headers,
        signal: AbortSignal.timeout(5000),
      });

      if (lxcResponse.ok) {
        const lxcData = await lxcResponse.json();
        const containers = lxcData.data || [];
        totalContainers += containers.length;

        for (const container of containers) {
          if (container.status === "running") {
            activeContainers++;
          } else {
            inactiveContainers++;
          }
        }
      }
    } catch (error) {
      console.warn(`Impossible de récupérer les containers pour le nœud ${node.node}:`, error);
    }

    // Accumuler les ressources
    totalCpu += node.cpu || 0;
    totalMaxCpu += node.maxcpu || 1;
    totalMem += node.mem || 0;
    totalMaxMem += node.maxmem || 0;
  }

  // Calculer les pourcentages
  const cpuUsage = totalMaxCpu > 0 ? (totalCpu / totalMaxCpu) * 100 : 0;
  const memoryUsage = totalMaxMem > 0 ? (totalMem / totalMaxMem) * 100 : 0;

  return {
    totalNodes,
    totalVMs,
    totalContainers,
    activeVMs,
    inactiveVMs,
    activeContainers,
    inactiveContainers,
    cpuUsage,
    memoryUsage,
    memoryTotal: totalMaxMem,
    memoryUsed: totalMem,
    nodes,
  };
}
