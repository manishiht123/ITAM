const router = require("express").Router();
const controller = require("../controllers/licenseController");

router.get("/", controller.getLicenses);
router.post("/", controller.createLicense);

module.exports = router;
