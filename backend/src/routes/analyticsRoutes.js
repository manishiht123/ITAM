const router = require("express").Router();
const controller = require("../controllers/analyticsController");
const roleGuard = require("../middleware/roleGuard");

// Any authenticated user can log events
router.post("/log", controller.logEvent);

// Only admins can view stats
router.get("/stats", roleGuard("admin"), controller.getStats);

module.exports = router;
