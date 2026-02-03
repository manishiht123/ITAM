const express = require("express");
const router = express.Router();
const organizationController = require("../controllers/organizationController");

router.get("/", organizationController.getOrganization);
router.post("/", organizationController.updateOrganization); // Using a singleton pattern, so POST updates the single record

module.exports = router;
