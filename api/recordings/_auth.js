function getAdminIds() {
  const raw = process.env.WHOP_ADMIN_USER_IDS || "";
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map(v => v.split("="))
      .map(([k, ...rest]) => [k?.trim(), decodeURIComponent(rest.join("="))])
      .filter(([k]) => k)
  );
}

export function verifyWhopFromHeaders(req) {
  const cookies = parseCookies(req.headers.cookie || "");

  const userId =
    cookies["whop-core.user-id"] ||
    cookies["ajs_user_id"] ||
    null;

  if (!userId) {
    throw new Error("Unauthorized: Whop user not found");
  }

  const isAdmin = getAdminIds().includes(userId);

  return { userId, isAdmin };
}