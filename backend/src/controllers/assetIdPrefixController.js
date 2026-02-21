const AssetIdPrefix = require("../models/AssetIdPrefix");
const TenantManager = require("../utils/TenantManager");
const { generateAssetId } = require("../utils/assetIdGenerator");

// GET /api/asset-id-prefixes
exports.getPrefixes = async (req, res) => {
    try {
        const prefixes = await AssetIdPrefix.findAll({
            order: [["entityCode", "ASC"], ["categoryName", "ASC"]]
        });
        res.json(prefixes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/asset-id-prefixes (create or update)
exports.upsertPrefix = async (req, res) => {
    try {
        const { entityCode, categoryName, shortCode } = req.body || {};
        if (!entityCode || !categoryName || !shortCode) {
            return res.status(400).json({ error: "entityCode, categoryName, and shortCode are required." });
        }

        const normalizedEntity = String(entityCode).trim().toUpperCase();
        const normalizedShortCode = String(shortCode).trim().toUpperCase();

        const [record, created] = await AssetIdPrefix.findOrCreate({
            where: { entityCode: normalizedEntity, categoryName },
            defaults: { shortCode: normalizedShortCode }
        });

        if (!created) {
            await record.update({ shortCode: normalizedShortCode });
        }

        res.json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/asset-id-prefixes/:id
exports.deletePrefix = async (req, res) => {
    try {
        const record = await AssetIdPrefix.findByPk(req.params.id);
        if (!record) return res.status(404).json({ error: "Not found." });
        await record.destroy();
        res.json({ message: "Deleted." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/asset-id-prefixes/generate?entity=OFB&category=Laptop
exports.generateId = async (req, res) => {
    try {
        const { entity, category } = req.query;
        if (!entity || !category) {
            return res.status(400).json({ error: "entity and category are required." });
        }

        const tenantSeq = await TenantManager.getConnection(entity);
        const assetId = await generateAssetId(entity, category, tenantSeq);

        res.json({ assetId: assetId || null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
