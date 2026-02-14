const express = require("express");
const router = express.Router();
const controller = require("../controllers/alertRuleController");

router.get("/", controller.getAlertRules);
router.post("/", controller.createAlertRule);
router.put("/:id", controller.updateAlertRule);
router.delete("/:id", controller.deleteAlertRule);

module.exports = router;
