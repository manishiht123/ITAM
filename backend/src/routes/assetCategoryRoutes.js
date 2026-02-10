const express = require("express");
const router = express.Router();
const assetCategoryController = require("../controllers/assetCategoryController");

router.get("/", assetCategoryController.getAssetCategories);
router.post("/", assetCategoryController.createAssetCategory);
router.put("/:id", assetCategoryController.updateAssetCategory);
router.delete("/:id", assetCategoryController.deleteAssetCategory);

module.exports = router;
