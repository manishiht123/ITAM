module.exports = (moduleId) => (req, res, next) => {
  const user = req.user;
  if (!user) return next();

  const entityCode = req.headers["x-entity-code"];
  if (!entityCode) return next();

  const permissions = user.entityPermissions || {};
  const entityPerms = permissions[entityCode];
  if (!entityPerms || typeof entityPerms[moduleId] === "undefined") {
    return next();
  }

  if (!entityPerms[moduleId]) {
    return res.status(403).json({ message: "Module access denied" });
  }

  return next();
};
