const app = require("./app");
const sequelize = require("./config/db");
const TenantManager = require("./utils/TenantManager");
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
const ReportSchedule = require("./models/ReportSchedule");
const SystemPreference = require("./models/SystemPreference");
const Role = require("./models/Role");
const AlertRule = require("./models/AlertRule");
const AssetTransfer = require("./models/AssetTransfer");
require("./models/Entity");
require("./models/Organization");
require("./models/AssetIdPrefix");
const bcrypt = require("bcryptjs");
const ensureAssetStatusEnum = require("./utils/ensureAssetStatusEnum");
const ensureAssetColumns = require("./utils/ensureAssetColumns");

// One-time data cleanup: clear employee associations from Retired / Theft-Missing assets
// across all tenant databases. Safe to run on every startup — only touches rows that
// still have a non-null employeeId in those statuses.
const releaseRetiredAssets = async () => {
  try {
    const Entity = require("./models/Entity");
    const entities = await Entity.findAll();
    let total = 0;
    for (const entity of entities) {
      try {
        const tenantSeq = await TenantManager.getConnection(entity.code);
        const [result] = await tenantSeq.query(`
          UPDATE \`Assets\`
          SET \`employeeId\` = NULL,
              \`department\` = NULL,
              \`location\`   = NULL
          WHERE \`status\` IN ('Retired', 'Theft/Missing')
            AND (\`employeeId\` IS NOT NULL
              OR \`department\` IS NOT NULL
              OR \`location\`   IS NOT NULL)
        `);
        if (result.affectedRows > 0) {
          total += result.affectedRows;
          console.log(`[Cleanup] ${entity.code}: cleared ${result.affectedRows} retired/stolen asset(s).`);
        }
      } catch (err) {
        console.error(`[Cleanup] Skipped entity ${entity.code}:`, err.message);
      }
    }
    if (total > 0) {
      console.log(`[Cleanup] Total retired/stolen assets released: ${total}`);
    }
  } catch (err) {
    console.error("[Cleanup] releaseRetiredAssets failed:", err.message);
  }
};

// One-time data cleanup: clear employee associations from Available / In-Stock assets
// across all tenant databases. Safe to run on every startup — only touches rows that
// still have a non-null employeeId in those statuses.
const releaseAvailableAssets = async () => {
  try {
    const Entity = require("./models/Entity");
    const entities = await Entity.findAll();
    let total = 0;
    for (const entity of entities) {
      try {
        const tenantSeq = await TenantManager.getConnection(entity.code);
        const [result] = await tenantSeq.query(`
          UPDATE \`Assets\`
          SET \`employeeId\` = NULL,
              \`department\` = NULL,
              \`location\`   = NULL
          WHERE \`status\` IN ('Available', 'In Stock')
            AND (\`employeeId\` IS NOT NULL
              OR \`department\` IS NOT NULL
              OR \`location\`   IS NOT NULL)
        `);
        if (result.affectedRows > 0) {
          total += result.affectedRows;
          console.log(`[Cleanup] ${entity.code}: cleared ${result.affectedRows} available/in-stock asset(s) with stale employee data.`);
        }
      } catch (err) {
        console.error(`[Cleanup] Skipped entity ${entity.code}:`, err.message);
      }
    }
    if (total > 0) {
      console.log(`[Cleanup] Total available/in-stock assets released: ${total}`);
    }
  } catch (err) {
    console.error("[Cleanup] releaseAvailableAssets failed:", err.message);
  }
};

const ensureEmailSettingsBackendUrlColumn = async () => {
  const [rows] = await sequelize.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "EmailSettings"
      AND COLUMN_NAME = "backendUrl"
  `);
  if (!rows.length) {
    await sequelize.query("ALTER TABLE `EmailSettings` ADD COLUMN `backendUrl` VARCHAR(2048) NULL;");
  }
};

const ensureEntityLogoColumn = async () => {
  const [rows] = await sequelize.query(`
    SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "Entities"
      AND COLUMN_NAME = "logo"
  `);

  if (!rows.length) {
    // Column doesn't exist — add it as MEDIUMTEXT
    await sequelize.query("ALTER TABLE `Entities` ADD COLUMN `logo` MEDIUMTEXT NULL;");
  } else if (rows[0].DATA_TYPE !== 'mediumtext') {
    // Column exists but is too small (TEXT only holds ~64KB) — upgrade to MEDIUMTEXT (16MB)
    await sequelize.query("ALTER TABLE `Entities` MODIFY COLUMN `logo` MEDIUMTEXT NULL;");
  }
};


const ensureUserPermissionColumns = async () => {
  const [rows] = await sequelize.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "Users"
      AND COLUMN_NAME IN ("allowedEntities", "entityPermissions", "phone", "title")
  `);

  const existing = new Set(rows.map((row) => row.COLUMN_NAME));
  if (!existing.has('allowedEntities')) {
    await sequelize.query("ALTER TABLE `Users` ADD COLUMN `allowedEntities` TEXT NULL;");
  }
  if (!existing.has('entityPermissions')) {
    await sequelize.query("ALTER TABLE `Users` ADD COLUMN `entityPermissions` TEXT NULL;");
  }
  if (!existing.has('phone')) {
    await sequelize.query("ALTER TABLE `Users` ADD COLUMN `phone` VARCHAR(255) NULL;");
  }
  if (!existing.has('title')) {
    await sequelize.query("ALTER TABLE `Users` ADD COLUMN `title` VARCHAR(255) NULL;");
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
    await AuditLog.sync();
    await EmailSettings.sync();
    await NotificationSettings.sync();
    await SystemPreference.sync();
    await Role.sync();
    // Ensure entityPermissions column exists on Roles table
    await sequelize.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Roles' AND COLUMN_NAME = 'entityPermissions'
    `).then(async ([rows]) => {
      if (!rows.length) {
        await sequelize.query("ALTER TABLE `Roles` ADD COLUMN `entityPermissions` JSON NULL;");
      }
    });
    await AlertRule.sync();
    await AssetTransfer.sync();
    await ensureAssetColumns(sequelize);
    await ensureAssetStatusEnum(sequelize);
    await ensureUserPermissionColumns();
    await ensureEntityLogoColumn();
    await ensureEmailSettingsBackendUrlColumn();
    await sequelize.query("ALTER TABLE `Departments` MODIFY COLUMN `location` VARCHAR(255) NULL;").catch(() => { });
    await ReportSchedule.sync();
    await releaseRetiredAssets();
    await releaseAvailableAssets();
    // Start the report scheduler (non-blocking)
    require("./services/reportScheduler").startScheduler().catch(err =>
        console.error("[Scheduler] Startup error:", err.message)
    );

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
