const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/reportScheduleController");

router.get("/", ctrl.getSchedules);
router.post("/", ctrl.createSchedule);
router.put("/:id", ctrl.updateSchedule);
router.delete("/:id", ctrl.deleteSchedule);
router.post("/:id/run", ctrl.runNow);

module.exports = router;
