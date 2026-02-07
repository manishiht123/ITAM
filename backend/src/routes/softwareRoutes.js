const router = require("express").Router();
const controller = require("../controllers/softwareController");

router.get("/", controller.getSoftwareInventory);
router.post("/licenses", controller.createSoftwareLicense);
router.put("/licenses/:id", controller.updateSoftwareLicense);
router.post("/assignments", controller.createSoftwareAssignment);
router.put("/assignments/:id", controller.updateSoftwareAssignment);

module.exports = router;
