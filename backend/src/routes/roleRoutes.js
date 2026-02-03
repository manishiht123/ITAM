const router = require("express").Router();
const controller = require("../controllers/roleController");

router.get("/", controller.getRoles);
router.post("/", controller.createRole);
router.put("/:id", controller.updateRole);
router.delete("/:id", controller.deleteRole);

module.exports = router;
