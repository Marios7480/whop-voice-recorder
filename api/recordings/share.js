import { kv } from "@vercel/kv";
import { requireViewer } from "../_lib/whop.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const viewer = requireViewer(req);

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { id, shared } = body || {};

    if (!id) return res.status(400).json({ ok: false, error: "Missing id" });

    const raw = await kv.lrange("recordings", 0, 500);
    const items = raw.map((r) => JSON.parse(r));

    const idx = items.findIndex((x) => x.id === id);
    if (idx === -1) return res.status(404).json({ ok: false, error: "Not found" });

    const item = items[idx];
    const canEdit = viewer.isAdmin || item.ownerUserId === viewer.userId;
    if (!canEdit) return res.status(403).json({ ok: false, error: "Forbidden" });

    item.shared = Boolean(shared);

    // Re-write list (simple approach for now)
    await kv.del("recordings");
    for (const it of items) {
      await kv.rpush("recordings", JSON.stringify(it));
    }

    return res.status(200).json({ ok: true, item });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Failed" });
  }
}