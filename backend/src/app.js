const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
const authMiddleware = require("./middleware/authMiddleware");
const entityAccess = require("./middleware/entityAccess");
const moduleAccess = require("./middleware/moduleAccess");
const roleGuard = require("./middleware/roleGuard");

app.use(authMiddleware);
app.use("/api/assets", entityAccess, moduleAccess("assets"), require("./routes/assetRoutes"));
app.use("/api/asset-categories", entityAccess, moduleAccess("assets"), require("./routes/assetCategoryRoutes"));
app.use("/api/locations", entityAccess, moduleAccess("assets"), require("./routes/locationRoutes"));
app.use("/api/departments", entityAccess, moduleAccess("assets"), require("./routes/departmentRoutes"));
app.use("/api/users", roleGuard("admin"), require("./routes/userRoutes"));
app.use("/api/employees", entityAccess, moduleAccess("employees"), require("./routes/employeeRoutes"));
app.use("/api/organization", entityAccess, require("./routes/organizationRoutes"));
app.use("/api/notifications", moduleAccess("notifications"), require("./routes/notificationRoutes"));
app.use("/api/email-settings", entityAccess, moduleAccess("notifications"), require("./routes/emailSettingsRoutes"));
app.use("/api/params/audit", roleGuard("admin"), require("./routes/auditRoutes"));
app.use("/api/entities", require("./routes/entityRoutes"));
app.use("/api/system-preferences", require("./routes/systemPreferenceRoutes"));
app.use("/api/backups", roleGuard("admin"), require("./routes/backupRoutes"));
app.use("/api/roles", roleGuard("admin"), require("./routes/roleRoutes"));
app.use("/api/alert-rules", roleGuard("admin"), require("./routes/alertRuleRoutes"));
app.use("/api/licenses", entityAccess, moduleAccess("assets"), require("./routes/licenseRoutes"));
app.use("/api/software", entityAccess, moduleAccess("assets"), require("./routes/softwareRoutes"));
app.use("/api/ai", entityAccess, require("./routes/aiRoutes"));
app.use("/api/asset-id-prefixes", require("./routes/assetIdPrefixRoutes"));
app.use("/api/report-schedules", roleGuard("admin"), require("./routes/reportScheduleRoutes"));

app.get("/", (req, res) => res.send("ITAM Backend Running"));

module.exports = app;
