import { kv } from "@vercel/kv";
import { verifyWhopFromHeaders } from "./_auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  let viewer;
  try {
    viewer = verifyWhopFromHeaders(req);
  } catch (e) {
    return res.status(401).json({ ok: false, error: e?.message || "Unauthorized" });
  }

  try {
    const raw = await kv.lrange("recordings", 0, 200);

    const parsed = raw
      .map((r) => {
        if (typeof r === "string") {
          try { return JSON.parse(r); } catch { return null; }
        }
        if (typeof r === "object" && r !== null) return r;
        return null;
      })
      .filter(Boolean);

    const items = parsed.map((item) => {
      const ownerUserId = item.ownerUserId || item.userId || item.ownerId || null;
      const isOwner = ownerUserId && ownerUserId === viewer.userId;

      return {
        ...item,
        ownerUserId,
        canDelete: Boolean(viewer.isAdmin || isOwner),
      };
    });

    return res.status(200).json({ ok: true, viewer, items });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Failed to load recordings",
    });
  }
}