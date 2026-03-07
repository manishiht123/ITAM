const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const AssetAudit = sequelize.define("AssetAudit", {
    id:                  { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    sessionName:         { type: DataTypes.STRING, allowNull: false },
    entityCode:          { type: DataTypes.STRING, allowNull: false },
    location:            { type: DataTypes.STRING, allowNull: true },
    department:          { type: DataTypes.STRING, allowNull: true },
    auditDate:           { type: DataTypes.DATEONLY, allowNull: false },
    status:              { type: DataTypes.ENUM("Draft", "In Progress", "Completed"), defaultValue: "Draft" },
    createdBy:           { type: DataTypes.STRING, allowNull: true },
    createdByEmail:      { type: DataTypes.STRING, allowNull: true },
    completedAt:         { type: DataTypes.DATE, allowNull: true },
    notes:               { type: DataTypes.TEXT, allowNull: true },
    totalExpected:       { type: DataTypes.INTEGER, defaultValue: 0 },
    totalFound:          { type: DataTypes.INTEGER, defaultValue: 0 },
    totalNotFound:       { type: DataTypes.INTEGER, defaultValue: 0 },
    totalConditionChanged: { type: DataTypes.INTEGER, defaultValue: 0 },
});

module.exports = AssetAudit;
