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

  // n8n Integration Webhook
  // Authentication: Headers['x-api-key'] must match N8N_API_KEY env var
  const checkAuth = (req: any, res: any, next: any) => {
    const apiKey = req.headers['x-api-key'];
    const expectedKey = process.env.N8N_API_KEY || "temp-n8n-key-123"; // Fallback for dev
    if (!apiKey || apiKey !== expectedKey) {
      return res.status(401).json({ error: "Unauthorized: Invalid or missing x-api-key" });
    }
    next();
  };

  // GET current timeline data for n8n
  app.get("/api/webhook/n8n", checkAuth, async (req, res) => {
    try {
      const data = await kv.get("timeline-app-data");
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST/EDIT timeline data from n8n
  app.post("/api/webhook/n8n", checkAuth, async (req, res) => {
    try {
      const { data, source, action } = req.body;
      
      if (!data && action !== 'clear') {
        return res.status(400).json({ error: "Missing data in request body" });
      }

      console.log(`Received n8n ${action || 'update'} from source: ${source || 'unknown'}`);
      
      const timestamp = Date.now();
      let stateToSave: any;

      if (action === 'patch') {
        // Partial update logic could go here if we had a more granular structure
        // For now, we still save the whole chunk but mark it as a patch
        const current: any = await kv.get("timeline-app-data") || { collections: "[]" };
        stateToSave = {
          ...current,
          collections: typeof data === 'string' ? data : JSON.stringify(data),
          timestamp,
          updatedBy: `n8n-patch-${source || 'unknown'}`
        };
      } else {
        stateToSave = { 
          collections: typeof data === 'string' ? data : JSON.stringify(data), 
          timestamp,
          updatedBy: `n8n-${source || 'unknown'}`
        };
      }

      await kv.set("timeline-app-data", stateToSave);
      
      const snapshotId = `n8n_sync_${timestamp}`;
      await kv.set(snapshotId, stateToSave.collections);
      const snapshots = (await kv.get("all_snapshots") as string[]) || [];
      snapshots.push(snapshotId);
      await kv.set("all_snapshots", snapshots.slice(-50));

      res.json({ success: true, message: `Timeline ${action || 'updated'} via n8n`, timestamp });
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
