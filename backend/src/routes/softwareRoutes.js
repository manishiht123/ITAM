const router = require("express").Router();
const controller = require("../controllers/softwareController");

router.get("/", controller.getSoftwareInventory);
router.post("/licenses", controller.createSoftwareLicense);
router.put("/licenses/:id", controller.updateSoftwareLicense);
router.delete("/licenses/:id", controller.deleteSoftwareLicense);
router.post("/assignments", controller.createSoftwareAssignment);
router.put("/assignments/:id", controller.updateSoftwareAssignment);
router.delete("/assignments/:id", controller.deleteSoftwareAssignment);

module.exports = router;
