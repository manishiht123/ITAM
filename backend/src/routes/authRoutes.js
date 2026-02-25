const express = require("express");
const { login } = require("../controllers/authController");
const { googleLogin } = require("../controllers/googleAuthController");

const router = express.Router();

router.post("/login", login);
router.post("/google", googleLogin);   // Google OAuth 2.0 sign-in

module.exports = router;

