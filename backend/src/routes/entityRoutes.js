const express = require("express");
const router = express.Router();
const entityController = require("../controllers/entityController");
const roleGuard = require("../middleware/roleGuard");

// GET — all authenticated users can read entities
router.get("/", entityController.getEntities);

// Write operations — admin only
router.post("/", roleGuard("admin"), entityController.createEntity);
router.put("/:id", roleGuard("admin"), entityController.updateEntity);
router.delete("/:id", roleGuard("admin"), entityController.deleteEntity);

module.exports = router;
