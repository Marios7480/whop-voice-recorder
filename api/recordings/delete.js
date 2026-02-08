import Whop from "@whop/sdk";
import { kv } from "@vercel/kv";

function getAdminIds() {
  return (process.env.WHOP_ADMIN_USER_IDS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  const { id } = req.body;
  if (!id) return res.status(400).json({ ok: false });

  const whop = new Whop({
    appId: process.env.WHOP_APP_ID,
    apiKey: process.env.WHOP_API_KEY,
  });

  let result;
  try {
    result = await whop.verifyUserToken(req);
  } catch {
    result = await whop.verifyUserToken({ headers: req.headers });
  }

  const userId = result?.userId;
  if (!userId) return res.status(401).json({ ok: false });

  const isAdmin = getAdminIds().includes(userId);

  const raw = await kv.lrange("recordings", 0, 500);
  const parsed = raw.map(r => JSON.parse(r));

  const item = parsed.find(r => r.id === id);
  if (!item) return res.status(404).json({ ok: false });

  // ✅ PERMISSION RULE
  if (!isAdmin && item.ownerUserId && item.ownerUserId !== userId) {
    return res.status(403).json({ ok: false });
  }

  // ✅ Allow admin to delete legacy (no owner)
  const remaining = parsed.filter(r => r.id !== id);

  await kv.del("recordings");
  if (remaining.length) {
    await kv.rpush("recordings", ...remaining.map(r => JSON.stringify(r)));
  }

  res.json({ ok: true });
}