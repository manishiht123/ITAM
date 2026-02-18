const ensureAssetColumns = async (sequelize) => {
    try {
        const [rows] = await sequelize.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = "${sequelize.options.database}"
              AND TABLE_NAME IN ("Assets", "assets")
        `);
        const existing = new Set(rows.map((row) => row.COLUMN_NAME));

        const addColumn = async (sql) => {
            try {
                await sequelize.query(sql);
            } catch (err) {
                console.error("[ensureAssetColumns] Failed to add column:", err.message);
            }
        };

        if (existing.size === 0) {
            console.warn("[ensureAssetColumns] No columns found for table 'Assets'. Is the table created yet?");
            return;
        }

        if (!existing.has("comments")) {
            await addColumn("ALTER TABLE `Assets` ADD COLUMN `comments` TEXT NULL;");
        }
        if (!existing.has("additionalItems")) {
            await addColumn("ALTER TABLE `Assets` ADD COLUMN `additionalItems` VARCHAR(255) NULL;");
        }
        if (!existing.has("insuranceStatus")) {
            await addColumn("ALTER TABLE `Assets` ADD COLUMN `insuranceStatus` VARCHAR(255) NULL;");
        }
        if (!existing.has("dateOfPurchase")) {
            await addColumn("ALTER TABLE `Assets` ADD COLUMN `dateOfPurchase` DATE NULL;");
        }
        if (!existing.has("warrantyExpireDate")) {
            await addColumn("ALTER TABLE `Assets` ADD COLUMN `warrantyExpireDate` DATE NULL;");
        }
        if (!existing.has("price")) {
            await addColumn("ALTER TABLE `Assets` ADD COLUMN `price` VARCHAR(255) NULL;");
        }
        if (!existing.has("invoiceNumber")) {
            await addColumn("ALTER TABLE `Assets` ADD COLUMN `invoiceNumber` VARCHAR(255) NULL;");
        }
        if (!existing.has("vendorName")) {
            await addColumn("ALTER TABLE `Assets` ADD COLUMN `vendorName` VARCHAR(255) NULL;");
        }
    } catch (err) {
        console.error("[ensureAssetColumns] Critical error checking columns:", err.message);
    }
};

module.exports = ensureAssetColumns;
