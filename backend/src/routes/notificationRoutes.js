const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

router.get("/", notificationController.getSettings);
router.post("/", notificationController.updateSettings);

module.exports = router;
