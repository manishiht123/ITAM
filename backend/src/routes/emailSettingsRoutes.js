const express = require("express");
const router = express.Router();
const emailSettingsController = require("../controllers/emailSettingsController");

router.get("/", emailSettingsController.getEmailSettings);
router.post("/", emailSettingsController.updateEmailSettings);

module.exports = router;
