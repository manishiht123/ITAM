const express = require("express");
const router = express.Router();
const approvalController = require("../controllers/approvalController");
const roleGuard = require("../middleware/roleGuard");

router.get("/",              approvalController.getApprovals);
router.get("/pending-count", approvalController.getPendingCount);
router.post("/:id/review",   roleGuard("manager"), approvalController.reviewApproval);

module.exports = router;
