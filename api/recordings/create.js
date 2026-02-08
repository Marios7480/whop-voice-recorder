import { put } from "@vercel/blob";
import { kv } from "@vercel/kv";
import Busboy from "busboy";
import crypto from "crypto";
import Whop from "@whop/sdk";

export const config = {
  api: {
    bodyParser: false, // REQUIRED for file uploads
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // 🔐 Verify Whop user
    const whop = new Whop({
      appId: process.env.WHOP_APP_ID,
      apiKey: process.env.WHOP_API_KEY,
    });

    let whopResult;
    try {
      whopResult = await whop.verifyUserToken(req);
    } catch {
      whopResult = await whop.verifyUserToken({ headers: req.headers });
    }

    const ownerUserId = whopResult?.userId || null;

    if (!ownerUserId) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized: Whop user not found",
      });
    }

    const bb = Busboy({ headers: req.headers });

    let title = "";
    let audioBuffer = null;
    let mimeType = "audio/webm";

    bb.on("field", (name, val) => {
      if (name === "title") title = val;
    });

    bb.on("file", (_, file, info) => {
      mimeType = info.mimeType || mimeType;
      const chunks = [];

      file.on("data", (d) => chunks.push(d));
      file.on("end", () => {
        audioBuffer = Buffer.concat(chunks);
      });
    });

    bb.on("finish", async () => {
      if (!audioBuffer) {
        return res.status(400).json({
          ok: false,
          error: "No audio uploaded",
        });
      }

      const id = crypto.randomUUID();
      const createdAt = Date.now();

      // 📦 Upload audio to Vercel Blob
      const blob = await put(
        `recordings/${id}.webm`,
        audioBuffer,
        {
          access: "public",
          contentType: mimeType,
        }
      );

      // 🧾 Recording metadata (NOW WITH OWNER)
      const item = {
        id,
        title: title || `Recording ${new Date(createdAt).toLocaleString()}`,
        createdAt,
        url: blob.url,
        ownerUserId, // ✅ THIS IS THE KEY FIX
      };

      // 📌 Save to KV
      await kv.lpush("recordings", JSON.stringify(item));

      return res.status(200).json({
        ok: true,
        item,
      });
    });

    req.pipe(bb);
  } catch (err) {
    console.error("Create recording error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Upload failed",
    });
  }
}