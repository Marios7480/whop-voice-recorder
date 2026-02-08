import Whop from "@whop/sdk";
import { kv } from "@vercel/kv";

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

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const viewer = await verifyWhop(req);

    const raw = await kv.lrange("recordings", 0, 200);

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
  } catch (e) {
    return res.status(401).json({
      ok: false,
      error: e?.message || "Failed to load recordings",
    });
  }
}