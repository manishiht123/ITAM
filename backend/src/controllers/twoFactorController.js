/**
 * Two-Factor Authentication Controller
 *
 * Handles TOTP (Google Authenticator) and Email OTP setup + verification.
 * All setup/verify endpoints use short-lived pre-auth tokens (10 min).
 * Full JWT is only issued after 2FA completes.
 */
const jwt     = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const qrcode    = require("qrcode");
const nodemailer = require("nodemailer");

const User          = require("../models/User");
const AuditLog      = require("../models/AuditLog");
const EmailSettings = require("../models/EmailSettings");
const generateToken = require("../utils/generateToken");
const { generatePreAuthToken } = require("../utils/generateToken");

const JWT_SECRET = process.env.JWT_SECRET || "SUPERSECRETJWTKEY";

// ── Helpers ────────────────────────────────────────────────────────────────────

const verifyPreAuthToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded.setupRequired && !decoded.twoFactorPending) {
            throw new Error("Invalid token type");
        }
        return decoded;
    } catch (err) {
        throw new Error("Invalid or expired token. Please log in again.");
    }
};

const buildLoginResponse = (user) => {
    const parseField = (value, fallback) => {
        if (!value) return fallback;
        try { return JSON.parse(value); } catch { return fallback; }
    };
    return {
        message: "Login successful",
        token: generateToken(user.id, user.role),
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
    };
};

const sendOtpEmail = async (user, code) => {
    const emailSettings = await EmailSettings.findOne();
    if (!emailSettings || !emailSettings.enabled) {
        throw new Error("Email is not configured on this server. Please contact your administrator.");
    }

    const transporter = nodemailer.createTransport({
        host:   emailSettings.host   || "smtp.gmail.com",
        port:   emailSettings.port   || 587,
        secure: emailSettings.secure || false,
        auth:   { user: emailSettings.smtpUser, pass: emailSettings.smtpPass }
    });

    const fromName  = emailSettings.fromName  || "ITAM System";
    const fromEmail = emailSettings.fromEmail || emailSettings.smtpUser;

    await transporter.sendMail({
        from:    `"${fromName}" <${fromEmail}>`,
        to:      user.email,
        subject: "[ITAM] Your verification code",
        html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:8px;">
                <h2 style="margin:0 0 8px;color:#1e293b;">Verification Code</h2>
                <p style="margin:0 0 24px;color:#64748b;font-size:14px;">
                    Use the code below to complete your sign-in. It expires in <strong>10 minutes</strong>.
                </p>
                <div style="text-align:center;margin:24px 0;">
                    <span style="display:inline-block;padding:16px 32px;background:#1e293b;color:#fff;font-size:32px;font-weight:700;letter-spacing:8px;border-radius:8px;font-family:monospace;">${code}</span>
                </div>
                <p style="margin:0;color:#94a3b8;font-size:12px;">
                    If you did not request this code, please contact your administrator immediately.
                </p>
            </div>
        `
    });
};

// ── POST /api/auth/2fa/totp-generate ──────────────────────────────────────────
// Called during setup wizard: generate TOTP secret + QR code
exports.totpGenerate = async (req, res) => {
    try {
        const { token } = req.body || {};
        if (!token) return res.status(400).json({ message: "Setup token required." });

        const decoded = verifyPreAuthToken(token);
        if (!decoded.setupRequired) {
            return res.status(400).json({ message: "Invalid token for this operation." });
        }

        const user = await User.findByPk(decoded.id);
        if (!user) return res.status(404).json({ message: "User not found." });

        const secret = speakeasy.generateSecret({
            name:   `ITAM (${user.email})`,
            issuer: "ITAM System"
        });

        await User.update({ totpSecretTemp: secret.base32 }, { where: { id: user.id } });

        const qrCode = await qrcode.toDataURL(secret.otpauth_url);

        res.json({ qrCode, manualCode: secret.base32 });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// ── POST /api/auth/2fa/totp-enable ───────────────────────────────────────────
// Verify first TOTP code during setup and enable
exports.totpEnable = async (req, res) => {
    try {
        const { token, code } = req.body || {};
        if (!token || !code) return res.status(400).json({ message: "Token and code required." });

        const decoded = verifyPreAuthToken(token);
        if (!decoded.setupRequired) {
            return res.status(400).json({ message: "Invalid token for this operation." });
        }

        const user = await User.findByPk(decoded.id);
        if (!user) return res.status(404).json({ message: "User not found." });
        if (!user.totpSecretTemp) {
            return res.status(400).json({ message: "TOTP setup not initiated. Please start over." });
        }

        const valid = speakeasy.totp.verify({
            secret:   user.totpSecretTemp,
            encoding: "base32",
            token:    code,
            window:   1
        });

        if (!valid) {
            return res.status(400).json({ message: "Invalid verification code. Please try again." });
        }

        await User.update({
            twoFactorEnabled: true,
            twoFactorMethod:  "totp",
            totpSecret:       user.totpSecretTemp,
            totpSecretTemp:   null
        }, { where: { id: user.id } });

        try {
            await AuditLog.create({
                user:    user.email,
                action:  "2FA enabled (TOTP)",
                ip:      "",
                details: "User configured TOTP two-factor authentication"
            });
        } catch (_) {}

        // Issue full JWT now that 2FA is configured
        const freshUser = await User.findByPk(user.id);
        res.json(buildLoginResponse(freshUser));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// ── POST /api/auth/2fa/email-setup ───────────────────────────────────────────
// Send OTP to user's email and return preAuthToken for email-enable
exports.emailSetup = async (req, res) => {
    try {
        const { token } = req.body || {};
        if (!token) return res.status(400).json({ message: "Setup token required." });

        const decoded = verifyPreAuthToken(token);
        if (!decoded.setupRequired) {
            return res.status(400).json({ message: "Invalid token for this operation." });
        }

        const user = await User.findByPk(decoded.id);
        if (!user) return res.status(404).json({ message: "User not found." });

        const code   = String(Math.floor(100000 + Math.random() * 900000));
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        await User.update({
            twoFactorMethod: "email",
            emailOtpCode:    code,
            emailOtpExpiry:  expiry
        }, { where: { id: user.id } });

        await sendOtpEmail(user, code);

        // Issue a preAuthToken for the verification step
        const preAuthToken = generatePreAuthToken(user.id, { twoFactorPending: true, method: "email", isSetup: true });

        res.json({ sent: true, preAuthToken, email: user.email });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// ── POST /api/auth/2fa/email-enable ──────────────────────────────────────────
// Verify OTP sent during setup and enable email 2FA
exports.emailEnable = async (req, res) => {
    try {
        const { token, code } = req.body || {};
        if (!token || !code) return res.status(400).json({ message: "Token and code required." });

        const decoded = verifyPreAuthToken(token);
        if (!decoded.twoFactorPending) {
            return res.status(400).json({ message: "Invalid token for this operation." });
        }

        const user = await User.findByPk(decoded.id);
        if (!user) return res.status(404).json({ message: "User not found." });

        if (!user.emailOtpCode || user.emailOtpCode !== code) {
            return res.status(400).json({ message: "Invalid verification code." });
        }
        if (!user.emailOtpExpiry || new Date() > new Date(user.emailOtpExpiry)) {
            return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
        }

        await User.update({
            twoFactorEnabled: true,
            twoFactorMethod:  "email",
            emailOtpCode:     null,
            emailOtpExpiry:   null
        }, { where: { id: user.id } });

        try {
            await AuditLog.create({
                user:    user.email,
                action:  "2FA enabled (Email OTP)",
                ip:      "",
                details: "User configured email OTP two-factor authentication"
            });
        } catch (_) {}

        const freshUser = await User.findByPk(user.id);
        res.json(buildLoginResponse(freshUser));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// ── POST /api/auth/2fa/send-otp ───────────────────────────────────────────────
// Resend OTP during login verification flow
exports.sendOtp = async (req, res) => {
    try {
        const { token } = req.body || {};
        if (!token) return res.status(400).json({ message: "Pre-auth token required." });

        const decoded = verifyPreAuthToken(token);
        if (!decoded.twoFactorPending) {
            return res.status(400).json({ message: "Invalid token for this operation." });
        }

        const user = await User.findByPk(decoded.id);
        if (!user) return res.status(404).json({ message: "User not found." });
        if (user.twoFactorMethod !== "email") {
            return res.status(400).json({ message: "User is not configured for email OTP." });
        }

        const code   = String(Math.floor(100000 + Math.random() * 900000));
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        await User.update({ emailOtpCode: code, emailOtpExpiry: expiry }, { where: { id: user.id } });
        await sendOtpEmail(user, code);

        res.json({ sent: true });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// ── POST /api/auth/2fa/verify ─────────────────────────────────────────────────
// Verify 2FA code during login and issue full JWT
exports.verify = async (req, res) => {
    try {
        const { token, code } = req.body || {};
        if (!token || !code) return res.status(400).json({ message: "Token and code required." });

        const decoded = verifyPreAuthToken(token);
        if (!decoded.twoFactorPending) {
            return res.status(400).json({ message: "Invalid token for this operation." });
        }

        const user = await User.findByPk(decoded.id);
        if (!user) return res.status(404).json({ message: "User not found." });

        let valid = false;

        if (user.twoFactorMethod === "totp") {
            valid = speakeasy.totp.verify({
                secret:   user.totpSecret,
                encoding: "base32",
                token:    code,
                window:   1
            });
        } else if (user.twoFactorMethod === "email") {
            valid = user.emailOtpCode === code &&
                    user.emailOtpExpiry &&
                    new Date() < new Date(user.emailOtpExpiry);
            if (valid) {
                await User.update({ emailOtpCode: null, emailOtpExpiry: null }, { where: { id: user.id } });
            }
        }

        if (!valid) {
            // Track failed attempts
            const attempts = (user.failedLoginAttempts || 0) + 1;
            await User.update({ failedLoginAttempts: attempts }, { where: { id: user.id } });
            return res.status(400).json({ message: "Invalid or expired verification code." });
        }

        // Reset failed attempts on success
        await User.update({ failedLoginAttempts: 0 }, { where: { id: user.id } });

        try {
            await AuditLog.create({
                user:    user.email,
                action:  "Login successful (2FA verified)",
                ip:      "",
                details: `Method: ${user.twoFactorMethod}`
            });
        } catch (_) {}

        res.json(buildLoginResponse(user));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// ── GET /api/auth/2fa/status ──────────────────────────────────────────────────
// Returns current 2FA status for the logged-in user (full JWT required)
exports.getStatus = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found." });
        res.json({
            twoFactorEnabled: user.twoFactorEnabled || false,
            twoFactorMethod:  user.twoFactorMethod  || null
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/auth/2fa/disable ────────────────────────────────────────────────
// Admin-only: reset a user's 2FA so they must re-setup on next login
exports.disable = async (req, res) => {
    try {
        const { userId } = req.body || {};
        const targetId = userId || req.user.id;

        await User.update({
            twoFactorEnabled: false,
            twoFactorMethod:  null,
            totpSecret:       null,
            totpSecretTemp:   null,
            emailOtpCode:     null,
            emailOtpExpiry:   null
        }, { where: { id: targetId } });

        try {
            await AuditLog.create({
                user:    req.user.email,
                action:  "2FA disabled",
                ip:      "",
                details: `2FA reset for user ID ${targetId} by admin ${req.user.email}`
            });
        } catch (_) {}

        res.json({ message: "Two-factor authentication has been reset. The user will be prompted to set it up on next login." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
