const ensureAssetStatusEnum = async (sequelize) => {
  const [rows] = await sequelize.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "Assets"
      AND COLUMN_NAME = "status"
  `);

  if (!rows.length) return;

  await sequelize.query(`
    ALTER TABLE \`Assets\`
    MODIFY COLUMN \`status\` ENUM(
      "In Use",
      "Available",
      "Under Repair",
      "Retired",
      "Theft/Missing",
      "Not Submitted"
    ) NOT NULL DEFAULT "Available"
  `);
};

module.exports = ensureAssetStatusEnum;
