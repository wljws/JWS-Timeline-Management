import { createClient } from "@vercel/kv";

const FALLBACK_KV_URL = "https://awaited-drake-76193.upstash.io";
const FALLBACK_KV_TOKEN = "gQAAAAAAASmhAAIgcDEzMTMyNGNlMThjZmY0NTUwOTAzMTgxYzg0MjBiMDY3ZQ";

function getKVClient() {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    FALLBACK_KV_URL;
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    FALLBACK_KV_TOKEN;

  try {
    return createClient({ url, token });
  } catch (e) {
    console.error("Failed to initialize KV client:", e);
    return null;
  }
}

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const kv = getKVClient();
  const rawUrl = req.url || "";
  const path = rawUrl.split("?")[0].toLowerCase();
  const method = (req.method || "GET").toUpperCase();

  // Helper to parse JSON body
  let body = req.body;
  if (typeof body === "string" && body.length > 0) {
    try {
      body = JSON.parse(body);
    } catch (e) {}
  }

  try {
    // 1. Version check
    if (path.endsWith("/version")) {
      let ts = Date.now();
      if (kv) {
        try {
          const data: any = await kv.get("timeline-app-data");
          if (data && data.timestamp) ts = data.timestamp;
        } catch (e) {}
      }
      return res.status(200).json({ timestamp: ts, upstashSuspended: false });
    }

    // 2. History (GET /api/history)
    if (path.endsWith("/history") && method === "GET") {
      let data = null;
      if (kv) {
        try {
          data = await kv.get("timeline-app-data");
        } catch (e: any) {
          console.warn("KV get timeline-app-data failed:", e?.message);
        }
      }
      return res.status(200).json({ result: data, upstashSuspended: false });
    }

    // 3. Save History (POST /api/save-history or POST /api/history)
    if (path.endsWith("/save-history") || (path.endsWith("/history") && method === "POST")) {
      const history = body?.history ?? body?.collections ?? body;
      const ts = body?.timestamp || Date.now();
      const dataToSave = {
        collections: typeof history === "string" ? history : JSON.stringify(history),
        timestamp: ts,
      };

      if (kv) {
        try {
          await kv.set("timeline-app-data", dataToSave);
        } catch (e: any) {
          console.warn("KV set timeline-app-data failed:", e?.message);
        }
      }
      return res.status(200).json({ success: true, timestamp: ts });
    }

    // 4. Snapshots (GET /api/snapshots)
    if (path.endsWith("/snapshots") && method === "GET") {
      let snapshots: any[] = [];
      if (kv) {
        try {
          snapshots = (await kv.get("all_snapshots")) || [];
        } catch (e) {}
      }
      return res.status(200).json({ snapshots });
    }

    // 5. Save Snapshot (POST /api/save-snapshot)
    if (path.endsWith("/save-snapshot") && method === "POST") {
      const snapshotData = body?.data;
      const timestamp = new Date().toISOString();
      const snapshotId = `snapshot_${timestamp}`;

      if (kv && snapshotData) {
        try {
          await kv.set(snapshotId, snapshotData);
          const currentSnapshots: any[] = (await kv.get("all_snapshots")) || [];
          currentSnapshots.unshift(snapshotId);
          await kv.set("all_snapshots", currentSnapshots.slice(0, 50));
        } catch (e) {}
      }
      return res.status(200).json({ success: true, snapshotId });
    }

    // 6. n8n webhook
    if (path.includes("webhook") || path.includes("n8n")) {
      if (method === "GET") {
        let data = null;
        if (kv) {
          try {
            data = await kv.get("timeline-app-data");
          } catch (e) {}
        }
        return res.status(200).json({ success: true, data });
      } else {
        const { data } = body || {};
        const timestamp = Date.now();
        const stateToSave = {
          collections: typeof data === "string" ? data : JSON.stringify(data),
          timestamp,
          updatedBy: "n8n-webhook",
        };
        if (kv) {
          try {
            await kv.set("timeline-app-data", stateToSave);
          } catch (e) {}
        }
        return res.status(200).json({ success: true, timestamp });
      }
    }

    // Default fallback
    return res.status(200).json({ status: "ok", url: req.url });
  } catch (error: any) {
    console.error("Handler error:", error);
    return res.status(200).json({ result: null, error: error?.message || "Internal error" });
  }
}
