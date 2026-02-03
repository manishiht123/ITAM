const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const NotificationSettings = sequelize.define("NotificationSettings", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    emailAlerts: { type: DataTypes.BOOLEAN, defaultValue: true },
    weeklyReport: { type: DataTypes.BOOLEAN, defaultValue: false },
    securityAlerts: { type: DataTypes.BOOLEAN, defaultValue: true },
    maintenanceReminders: { type: DataTypes.BOOLEAN, defaultValue: true },
    assetAllocation: { type: DataTypes.BOOLEAN, defaultValue: true },
    assetReturn: { type: DataTypes.BOOLEAN, defaultValue: true }
});

module.exports = NotificationSettings;
