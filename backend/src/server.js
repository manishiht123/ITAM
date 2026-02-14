const app = require("./app");
const sequelize = require("./config/db");
// Ensure all models are registered on the default connection
const User = require("./models/User");
require("./models/Asset");
require("./models/AssetCategory");
require("./models/Employee");
require("./models/Department");
require("./models/Location");
require("./models/License");
require("./models/SoftwareLicense");
require("./models/SoftwareAssignment");
const AuditLog = require("./models/AuditLog");
const EmailSettings = require("./models/EmailSettings");
const NotificationSettings = require("./models/NotificationSettings");
const SystemPreference = require("./models/SystemPreference");
const Role = require("./models/Role");
const AlertRule = require("./models/AlertRule");
require("./models/Entity");
require("./models/Organization");
const bcrypt = require("bcryptjs");
const ensureAssetStatusEnum = require("./utils/ensureAssetStatusEnum");

const ensureEntityLogoColumn = async () => {
  const [rows] = await sequelize.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "Entities"
      AND COLUMN_NAME = "logo"
  `);

  if (!rows.length) {
    await sequelize.query("ALTER TABLE `Entities` ADD COLUMN `logo` TEXT NULL;");
  }
};


const ensureUserPermissionColumns = async () => {
  const [rows] = await sequelize.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "Users"
      AND COLUMN_NAME IN ("allowedEntities", "entityPermissions")
  `);

  const existing = new Set(rows.map((row) => row.COLUMN_NAME));
  if (!existing.has('allowedEntities')) {
    await sequelize.query("ALTER TABLE `Users` ADD COLUMN `allowedEntities` TEXT NULL;");
  }
  if (!existing.has('entityPermissions')) {
    await sequelize.query("ALTER TABLE `Users` ADD COLUMN `entityPermissions` TEXT NULL;");
  }
};


const PORT = process.env.PORT || 5000;

const waitForDB = async () => {
  let retries = 10;
  while (retries) {
    try {
      await sequelize.authenticate();
      console.log("MySQL connected");
      return;
    } catch (err) {
      retries -= 1;
      console.log(`Waiting for MySQL... retries left: ${retries}`);
      await new Promise(res => setTimeout(res, 5000));
    }
  }
  throw new Error("MySQL connection failed");
};

const startServer = async () => {
  try {
    await waitForDB();
    await sequelize.sync({ alter: false });
    await AuditLog.sync({ alter: true });
    await EmailSettings.sync({ alter: true });
    await NotificationSettings.sync({ alter: true });
    await SystemPreference.sync({ alter: true });
    await Role.sync({ alter: true });
    await AlertRule.sync({ alter: true });
    await ensureUserPermissionColumns();
    await ensureEntityLogoColumn();
    await ensureAssetStatusEnum(sequelize);

    const admin = await User.findOne({
      where: { email: "manish@ofbusiness.in" }
    });

    if (!admin) {
      await User.create({
        name: "Admin",
        email: "manish@ofbusiness.in",
        password: await bcrypt.hash("Admin@123@", 10),
        role: "admin"
      });
      console.log("Default admin created: manish@ofbusiness.in / Admin@123@");
    }

    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

startServer();
