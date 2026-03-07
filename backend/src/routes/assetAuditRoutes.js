const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/assetAuditController");

router.get("/",                         ctrl.getAudits);
router.post("/",                        ctrl.createAudit);
router.get("/:id",                      ctrl.getAudit);
router.post("/:id/start",               ctrl.startAudit);
router.patch("/:id/items/:itemId",      ctrl.scanItem);
router.post("/:id/complete",            ctrl.completeAudit);
router.delete("/:id",                   ctrl.deleteAudit);
router.get("/:id/export",               ctrl.exportAudit);

module.exports = router;
