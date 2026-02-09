// api/recordings/delete.js
import { kv } from "@vercel/kv";
import { del } from "@vercel/blob";
import { getViewer } from "../_utils/whop.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const viewer = getViewer(req);

    const { id } = req.body || {};
    if (!id) return res.status(400).json({ ok: false, error: "Missing id" });

    // Load all recordings, find target
    const raw = await kv.lrange("recordings", 0, 500);
    const parsed = raw
      .map((r) => {
        try {
          return JSON.parse(r);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const target = parsed.find((x) => x.id === id);
    if (!target) return res.status(404).json({ ok: false, error: "Not found" });

    const isOwner = target.ownerUserId === viewer.userId;

    // POLICY:
    // - Admin: delete any
    // - User: delete only own
    if (!viewer.isAdmin && !isOwner) {
      return res.status(403).json({ ok: false, error: "Not allowed" });
    }

    // Remove from KV list (filter + rewrite)
    const remaining = parsed.filter((x) => x.id !== id);

    await kv.del("recordings");
    if (remaining.length) {
      await kv.rpush("recordings", ...remaining.map((x) => JSON.stringify(x)));
    }

    // Delete blob if present
    if (target.url) {
      try {
        await del(target.url);
      } catch {
        // ignore blob delete failure so KV delete still works
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    const status = err?.statusCode || 500;
    return res.status(status).json({
      ok: false,
      error: err?.message || "Delete failed",
    });
  }
}