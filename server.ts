import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { createClient } from "@vercel/kv";
import dotenv from "dotenv";

dotenv.config();

// Ensure credentials exist for the KV client
const KV_URL = "https://awaited-drake-76193.upstash.io";
const KV_TOKEN = "gQAAAAAAASmhAAIncDFiOGQ3N2EyNWRmNzM0NzdlOGM4MDVhZWMyY2NiZTJiMXAxNzYxOTM";

let kv: any = null;
try {
  kv = createClient({
    url: process.env.KV_REST_API_URL || KV_URL,
    token: process.env.KV_REST_API_TOKEN || KV_TOKEN,
  });
} catch (e) {
  console.warn("Could not initialize Vercel KV client:", e);
}

// Local File Persistence & In-Memory Cache
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}

const DATA_FILE = path.join(DATA_DIR, "timeline-app-data.json");
const SNAPSHOTS_FILE = path.join(DATA_DIR, "snapshots.json");

let inMemoryData: any = null;
let inMemorySnapshots: string[] = [];
let isUpstashSuspended = false;
let lastSuspensionTime = 0;
const SUSPENSION_RETRY_INTERVAL = 60 * 1000; // Check Upstash again after 60s

// Load persisted local data on startup
try {
  if (fs.existsSync(DATA_FILE)) {
    inMemoryData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    console.log("Loaded local timeline data from disk, timestamp:", inMemoryData?.timestamp);
  }
} catch (e) {
  console.error("Failed to load local timeline data from disk:", e);
}

try {
  if (fs.existsSync(SNAPSHOTS_FILE)) {
    inMemorySnapshots = JSON.parse(fs.readFileSync(SNAPSHOTS_FILE, "utf-8"));
  }
} catch (e) {
  console.error("Failed to load local snapshots from disk:", e);
}

const saveLocalData = (data: any) => {
  inMemoryData = data;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write timeline data to disk:", e);
  }
};

const saveLocalSnapshot = (snapshotId: string, data: any) => {
  try {
    const snapFile = path.join(DATA_DIR, `${snapshotId}.json`);
    fs.writeFileSync(snapFile, typeof data === 'string' ? data : JSON.stringify(data), "utf-8");
    if (!inMemorySnapshots.includes(snapshotId)) {
      inMemorySnapshots.push(snapshotId);
      fs.writeFileSync(SNAPSHOTS_FILE, JSON.stringify(inMemorySnapshots.slice(-50)), "utf-8");
    }
  } catch (e) {
    console.error("Failed to write snapshot to disk:", e);
  }
};

// Safe KV getters and setters that never crash the server and minimize Upstash bandwidth
async function safeKvGet(key: string): Promise<any> {
  // If Upstash was suspended, allow a test retry after cooldown
  if (isUpstashSuspended && Date.now() - lastSuspensionTime < SUSPENSION_RETRY_INTERVAL) {
    if (key === "timeline-app-data") return inMemoryData;
    if (key === "all_snapshots") return inMemorySnapshots;
    return null;
  }

  // If we already have in-memory data, serve from memory cache to avoid unnecessary Upstash reads
  if (key === "timeline-app-data" && inMemoryData) {
    return inMemoryData;
  }
  if (key === "all_snapshots" && inMemorySnapshots.length > 0) {
    return inMemorySnapshots;
  }
  if (!kv) {
    if (key === "timeline-app-data") return inMemoryData;
    if (key === "all_snapshots") return inMemorySnapshots;
    return null;
  }

  try {
    const data = await kv.get(key);
    // If successfully reached Upstash after suspension, unmark suspended
    if (isUpstashSuspended) {
      console.log("Upstash connection successfully restored!");
      isUpstashSuspended = false;
    }
    if (key === "timeline-app-data" && data) {
      saveLocalData(data);
    }
    return data;
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes("limit") || msg.includes("exceeded") || msg.includes("403")) {
      isUpstashSuspended = true;
      lastSuspensionTime = Date.now();
      console.warn("Upstash limit exceeded; using server-side local storage fallback.");
    } else {
      console.warn(`Upstash KV get("${key}") failed:`, msg);
    }
    if (key === "timeline-app-data") return inMemoryData;
    if (key === "all_snapshots") return inMemorySnapshots;
    return null;
  }
}

async function safeKvSet(key: string, value: any): Promise<boolean> {
  // Always update in-memory and local disk first for reliable persistence
  if (key === "timeline-app-data") {
    saveLocalData(value);
  }

  // If Upstash was suspended and cooldown hasn't elapsed, skip Upstash network call
  if (!kv || (isUpstashSuspended && Date.now() - lastSuspensionTime < SUSPENSION_RETRY_INTERVAL)) {
    return true;
  }

  try {
    await kv.set(key, value);
    if (isUpstashSuspended) {
      console.log("Upstash write connection successfully restored!");
      isUpstashSuspended = false;
    }
    return true;
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes("limit") || msg.includes("exceeded") || msg.includes("403")) {
      isUpstashSuspended = true;
      lastSuspensionTime = Date.now();
      console.warn("Upstash limit exceeded on write; using server-side local storage fallback.");
    } else {
      console.warn(`Upstash KV set("${key}") warning:`, msg);
    }
    return true; // Return true because local save succeeded
  }
}

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Lightweight version check endpoint (transfers ~25 bytes instead of 1MB+)
app.get("/api/version", (req, res) => {
  const ts = inMemoryData?.timestamp || 0;
  res.json({ timestamp: ts, upstashSuspended: isUpstashSuspended });
});

// API to save snapshot
app.post("/api/save-snapshot", async (req, res) => {
  try {
    const { data } = req.body;
    const timestamp = new Date().toISOString();
    const snapshotId = `snapshot_${timestamp}`;
    
    saveLocalSnapshot(snapshotId, data);
    await safeKvSet(snapshotId, data);
    await safeKvSet("all_snapshots", inMemorySnapshots);

    res.json({ success: true, snapshotId });
  } catch (error: any) {
    console.error("Save snapshot error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/snapshots", async (req, res) => {
  try {
    const snapshots = (await safeKvGet("all_snapshots") as string[]) || inMemorySnapshots || [];
    res.json({ snapshots });
  } catch (error: any) {
    console.error("Get snapshots error:", error);
    res.json({ snapshots: inMemorySnapshots });
  }
});

// Current local history save
app.post("/api/save-history", async (req, res) => {
  try {
    const { history, timestamp } = req.body;
    const ts = timestamp || Date.now();
    const data = { collections: typeof history === 'string' ? history : JSON.stringify(history), timestamp: ts };
    
    await safeKvSet("timeline-app-data", data);
    res.json({ success: true, timestamp: ts, upstashSuspended: isUpstashSuspended });
  } catch (error: any) {
    console.error("Save history error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/history", async (req, res) => {
  try {
    const data = await safeKvGet("timeline-app-data");
    res.json({ result: data, upstashSuspended: isUpstashSuspended });
  } catch (error: any) {
    console.error("Error in /api/history:", error);
    res.json({ result: inMemoryData, upstashSuspended: isUpstashSuspended });
  }
});

// GET current timeline data for n8n
app.get(["/api/webhook/n8n", "/api/n8n-sync"], async (req, res) => {
  try {
    const data = await safeKvGet("timeline-app-data");
    res.json({ success: true, data });
  } catch (error: any) {
    res.json({ success: true, data: inMemoryData });
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
      const current: any = (await safeKvGet("timeline-app-data")) || { collections: "[]" };
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

    await safeKvSet("timeline-app-data", stateToSave);
    
    const snapshotId = `n8n_sync_${timestamp}`;
    saveLocalSnapshot(snapshotId, stateToSave.collections);
    await safeKvSet(snapshotId, stateToSave.collections);
    await safeKvSet("all_snapshots", inMemorySnapshots.slice(-50));

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
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

export default app;
