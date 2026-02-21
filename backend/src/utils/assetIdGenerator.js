const AssetIdPrefix = require("../models/AssetIdPrefix");

/**
 * Generates the next sequential asset ID for a given entity + category.
 *
 * Format: {ENTITY_CODE}/{SHORT_CODE}/{padded_number}
 * Example: OFB/ITL/001 (Laptop in OFB), OFB/ITP/001 (Printer in OFB)
 *
 * @param {string} entityCode - The entity code (e.g., "OFB")
 * @param {string} categoryName - The asset category (e.g., "Laptop")
 * @param {object} tenantSeq - The Sequelize instance for the tenant DB
 * @returns {string|null} - Generated ID string, or null if no prefix is configured
 */
async function generateAssetId(entityCode, categoryName, tenantSeq) {
    if (!entityCode || !categoryName || !tenantSeq) return null;

    const normalizedEntity = String(entityCode).trim().toUpperCase();

    // Look up prefix config in main DB
    const config = await AssetIdPrefix.findOne({
        where: { entityCode: normalizedEntity, categoryName }
    });

    if (!config) return null;

    const prefixStr = `${normalizedEntity}/${config.shortCode}`;

    // Scan tenant DB for existing IDs with this prefix pattern
    const [rows] = await tenantSeq.query(
        "SELECT assetId FROM Assets WHERE assetId LIKE :pattern",
        { replacements: { pattern: `${prefixStr}/%` } }
    );

    let maxNum = 0;
    for (const row of rows) {
        const id = row.assetId || "";
        const parts = id.split("/");
        if (parts.length === 3) {
            const num = parseInt(parts[2], 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
        }
    }

    const nextNum = maxNum + 1;
    const padded = String(nextNum).padStart(3, "0");
    return `${prefixStr}/${padded}`;
}

module.exports = { generateAssetId };
