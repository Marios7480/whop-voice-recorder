import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const { id } = req.query || {};
  if (!id) return res.status(400).json({ ok: false, error: "Missing id" });

  try {
    const raw = await kv.lrange("recordings", 0, 500);
    const items = raw.map((r) => JSON.parse(r));
    const item = items.find((x) => x.id === id);

    if (!item) return res.status(404).json({ ok: false, error: "Not found" });
    if (!item.shared) return res.status(403).json({ ok: false, error: "Not shared" });

    // Only return safe fields
    return res.status(200).json({
      ok: true,
      item: {
        id: item.id,
        title: item.title,
        url: item.url,
        ownerName: item.ownerName || null,
        createdAt: item.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Failed" });
  }
}