// api/recordings/list.js
import { kv } from "@vercel/kv";
import { getViewer } from "../_utils/whop.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // Auth required (must be inside Whop iframe so cookie exists)
    getViewer(req);

    // PUBLIC FEED: return all recordings to everyone
    const raw = await kv.lrange("recordings", 0, 200); // adjust count if you want
    const items = raw
      .map((r) => {
        try {
          return JSON.parse(r);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return res.status(200).json({ ok: true, items });
  } catch (err) {
    const status = err?.statusCode || 500;
    return res.status(status).json({
      ok: false,
      error: err?.message || "Failed to load recordings",
    });
  }
}