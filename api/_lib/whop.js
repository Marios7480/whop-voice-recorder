// api/_lib/whop.js
function parseCookies(cookieHeader = "") {
  const out = {};
  const parts = cookieHeader.split(";");

  for (const p of parts) {
    const idx = p.indexOf("=");
    if (idx === -1) continue;
    const k = p.slice(0, idx).trim();
    const v = p.slice(idx + 1).trim();
    if (!k) continue;
    out[k] = decodeURIComponent(v);
  }
  return out;
}

function decodeJwtPayload(token) {
  // Best-effort decode (NO verification). Good enough for display name.
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json = Buffer.from(b64 + pad, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getViewer(req) {
  const cookies = parseCookies(req.headers.cookie || "");

  // This is the reliable one you already saw in DevTools:
  const userId =
    cookies["whop-core.user-id"] ||
    cookies["whop_core_user_id"] ||
    null;

  // Optional: try to pull a display name from whop.app-config (JWT-ish)
  const appConfig = cookies["whop.app-config"];
  const payload = appConfig ? decodeJwtPayload(appConfig) : null;

  const name =
    payload?.user?.name ||
    payload?.user?.display_name ||
    payload?.user?.username ||
    payload?.user_name ||
    payload?.display_name ||
    payload?.username ||
    "";

  return {
    userId,
    name: String(name || "").trim(),
    raw: { cookies, payload },
  };
}

export function getAdminIds() {
  const raw = process.env.WHOP_ADMIN_USER_IDS || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function requireViewer(req) {
  const viewer = getViewer(req);
  if (!viewer.userId) {
    const err = new Error("Unauthorized (missing whop-core.user-id cookie)");
    err.statusCode = 401;
    throw err;
  }
  const isAdmin = getAdminIds().includes(viewer.userId);
  return { ...viewer, isAdmin };
}