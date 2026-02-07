module.exports = (req, res, next) => {
  const user = req.user;
  if (!user) return next();

  const allowed = Array.isArray(user.allowedEntities) ? user.allowedEntities.filter(Boolean) : [];
  const role = String(user.role || "").trim().toLowerCase();
  const isAdmin = ["admin", "superadmin", "administrator"].includes(role);

  if (!allowed.length || isAdmin) return next();

  const headerCode = req.headers["x-entity-code"];
  if (headerCode) {
    if (!allowed.includes(headerCode)) {
      return res.status(403).json({ message: "Entity access denied" });
    }
    return next();
  }

  if (allowed.length === 1) {
    req.headers["x-entity-code"] = allowed[0];
  }
  return next();
};
