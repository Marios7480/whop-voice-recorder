import { put } from "@vercel/blob";
import { kv } from "@vercel/kv";
import Busboy from "busboy";
import crypto from "crypto";
import { verifyWhopFromHeaders } from "./_auth.js";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  let viewer;
  try {
    viewer = verifyWhopFromHeaders(req);
  } catch (e) {
    return res.status(401).json({ ok: false, error: e?.message || "Unauthorized" });
  }

  try {
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
      const cleanTitle = (title || "").trim();
      if (!cleanTitle) {
        return res.status(400).json({ ok: false, error: "Title is required" });
      }
      if (!audioBuffer || !audioBuffer.length) {
        return res.status(400).json({ ok: false, error: "No audio uploaded" });
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
        ownerUserId: viewer.userId
      };

      await kv.lpush("recordings", JSON.stringify(item));

      return res.status(200).json({ ok: true, item });
    });

    req.pipe(bb);
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Upload failed",
    });
  }
}