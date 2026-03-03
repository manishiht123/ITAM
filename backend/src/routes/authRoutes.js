const express = require("express");
const { login } = require("../controllers/authController");
const { googleLogin } = require("../controllers/googleAuthController");
const twoFactorController = require("../controllers/twoFactorController");
const authMiddleware = require("../middleware/authMiddleware");
const roleGuard = require("../middleware/roleGuard");

const router = express.Router();

// Public config — returns the Google Client ID (env var takes priority, then DB setting)
router.get("/config", async (req, res) => {
  try {
    const SystemPreference = require("../models/SystemPreference");
    const prefs = await SystemPreference.findOne();
    const googleClientId = process.env.GOOGLE_CLIENT_ID || prefs?.googleClientId || null;
    res.json({ googleClientId });
  } catch {
    res.json({ googleClientId: process.env.GOOGLE_CLIENT_ID || null });
  }
});

router.post("/login",  login);
router.post("/google", googleLogin);   // Google OAuth 2.0 sign-in

// 2FA setup (tokens passed in body — no full auth header needed)
router.post("/2fa/totp-generate", twoFactorController.totpGenerate);
router.post("/2fa/totp-enable",   twoFactorController.totpEnable);
router.post("/2fa/email-setup",   twoFactorController.emailSetup);
router.post("/2fa/email-enable",  twoFactorController.emailEnable);

// 2FA login verification
router.post("/2fa/send-otp", twoFactorController.sendOtp);
router.post("/2fa/verify",   twoFactorController.verify);

// 2FA management — /api/auth is mounted before global authMiddleware in app.js,
// so these two protected routes apply authMiddleware explicitly.
router.get("/2fa/status",   authMiddleware, twoFactorController.getStatus);
router.post("/2fa/disable", authMiddleware, roleGuard("admin"), twoFactorController.disable);

module.exports = router;

