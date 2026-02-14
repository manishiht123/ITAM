const router = require("express").Router();
const controller = require("../controllers/systemPreferenceController");
const roleGuard = require("../middleware/roleGuard");

router.get("/", controller.getSystemPreferences);
router.post("/", roleGuard("admin"), controller.updateSystemPreferences);

module.exports = router;
