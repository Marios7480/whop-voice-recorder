import Whop from "@whop/sdk";
import { put } from "@vercel/blob";
import { kv } from "@vercel/kv";
import Busboy from "busboy";

export const config = {
  api: { bodyParser: false },
};

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

function extractUserName(result) {
  return (
    result?.user?.name ||
    result?.user?.username ||
    result?.user?.display_name ||
    result?.user?.email ||
    result?.userName ||
    result?.username ||
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
  const name = extractUserName(result);

  return { userId, isAdmin, name: name || userId };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const viewer = await verifyWhop(req);

    const bb = Busboy({ headers: req.headers });

    let title = "";
    let audioBuffer = null;
    let mimeType = "audio/webm";

    bb.on("field", (name, val) => {
      if (name === "title") title = String(val || "");
    });

    bb.on("file", (_name, file, info) => {
      mimeType = info?.mimeType || mimeType;
      const chunks = [];
      file.on("data", (d) => chunks.push(d));
      file.on("end", () => {
        audioBuffer = Buffer.concat(chunks);
      });
    });

    bb.on("finish", async () => {
      if (!audioBuffer) {
        return res.status(400).json({ ok: false, error: "No audio uploaded" });
      }

      const cleanTitle = (title || "").trim();
      if (!cleanTitle) {
        return res.status(400).json({ ok: false, error: "Title is required" });
      }

      const id = crypto.randomUUID();
      const createdAt = Date.now();

      const blob = await put(`recordings/${id}.webm`, audioBuffer, {
        access: "public",
        contentType: mimeType,
      });

      const item = {
        id,
        title: cleanTitle,
        createdAt,
        url: blob.url,
        ownerUserId: viewer.userId,
        ownerName: viewer.name, // ✅ store display name
      };

      await kv.lpush("recordings", JSON.stringify(item));

      return res.status(200).json({ ok: true, item });
    });

    req.pipe(bb);
  } catch (err) {
    return res.status(401).json({
      ok: false,
      error: err?.message || "Upload failed",
    });
  }
}