const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/customFieldController");

router.get("/",        ctrl.getAll);
router.get("/active",  ctrl.getActive);
router.post("/",       ctrl.create);
router.put("/:id",     ctrl.update);
router.delete("/:id",  ctrl.remove);

module.exports = router;
