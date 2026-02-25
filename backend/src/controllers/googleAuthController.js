const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const SystemPreference = require("../models/SystemPreference");
const generateToken = require("../utils/generateToken");
const { isDomainAllowed } = require("../utils/domainCheck");

const parseField = (value, fallback) => {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
};

exports.googleLogin = async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ message: "Google credential is missing." });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ message: "Google OAuth is not configured on this server." });
  }

  const rawIp = req.headers["x-forwarded-for"] || req.ip || req.connection?.remoteAddress;
  const ip = rawIp ? rawIp.replace(/^::ffff:/, "") : rawIp;

  try {
    // Verify the Google ID token
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();
    const { email, name, email_verified } = payload;

    if (!email_verified) {
      return res.status(401).json({ message: "Google account email is not verified." });
    }

    // --- Domain restriction check ---
    let policy;
    try { policy = await SystemPreference.findOne(); } catch (_) {}
    if (!isDomainAllowed(email, policy?.allowedLoginDomains ?? "")) {
      try {
        await AuditLog.create({ user: email, action: "Google login blocked", ip, details: "Email domain not permitted" });
      } catch (_) {}
      return res.status(403).json({ message: "Login not permitted for this email domain. Please contact your administrator." });
    }

    // User must already exist — admin must provision accounts first
    const user = await User.findOne({ where: { email } });
    if (!user) {
      try {
        await AuditLog.create({
          user: email,
          action: "Google login failed",
          ip,
          details: "No account found for this Google email"
        });
      } catch (_) {}
      return res.status(404).json({
        message: "No account found for this Google email. Please contact your administrator."
      });
    }

    if (user.status === "Inactive") {
      return res.status(403).json({ message: "Your account is inactive. Please contact your administrator." });
    }

    // Account lockout check
    if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
      const remaining = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
      return res.status(423).json({ message: `Account locked. Try again in ${remaining} minute(s).` });
    }

    // Reset any lockout state on successful Google auth
    await User.update({ failedLoginAttempts: 0, lockedUntil: null }, { where: { id: user.id } });

    const token = generateToken(user.id, user.role);

    try {
      await AuditLog.create({
        user: user.email,
        action: "Login successful (Google OAuth)",
        ip,
        details: `Role: ${user.role} | Name: ${name}`
      });
    } catch (_) {}

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
    console.error("Google auth error:", err.message);
    return res.status(401).json({ message: "Invalid or expired Google credential. Please try again." });
  }
};
