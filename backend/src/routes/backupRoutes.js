const router = require("express").Router();
const controller = require("../controllers/backupController");

router.post("/run",               controller.triggerBackup);
router.post("/restore/:filename", controller.restoreBackup);  // before /:filename
router.get("/",                   controller.getBackups);
router.get("/:filename",          controller.downloadBackup);
router.delete("/:filename",       controller.deleteBackup);

module.exports = router;
