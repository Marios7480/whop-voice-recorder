import { kv } from "@vercel/kv";
import { requireViewer } from "../_lib/whop.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const viewer = requireViewer(req);

    const raw = await kv.lrange("recordings", 0, 200);
    const items = raw
      .map((r) => {
        try {
          return JSON.parse(r);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return res.status(200).json({
      ok: true,
      viewer: {
        userId: viewer.userId,
        name: viewer.name || null,
        isAdmin: viewer.isAdmin,
      },
      items,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      ok: false,
      error: err.message || "Failed to load recordings",
    });
  }
}