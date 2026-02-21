const express = require("express");
const router = express.Router();
const controller = require("../controllers/assetIdPrefixController");
const roleGuard = require("../middleware/roleGuard");

// Generate endpoint — all authenticated users
router.get("/generate", controller.generateId);

// CRUD — admin only
router.get("/", controller.getPrefixes);
router.post("/", roleGuard("admin"), controller.upsertPrefix);
router.delete("/:id", roleGuard("admin"), controller.deletePrefix);

module.exports = router;
