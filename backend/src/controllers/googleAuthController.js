const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const SystemPreference = require("../models/SystemPreference");
const generateToken = require("../utils/generateToken");
const { generatePreAuthToken } = require("../utils/generateToken");
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

  const rawIp = req.headers["x-forwarded-for"] || req.ip || req.connection?.remoteAddress;
  const ip = rawIp ? rawIp.replace(/^::ffff:/, "") : rawIp;

  try {
    // Resolve client ID: env var first, then DB setting
    let policy;
    try { policy = await SystemPreference.findOne(); } catch (_) {}
    const clientId = process.env.GOOGLE_CLIENT_ID || policy?.googleClientId || null;
    if (!clientId) {
      return res.status(500).json({ message: "Google OAuth is not configured on this server." });
    }

    // Verify the Google ID token
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();
    const { email, name, email_verified } = payload;

    if (!email_verified) {
      return res.status(401).json({ message: "Google account email is not verified." });
    }

    // --- Domain restriction check ---
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

    try {
      await AuditLog.create({
        user: user.email,
        action: "Login successful (Google OAuth)",
        ip,
        details: `Role: ${user.role} | Name: ${name}`
      });
    } catch (_) {}

    // ── 2FA gate ──────────────────────────────────────────────────────────────
    if (!user.twoFactorEnabled) {
      const setupToken = generatePreAuthToken(user.id, { setupRequired: true });
      return res.json({
        setupRequired: true,
        setupToken,
        user: { name: user.name, email: user.email, role: user.role }
      });
    }

    if (user.twoFactorMethod === "email") {
      try {
        const EmailSettings = require("../models/EmailSettings");
        const nodemailer    = require("nodemailer");
        const code   = String(Math.floor(100000 + Math.random() * 900000));
        const expiry = new Date(Date.now() + 10 * 60 * 1000);
        await User.update({ emailOtpCode: code, emailOtpExpiry: expiry }, { where: { id: user.id } });
        const emailSettings = await EmailSettings.findOne();
        if (emailSettings && emailSettings.enabled) {
          const transporter = nodemailer.createTransport({
            host: emailSettings.host || "smtp.gmail.com",
            port: emailSettings.port || 587,
            secure: emailSettings.secure || false,
            auth: { user: emailSettings.smtpUser, pass: emailSettings.smtpPass }
          });
          const fromName  = emailSettings.fromName  || "ITAM System";
          const fromEmail = emailSettings.fromEmail || emailSettings.smtpUser;
          await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: user.email,
            subject: "[ITAM] Your verification code",
            html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:8px;"><h2 style="margin:0 0 8px;color:#1e293b;">Verification Code</h2><p style="margin:0 0 24px;color:#64748b;font-size:14px;">Use the code below to complete your sign-in. It expires in <strong>10 minutes</strong>.</p><div style="text-align:center;margin:24px 0;"><span style="display:inline-block;padding:16px 32px;background:#1e293b;color:#fff;font-size:32px;font-weight:700;letter-spacing:8px;border-radius:8px;font-family:monospace;">${code}</span></div><p style="margin:0;color:#94a3b8;font-size:12px;">If you did not request this code, please contact your administrator immediately.</p></div>`
          });
        }
      } catch (emailErr) {
        console.error("[2FA] Auto-send OTP failed:", emailErr.message);
      }
    }

    const preAuthToken = generatePreAuthToken(user.id, { twoFactorPending: true, method: user.twoFactorMethod });
    return res.json({
      twoFactorPending: true,
      preAuthToken,
      method: user.twoFactorMethod
    });
  } catch (err) {
    console.error("Google auth error:", err.message);
    return res.status(401).json({ message: "Invalid or expired Google credential. Please try again." });
  }
};
