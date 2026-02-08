const adminIds = (process.env.WHOP_ADMIN_USER_IDS || "").split(",");

const itemsWithPermissions = items.map(item => ({
  ...item,
  canDelete:
    adminIds.includes(userId) ||
    (item.ownerUserId && item.ownerUserId === userId),
}));