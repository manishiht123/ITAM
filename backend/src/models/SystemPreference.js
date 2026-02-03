const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SystemPreferenceSchema = {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  maxAssetsPerEmployee: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
  allocationWarningMessage: { type: DataTypes.TEXT, allowNull: false, defaultValue: "This employee already has 1 asset allocated. Do you want to allow a second asset?" },
  overuseProtectionEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  autoRenewalReviewEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  auditTrailEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
};

const SystemPreference = sequelize.define("SystemPreference", SystemPreferenceSchema);

module.exports = SystemPreference;
