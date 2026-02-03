const router = require("express").Router();
const controller = require("../controllers/systemPreferenceController");

router.get("/", controller.getSystemPreferences);
router.post("/", controller.updateSystemPreferences);

module.exports = router;
