function getAdminIds() {
  const raw = process.env.WHOP_ADMIN_USER_IDS || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractUserIdFromHeaders(headers) {
  // Support several possible header names (Whop may vary)
  const h = headers || {};
  return (
    h["x-whop-user-id"] ||
    h["x-whop-userid"] ||
    h["x-whop-user"] ||
    h["x-whop-viewer-id"] ||
    h["x-user-id"] ||
    null
  );
}

export function verifyWhopFromHeaders(req) {
  const userId = extractUserIdFromHeaders(req.headers);
  if (!userId) throw new Error("Unauthorized (missing Whop user id header)");

  const isAdmin = getAdminIds().includes(userId);
  return { userId, isAdmin };
}