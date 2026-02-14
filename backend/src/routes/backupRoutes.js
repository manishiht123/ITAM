const router = require("express").Router();
const controller = require("../controllers/backupController");

router.post("/run", controller.triggerBackup);
router.get("/", controller.getBackups);
router.get("/:filename", controller.downloadBackup);
router.delete("/:filename", controller.deleteBackup);

module.exports = router;
