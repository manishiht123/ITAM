const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const AssetTransfer = sequelize.define("AssetTransfer", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    sourceAssetId: { type: DataTypes.STRING, allowNull: false },
    assetName:     { type: DataTypes.STRING, allowNull: true },
    category:      { type: DataTypes.STRING, allowNull: true },
    serialNumber:  { type: DataTypes.STRING, allowNull: true },
    makeModel:     { type: DataTypes.STRING, allowNull: true },
    fromEntity:    { type: DataTypes.STRING, allowNull: false },
    toEntity:      { type: DataTypes.STRING, allowNull: false },
    reason:        { type: DataTypes.STRING, allowNull: true },
    notes:         { type: DataTypes.TEXT, allowNull: true },
    authorizedBy:  { type: DataTypes.STRING, allowNull: true },
    transferDate:  { type: DataTypes.DATEONLY, allowNull: true },
    targetAssetId: { type: DataTypes.STRING, allowNull: true },
    status: {
        type: DataTypes.ENUM("Completed", "Pending", "Cancelled"),
        defaultValue: "Completed"
    }
});

module.exports = AssetTransfer;
