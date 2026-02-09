import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { id } = req.query || {};
    if (!id) return res.status(400).json({ ok: false, error: "Missing id" });

    const raw = await kv.lrange("recordings", 0, 500);

    const parsed = raw
      .map((r) => {
        if (typeof r === "string") {
          try {
            return JSON.parse(r);
          } catch {
            return null;
          }
        }
        if (typeof r === "object" && r !== null) return r;
        return null;
      })
      .filter(Boolean);

    const item = parsed.find((x) => x.id === id);
    if (!item) return res.status(404).json({ ok: false, error: "Not found" });

    // Public share payload (no secrets)
    const publicItem = {
      id: item.id,
      title: item.title,
      createdAt: item.createdAt,
      url: item.url,
      ownerName: item.ownerName || "Unknown",
    };

    return res.status(200).json({ ok: true, item: publicItem });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e?.message || "Failed to load recording",
    });
  }
}