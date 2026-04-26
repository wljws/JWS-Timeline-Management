import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Redis } from "@upstash/redis";
import dotenv from "dotenv";

dotenv.config();

// Hardcoded credentials for external users - User must fill these!
const HARDCODED_URL = "";
const HARDCODED_TOKEN = "";

function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL || HARDCODED_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || HARDCODED_TOKEN;

  if (!url || !token) {
    throw new Error("Upstash Redis credentials not set in environment variables or hardcoded values.");
  }
  return new Redis({
    url,
    token,
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API to save snapshot
  app.post("/api/save-snapshot", async (req, res) => {
    try {
      const { data } = req.body;
      const timestamp = new Date().toISOString();
      const snapshotId = `snapshot_${timestamp}`;
      
      const redis = getRedisClient();
      await redis.set(snapshotId, data);
      
      // Keep a list of all snapshots
      const snapshots = (await redis.get("all_snapshots") as string[]) || [];
      snapshots.push(snapshotId);
      await redis.set("all_snapshots", snapshots);

      res.json({ success: true, snapshotId });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/snapshots", async (req, res) => {
    try {
      const redis = getRedisClient();
      const snapshots = (await redis.get("all_snapshots") as string[]) || [];
      res.json({ snapshots });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Current local history save
  app.post("/api/save-history", async (req, res) => {
    try {
      const redis = getRedisClient();
      const { history, timestamp } = req.body;
      const ts = timestamp || Date.now();
      const data = { collections: typeof history === 'string' ? history : JSON.stringify(history), timestamp: ts };
      await redis.set("timeline-app-data", data);
      res.json({ success: true });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/history", async (req, res) => {
    try {
      const redis = getRedisClient();
      const data = await redis.get("timeline-app-data");
      res.json({ result: data });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
