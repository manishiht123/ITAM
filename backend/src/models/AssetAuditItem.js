const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const AssetAuditItem = sequelize.define("AssetAuditItem", {
    id:              { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    auditId:         { type: DataTypes.INTEGER, allowNull: false },
    assetId:         { type: DataTypes.STRING, allowNull: false },   // human-readable e.g. OFB-LAP-001
    assetName:       { type: DataTypes.STRING, allowNull: true },
    category:        { type: DataTypes.STRING, allowNull: true },
    serialNumber:    { type: DataTypes.STRING, allowNull: true },
    makeModel:       { type: DataTypes.STRING, allowNull: true },
    location:        { type: DataTypes.STRING, allowNull: true },
    department:      { type: DataTypes.STRING, allowNull: true },
    employeeId:      { type: DataTypes.STRING, allowNull: true },
    expectedStatus:  { type: DataTypes.STRING, allowNull: true },
    scanStatus: {
        type: DataTypes.ENUM("Pending", "Found", "Not Found", "Condition Changed"),
        defaultValue: "Pending"
    },
    actualCondition: { type: DataTypes.STRING, allowNull: true },
    notes:           { type: DataTypes.TEXT, allowNull: true },
    scannedAt:       { type: DataTypes.DATE, allowNull: true },
    scannedBy:       { type: DataTypes.STRING, allowNull: true },
});

module.exports = AssetAuditItem;
