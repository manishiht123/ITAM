const express = require("express");
const router = express.Router();
const entityController = require("../controllers/entityController");

router.get("/", entityController.getEntities);
router.post("/", entityController.createEntity);
router.put("/:id", entityController.updateEntity);
router.delete("/:id", entityController.deleteEntity);

module.exports = router;
