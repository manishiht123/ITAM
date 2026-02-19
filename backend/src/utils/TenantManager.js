const { Sequelize } = require("sequelize");
const mysql = require("mysql2/promise");
const Asset = require("../models/Asset");
const AssetCategory = require("../models/AssetCategory");
const Employee = require("../models/Employee");
const Department = require("../models/Department");
const Location = require("../models/Location");
const EmailSettings = require("../models/EmailSettings");
const License = require("../models/License");
const SoftwareLicense = require("../models/SoftwareLicense");
const SoftwareAssignment = require("../models/SoftwareAssignment");
const ensureAssetColumns = require("./ensureAssetColumns");
const ensureAssetStatusEnum = require("./ensureAssetStatusEnum");

const ensureDepartmentColumns = async (sequelize) => {
    try {
        await sequelize.query("ALTER TABLE `Departments` MODIFY COLUMN `location` VARCHAR(255) NULL;");
    } catch (err) {
        console.error("[TenantManager] Failed to update Department location column:", err.message);
    }
};

const connections = {}; // Cache for sequelize instances

// Helper to create DB if missing
const createDatabase = async (dbName) => {
    try {
        // Use ROOT credentials for administrative tasks (Creation + Grant)
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || "127.0.0.1",
            user: process.env.DB_ADMIN_USER || "root",
            password: process.env.DB_ADMIN_PASSWORD || "rootpass",
        });

        console.log(`[TenantManager] Creating database: ${dbName}...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);

        // Grant permissions to the application user
        const appUser = process.env.DB_USER || "itamuser";
        console.log(`[TenantManager] Granting privileges to ${appUser}...`);
        await connection.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${appUser}'@'%';`);
        await connection.query("FLUSH PRIVILEGES;");

        await connection.end();
        console.log(`Database ${dbName} provisioned successfully.`);
    } catch (err) {
        console.error("Failed to provision database:", err);
        throw err;
    }
};

const getTenantConnection = async (entityCode) => {
    if (!entityCode) {
        // Fallback to default DB if no entity code provided
        return require("../config/db");
    }

    // Always normalize to lowercase so cache hits are case-insensitive
    // e.g. "OXYZO", "oxyzo", "Oxyzo" all resolve to the same connection
    const normalizedCode = String(entityCode).trim().toLowerCase();
    const dbName = `itam_entity_${normalizedCode}`;

    // Return cached connection (keyed by lowercase code)
    if (connections[normalizedCode]) {
        return connections[normalizedCode];
    }

    // Initialize new Sequelize instance
    const sequelize = new Sequelize(
        dbName,
        process.env.DB_USER || "itamuser",
        process.env.DB_PASSWORD || "itam@123",
        {
            host: process.env.DB_HOST || "127.0.0.1",
            dialect: "mysql",
            logging: false,
            retry: { max: 3 }
        }
    );

    // Initialize Models on this instance
    Asset.init(sequelize);
    AssetCategory.init(sequelize);
    Employee.init(sequelize);
    Department.init(sequelize);
    Location.init(sequelize);
    EmailSettings.init(sequelize);
    License.init(sequelize);
    SoftwareLicense.init(sequelize);
    SoftwareAssignment.init(sequelize);

    try {
        await sequelize.authenticate();
        // Sync schema once without altering indexes to avoid MySQL key limits
        await sequelize.sync({ alter: false });
        await ensureAssetColumns(sequelize);
        await ensureDepartmentColumns(sequelize);
        await ensureAssetStatusEnum(sequelize);

        connections[normalizedCode] = sequelize;
        console.log(`Connected to tenant DB: ${dbName}`);
        return sequelize;
    } catch (err) {
        // If DB not found, try creating it
        if (err.original && err.original.code === 'ER_BAD_DB_ERROR') {
            console.log(`Database ${dbName} not found. Attempting to create...`);
            await createDatabase(dbName);
            return getTenantConnection(normalizedCode); // Retry with normalised code
        }
        // If access denied, attempt to grant privileges and retry
        if (err.original && err.original.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log(`Access denied for ${dbName}. Attempting to grant privileges...`);
            await createDatabase(dbName);
            return getTenantConnection(normalizedCode);
        }
        throw err;
    }
};

const createTenantDB = async (entityCode) => {
    const dbName = `itam_entity_${entityCode.toLowerCase()}`;
    await createDatabase(dbName);
    // Warm up connection and sync tables
    await getTenantConnection(entityCode);
};

module.exports = { getConnection: getTenantConnection, createTenantDB };
