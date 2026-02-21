const express = require("express");
const router = express.Router();
const entityController = require("../controllers/entityController");
const roleGuard = require("../middleware/roleGuard");

// Public — no auth so email clients can fetch the logo image
router.get("/:code/logo-image", entityController.getEntityLogoImage);

// GET — all authenticated users can read entities
router.get("/", entityController.getEntities);

// Write operations — admin only
router.post("/", roleGuard("admin"), entityController.createEntity);
router.put("/:id", roleGuard("admin"), entityController.updateEntity);
router.delete("/:id", roleGuard("admin"), entityController.deleteEntity);

module.exports = router;
