const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const AssetIdPrefix = sequelize.define("AssetIdPrefix", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    entityCode: { type: DataTypes.STRING, allowNull: false },
    categoryName: { type: DataTypes.STRING, allowNull: false },
    shortCode: { type: DataTypes.STRING, allowNull: false },
}, {
    indexes: [{ unique: true, fields: ["entityCode", "categoryName"] }]
});

module.exports = AssetIdPrefix;
