const SystemPreference = require("../models/SystemPreference");

const ADMIN_ROLES = ["admin", "superadmin", "administrator"];

module.exports = async (req, res, next) => {
  try {
    const prefs = await SystemPreference.findOne();
    if (!prefs || !prefs.maintenanceMode) {
      return next();
    }

    // Admins can still access everything during maintenance
    const role = String(req.user?.role || "").trim().toLowerCase();
    if (ADMIN_ROLES.includes(role)) {
      return next();
    }

    // Allow auth routes so users can still log in
    if (req.path.startsWith("/api/auth")) {
      return next();
    }

    // Allow system-preferences GET so frontend can check maintenance status
    if (req.path.startsWith("/api/system-preferences") && req.method === "GET") {
      return next();
    }

    return res.status(503).json({
      message: "System is under maintenance. Please try again later.",
      maintenance: true
    });
  } catch {
    // If we can't check, don't block
    return next();
  }
};
