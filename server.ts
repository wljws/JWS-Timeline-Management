import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createClient } from "@vercel/kv";
import dotenv from "dotenv";

dotenv.config();

// Ensure credentials exist for the KV client
const KV_URL = "https://awaited-drake-76193.upstash.io";
const KV_TOKEN = "gQAAAAAAASmhAAIncDFiOGQ3N2EyNWRmNzM0NzdlOGM4MDVhZWMyY2NiZTJiMXAxNzYxOTM";

const kv = createClient({
  url: process.env.KV_REST_API_URL || KV_URL,
  token: process.env.KV_REST_API_TOKEN || KV_TOKEN,
})

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
      
      await kv.set(snapshotId, data);
      
      // Keep a list of all snapshots
      const snapshots = (await kv.get("all_snapshots") as string[]) || [];
      snapshots.push(snapshotId);
      await kv.set("all_snapshots", snapshots);

      res.json({ success: true, snapshotId });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/snapshots", async (req, res) => {
    try {
      const snapshots = (await kv.get("all_snapshots") as string[]) || [];
      res.json({ snapshots });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Current local history save
  app.post("/api/save-history", async (req, res) => {
    try {
      const { history, timestamp } = req.body;
      const ts = timestamp || Date.now();
      const data = { collections: typeof history === 'string' ? history : JSON.stringify(history), timestamp: ts };
      await kv.set("timeline-app-data", data);
      res.json({ success: true });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/history", async (req, res) => {
    try {
      const data = await kv.get("timeline-app-data");
      res.json({ result: data });
    } catch (error: any) {
      console.error("Error in /api/history:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // n8n Integration Webhook (Option 1)
  // This endpoint allows n8n to push updates to the timeline.
  app.post("/api/webhook/n8n", async (req, res) => {
    try {
      const { data, source } = req.body;
      
      if (!data) {
        return res.status(400).json({ error: "Missing data in request body" });
      }

      console.log(`Received n8n update from source: ${source || 'unknown'}`);
      
      const timestamp = Date.now();
      const stateToSave = { 
        collections: typeof data === 'string' ? data : JSON.stringify(data), 
        timestamp,
        updatedBy: "n8n"
      };

      await kv.set("timeline-app-data", stateToSave);
      
      // Also log it in version history
      const snapshotId = `n8n_sync_${timestamp}`;
      await kv.set(snapshotId, stateToSave.collections);
      const snapshots = (await kv.get("all_snapshots") as string[]) || [];
      snapshots.push(snapshotId);
      await kv.set("all_snapshots", snapshots.slice(-50)); // Keep last 50

      res.json({ success: true, message: "Timeline updated via n8n", timestamp });
    } catch (error: any) {
      console.error("n8n Webhook Error:", error);
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
