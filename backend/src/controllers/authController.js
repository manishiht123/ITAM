const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const SystemPreference = require("../models/SystemPreference");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const { isDomainAllowed } = require("../utils/domainCheck");
const parseField = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const rawIp = req.headers["x-forwarded-for"] || req.ip || req.connection?.remoteAddress;
    const ip = rawIp ? rawIp.replace(/^::ffff:/, "") : rawIp;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      try {
        await AuditLog.create({ user: email || "Unknown", action: "Login failed", ip, details: "User not found" });
      } catch (err) { console.error("Audit log failed:", err.message); }
      return res.status(404).json({ message: "User not found" });
    }

    // --- Account lockout check (PCI-DSS 8.3.4 / ISO 27001 A.9.4.2) ---
    let policy;
    try { policy = await SystemPreference.findOne(); } catch (_) {}
    const maxAttempts = policy?.passwordLockoutAttempts ?? 5;
    const lockDurationMins = policy?.passwordLockoutDurationMins ?? 15;

    // --- Domain restriction check ---
    if (!isDomainAllowed(email, policy?.allowedLoginDomains ?? "")) {
      try {
        await AuditLog.create({ user: email, action: "Login blocked", ip, details: "Email domain not permitted" });
      } catch (_) {}
      return res.status(403).json({ message: "Login not permitted for this email domain. Please contact your administrator." });
    }

    if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
      const remaining = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
      try {
        await AuditLog.create({ user: user.email, action: "Login blocked", ip, details: `Account locked for ${remaining} more minute(s)` });
      } catch (err) { console.error("Audit log failed:", err.message); }
      return res.status(423).json({ message: `Account locked. Try again in ${remaining} minute(s).` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const updateData = { failedLoginAttempts: attempts };
      if (attempts >= maxAttempts) {
        updateData.lockedUntil = new Date(Date.now() + lockDurationMins * 60 * 1000);
        updateData.failedLoginAttempts = 0;
        try {
          await AuditLog.create({ user: user.email, action: "Account locked", ip, details: `${maxAttempts} failed attempts — locked for ${lockDurationMins} min` });
        } catch (err) { console.error("Audit log failed:", err.message); }
        await User.update(updateData, { where: { id: user.id } });
        return res.status(423).json({ message: `Too many failed attempts. Account locked for ${lockDurationMins} minute(s).` });
      }
      await User.update(updateData, { where: { id: user.id } });
      try {
        await AuditLog.create({ user: user.email, action: "Login failed", ip, details: `Invalid credentials (attempt ${attempts}/${maxAttempts})` });
      } catch (err) { console.error("Audit log failed:", err.message); }
      return res.status(400).json({ message: "Invalid credentials", attemptsRemaining: maxAttempts - attempts });
    }

    // Successful login — reset lockout counters
    await User.update({ failedLoginAttempts: 0, lockedUntil: null }, { where: { id: user.id } });

    const token = generateToken(user.id, user.role);
    try {
      await AuditLog.create({ user: user.email, action: "Login successful", ip, details: `Role: ${user.role}` });
    } catch (err) { console.error("Audit log failed:", err.message); }

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        title: user.title || "",
        allowedEntities: parseField(user.allowedEntities, []),
        entityPermissions: parseField(user.entityPermissions, {})
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
