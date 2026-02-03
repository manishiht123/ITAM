const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");

router.get("/", auditController.getLogs);
router.post("/", auditController.createLog);

module.exports = router;
