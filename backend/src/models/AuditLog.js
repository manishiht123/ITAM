const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const AuditLog = sequelize.define("AuditLog", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    user: { type: DataTypes.STRING, allowNull: false, defaultValue: "System" },
    action: { type: DataTypes.STRING, allowNull: false },
    ip: { type: DataTypes.STRING, defaultValue: "127.0.0.1" },
    details: { type: DataTypes.TEXT, allowNull: true }
});

module.exports = AuditLog;
