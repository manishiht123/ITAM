const TenantManager = require("../utils/TenantManager");

const getAssetCategoryModel = async (req) => {
    const entityCode = req.headers["x-entity-code"];
    const sequelize = await TenantManager.getConnection(entityCode);
    if (!sequelize.models.AssetCategory) {
        console.error("[AssetCategoryController] AssetCategory model not found on connection!");
        const AssetCategory = require("../models/AssetCategory");
        if (AssetCategory.init) {
            AssetCategory.init(sequelize);
        }
        return AssetCategory;
    }
    return sequelize.models.AssetCategory;
};

exports.getAssetCategories = async (req, res) => {
    try {
        const AssetCategory = await getAssetCategoryModel(req);
        const categories = await AssetCategory.findAll();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createAssetCategory = async (req, res) => {
    try {
        const AssetCategory = await getAssetCategoryModel(req);
        const category = await AssetCategory.create(req.body);
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateAssetCategory = async (req, res) => {
    try {
        const AssetCategory = await getAssetCategoryModel(req);
        const category = await AssetCategory.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({ error: "Asset category not found" });
        }
        await category.update(req.body);
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteAssetCategory = async (req, res) => {
    try {
        const AssetCategory = await getAssetCategoryModel(req);
        await AssetCategory.destroy({ where: { id: req.params.id } });
        res.json({ message: "Asset category deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
