const ADMIN_ROLES = ["admin", "superadmin", "administrator"];

module.exports = (...allowedRoles) => (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const role = String(user.role || "").trim().toLowerCase();

  // Admin always has access
  if (ADMIN_ROLES.includes(role)) {
    return next();
  }

  // Check if user's role is in the allowed list
  if (allowedRoles.length && !allowedRoles.includes(role)) {
    return res.status(403).json({ message: "Access denied: insufficient role" });
  }

  return next();
};
