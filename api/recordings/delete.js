import Whop from "@whop/sdk";
import { kv } from "@vercel/kv";
import { del as delBlob } from "@vercel/blob";

function getAdminIds() {
  const raw = process.env.WHOP_ADMIN_USER_IDS || "";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function extractUserId(result) {
  return (
    result?.userId ||
    result?.user_id ||
    result?.user?.id ||
    result?.user?.userId ||
    result?.id ||
    null
  );
}

async function verifyWhop(req) {
  const appId = process.env.WHOP_APP_ID;
  const apiKey = process.env.WHOP_API_KEY;
  if (!appId || !apiKey) throw new Error("Missing WHOP_APP_ID or WHOP_API_KEY");

  const whop = new Whop({ appId, apiKey });

  let result;
  try {
    result = await whop.verifyUserToken(req);
  } catch (e1) {
    try {
      result = await whop.verifyUserToken(req.headers);
    } catch (e2) {
      result = await whop.verifyUserToken({ headers: req.headers });
    }
  }

  const userId = extractUserId(result);
  if (!userId) throw new Error("Unauthorized (no userId)");

  const isAdmin = getAdminIds().includes(userId);
  return { userId, isAdmin };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const viewer = await verifyWhop(req);

    const { id } = req.body || {};
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

    const ownerUserId = item.ownerUserId || item.userId || item.ownerId || null;
    const isOwner = ownerUserId && ownerUserId === viewer.userId;

    if (!viewer.isAdmin && !isOwner) {
      return res.status(403).json({
        ok: false,
        error: "Forbidden: you can only delete your own recordings.",
      });
    }

    // Delete blob file (best-effort)
    if (item.url) {
      try {
        await delBlob(item.url);
      } catch {
        // ignore; still delete from KV
      }
    }

    const remaining = parsed.filter((x) => x.id !== id);

    await kv.del("recordings");
    if (remaining.length) {
      await kv.rpush("recordings", ...remaining.map((x) => JSON.stringify(x)));
    }

    return res.status(200).json({ ok: true, deletedId: id });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e?.message || "Delete failed",
    });
  }
}