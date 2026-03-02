const express = require("express");
const router = express.Router();
const assetController = require("../controllers/assetController");
const transferController = require("../controllers/assetTransferController");
const lifecycleController = require("../controllers/assetLifecycleController");
const reportController = require("../controllers/assetReportController");
const batchController = require("../controllers/batchAssetController");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

router.get("/", assetController.getAssets);
router.get("/export", assetController.exportAssets);
router.get("/transfers", transferController.getTransferHistory);
router.get("/disposals", lifecycleController.getDisposals);        // must be before /:id
router.get("/report/by-department", reportController.getReportByDepartment);
router.get("/report/by-location",   reportController.getReportByLocation);
router.get("/report/by-department/export", reportController.exportReportByDepartment);
router.get("/report/by-location/export",   reportController.exportReportByLocation);
router.get("/report/depreciation",         reportController.getDepreciationReport);
router.get("/report/depreciation/export",  reportController.exportDepreciationReport);
router.get("/report/faulty",               reportController.getFaultyAssetsReport);
router.get("/report/faulty/export",        reportController.exportFaultyAssetsReport);
router.get("/report/warranty-alerts",        reportController.getWarrantyAlerts);
router.get("/report/warranty-alerts/export", reportController.exportWarrantyAlerts);
router.get("/:id/history", lifecycleController.getAssetHistory);
// Batch operations — must be before /:id param routes
router.post("/batch/status",   batchController.batchStatusChange);
router.post("/batch/transfer", batchController.batchTransfer);
router.post("/batch/dispose",  batchController.batchDispose);

router.post("/", assetController.createAsset);
router.post("/import", upload.single("file"), assetController.importAssets);
router.post("/transfer", transferController.initiateTransfer);
router.post("/:id/retire", lifecycleController.retireAsset);
router.put("/:id", assetController.updateAsset);
router.delete("/:id", assetController.deleteAsset);

module.exports = router;
