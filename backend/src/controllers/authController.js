const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const SystemPreference = require("../models/SystemPreference");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const { generatePreAuthToken } = require("../utils/generateToken");
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

    try {
      await AuditLog.create({ user: user.email, action: "Login successful", ip, details: `Role: ${user.role}` });
    } catch (err) { console.error("Audit log failed:", err.message); }

    // ── 2FA gate ──────────────────────────────────────────────────────────────
    if (!user.twoFactorEnabled) {
      // First time — redirect to setup wizard
      const setupToken = generatePreAuthToken(user.id, { setupRequired: true });
      return res.json({
        setupRequired: true,
        setupToken,
        user: { name: user.name, email: user.email, role: user.role }
      });
    }

    // 2FA already configured — issue pre-auth token and await verification
    if (user.twoFactorMethod === "email") {
      // Auto-send OTP so user doesn't need to press "send" on the verify page
      try {
        const { sendOtp: sendOtpHelper } = require("./twoFactorController");
        // We call the helper directly — just generate + store + send
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
    res.status(500).json({ message: "Server error", error: err });
  }
};
