const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

router.get("/", employeeController.getEmployees);
router.get("/export", employeeController.exportEmployees);
router.post("/", employeeController.createEmployee);
router.post("/import", upload.single("file"), employeeController.importEmployees);
router.put("/:id", employeeController.updateEmployee);
router.delete("/:id", employeeController.deleteEmployee);

module.exports = router;
