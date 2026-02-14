const ADMIN_ROLES = ["admin", "superadmin", "administrator"];

module.exports = (moduleId) => (req, res, next) => {
  const user = req.user;
  if (!user) return next();

  const role = String(user.role || "").trim().toLowerCase();

  // Admin bypasses module checks
  if (ADMIN_ROLES.includes(role)) return next();

  const permissions = user.entityPermissions || {};
  const entityCode = req.headers["x-entity-code"];

  // No entity header — check if ANY entity grants this module
  if (!entityCode) {
    const entities = Object.keys(permissions);
    if (!entities.length) {
      // No entityPermissions configured at all — allow (role-based defaults apply)
      return next();
    }
    const hasAccess = entities.some(
      (code) => permissions[code] && permissions[code][moduleId] === true
    );
    if (!hasAccess) {
      return res.status(403).json({ message: "Module access denied" });
    }
    return next();
  }

  const entityPerms = permissions[entityCode];

  // If no permissions configured for this entity, deny non-admin users
  if (!entityPerms) {
    return res.status(403).json({ message: "Module access denied" });
  }

  // If this module is explicitly set to false, deny
  if (entityPerms[moduleId] === false) {
    return res.status(403).json({ message: "Module access denied" });
  }

  // If this module is true, allow
  if (entityPerms[moduleId] === true) {
    return next();
  }

  // Module not listed in permissions — deny by default
  return res.status(403).json({ message: "Module access denied" });
};
