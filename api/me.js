// api/me.js
import { getViewer } from "./_utils/whop.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const viewer = getViewer(req);
    return res.status(200).json({
      ok: true,
      userId: viewer.userId,
      isAdmin: viewer.isAdmin,
    });
  } catch (err) {
    const status = err?.statusCode || 401;
    return res.status(status).json({
      ok: false,
      error: err?.message || "Unauthorized",
    });
  }
}