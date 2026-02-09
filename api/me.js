// api/me.js
import { requireViewer } from "./_lib/whop.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const viewer = requireViewer(req);

    return res.status(200).json({
      ok: true,
      userId: viewer.userId,
      name: viewer.name || null,
      isAdmin: viewer.isAdmin,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      ok: false,
      error: err.message || "Failed",
    });
  }
}