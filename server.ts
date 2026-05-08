import express from "express";
import cors from "cors";
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

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// n8n Integration Webhook
// Authentication removed for simplification as requested.

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

// GET current timeline data for n8n
app.get(["/api/webhook/n8n", "/api/n8n-sync"], async (req, res) => {
  try {
    const data = await kv.get("timeline-app-data");
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST/EDIT timeline data from n8n
app.post(["/api/webhook/n8n", "/api/n8n-sync"], async (req, res) => {
  try {
    const { data, source, action } = req.body;
    
    if (!data && action !== 'clear') {
      return res.status(400).json({ error: "Missing data in request body" });
    }

    console.log(`Received n8n ${action || 'update'} from source: ${source || 'unknown'}`);
    
    const timestamp = Date.now();
    let stateToSave: any;

    if (action === 'patch') {
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

async function setupVite() {
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
}

// Only listen if not on Vercel
if (!process.env.VERCEL) {
  setupVite().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
} else {
  // On Vercel, we don't call listen, but we might still need to setup static serving
  // Note: Vercel normally serves static files automatically if they are in the right place.
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

export default app;
