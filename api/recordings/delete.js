import { kv } from "@vercel/kv";
import { del as delBlob } from "@vercel/blob";
import { verifyWhopFromHeaders } from "./_auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  let viewer;
  try {
    viewer = verifyWhopFromHeaders(req);
  } catch (e) {
    return res.status(401).json({ ok: false, error: e?.message || "Unauthorized" });
  }

  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ ok: false, error: "Missing id" });

    const raw = await kv.lrange("recordings", 0, 500);

    const parsed = raw
      .map((r) => {
        if (typeof r === "string") {
          try { return JSON.parse(r); } catch { return null; }
        }
        if (typeof r === "object" && r !== null) return r;
        return null;
      })
      .filter(Boolean);

    const item = parsed.find((x) => x.id === id);
    if (!item) return res.status(404).json({ ok: false, error: "Not found" });

    const ownerUserId = item.ownerUserId || item.userId || item.ownerId || null;
    const isOwner = ownerUserId && ownerUserId === viewer.userId;

    if (!viewer.isAdmin && !isOwner) {
      return res.status(403).json({
        ok: false,
        error: "Forbidden: you can only delete your own recordings.",
      });
    }

    if (item.url) {
      try {
        await delBlob(item.url);
      } catch {
        // ignore blob deletion error; still delete metadata
      }
    }

    const remaining = parsed.filter((x) => x.id !== id);

    await kv.del("recordings");
    if (remaining.length) {
      await kv.rpush("recordings", ...remaining.map((x) => JSON.stringify(x)));
    }

    return res.status(200).json({ ok: true, deletedId: id });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Delete failed",
    });
  }
}