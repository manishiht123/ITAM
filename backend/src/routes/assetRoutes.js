const express = require("express");
const router = express.Router();
const assetController = require("../controllers/assetController");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

router.get("/", assetController.getAssets);
router.get("/export", assetController.exportAssets);
router.post("/", assetController.createAsset);
router.post("/import", upload.single("file"), assetController.importAssets);
router.put("/:id", assetController.updateAsset);
router.delete("/:id", assetController.deleteAsset);

module.exports = router;
