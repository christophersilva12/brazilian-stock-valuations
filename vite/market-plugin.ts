import fs from "node:fs/promises";
import path from "node:path";
import type { Plugin } from "vite";
import { fetchFundamentusSnapshot } from "./fundamentus";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

let cache: { data: unknown; at: number } | null = null;
let inflight: Promise<unknown> | null = null;

async function getSnapshot() {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.data;
  }
  if (inflight) return inflight;

  inflight = fetchFundamentusSnapshot()
    .then((data) => {
      cache = { data, at: Date.now() };
      return data;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

function jsonMiddleware() {
  return async (req: { url?: string }, res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void }, next: () => void) => {
    if (!req.url?.startsWith("/api/market/fundamentals")) {
      next();
      return;
    }

    try {
      const data = await getSnapshot();
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300");
      res.end(JSON.stringify(data));
    } catch (error) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : "fundamentals unavailable" }));
    }
  };
}

export function marketApiPlugin(): Plugin {
  return {
    name: "market-api",
    configureServer(server) {
      void getSnapshot().catch((error) => {
        server.config.logger.warn(`[market] prefetch failed: ${error}`);
      });
      server.middlewares.use(jsonMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(jsonMiddleware());
    },
    async writeBundle(options) {
      try {
        const data = await getSnapshot();
        const outDir = options.dir ?? path.resolve("dist");
        const target = path.join(outDir, "market", "fundamentals.json");
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, JSON.stringify(data));
      } catch (error) {
        console.warn("[market] could not write fundamentals snapshot", error);
      }
    },
  };
}
