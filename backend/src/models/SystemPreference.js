const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SystemPreferenceSchema = {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  maxAssetsPerEmployee: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
  allocationWarningMessage: { type: DataTypes.TEXT, allowNull: false, defaultValue: "This employee already has 1 asset allocated. Do you want to allow a second asset?" },
  overuseProtectionEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  autoRenewalReviewEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  auditTrailEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  autoBackupEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  backupFrequency: { type: DataTypes.STRING, allowNull: false, defaultValue: "daily" },
  backupTime: { type: DataTypes.STRING, allowNull: false, defaultValue: "02:00" },
  backupRetentionDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },
  backupType: { type: DataTypes.STRING, allowNull: false, defaultValue: "both" },
  backupLocation: { type: DataTypes.STRING, allowNull: false, defaultValue: "./backups" },
  // Financial settings
  fiscalYearStart: { type: DataTypes.STRING, allowNull: false, defaultValue: "April" },
  depreciationMethod: { type: DataTypes.STRING, allowNull: false, defaultValue: "Straight Line" },
  defaultUsefulLife: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 36 },
  salvageValuePercent: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
  capexThreshold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 50000 },
  // Password policy — NIST SP 800-63B · ISO 27001 A.9.4 · PCI-DSS 8.3
  passwordMinLength: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 12 },
  passwordMaxLength: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 128 },
  passwordRequireUpper: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  passwordRequireLower: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  passwordRequireNumber: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  passwordRequireSpecial: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  passwordExpiryDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 90 },
  passwordReuseLimit: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 12 },
  passwordLockoutAttempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
  passwordLockoutDurationMins: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 15 },
  // Domain restriction — comma-separated allowed domains (null/empty = allow all)
  allowedLoginDomains: { type: DataTypes.TEXT, allowNull: true, defaultValue: null }
};

const SystemPreference = sequelize.define("SystemPreference", SystemPreferenceSchema);

module.exports = SystemPreference;
