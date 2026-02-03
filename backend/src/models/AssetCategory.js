const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const AssetCategorySchema = {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.STRING, allowNull: true }
};

const AssetCategory = sequelize.define("AssetCategory", AssetCategorySchema);
AssetCategory.init = (seq) => seq.define("AssetCategory", AssetCategorySchema);

module.exports = AssetCategory;
