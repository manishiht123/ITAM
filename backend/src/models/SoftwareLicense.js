const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SoftwareLicenseSchema = {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  product: { type: DataTypes.STRING, allowNull: false },
  vendor: { type: DataTypes.STRING, allowNull: false },
  version: { type: DataTypes.STRING, allowNull: true },
  licenseKey: { type: DataTypes.STRING, allowNull: true },
  seatsOwned: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  seatsUsed: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  renewalDate: { type: DataTypes.DATEONLY, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: true }
};

const SoftwareLicense = sequelize.define("SoftwareLicense", SoftwareLicenseSchema);
SoftwareLicense.init = (seq) => seq.define("SoftwareLicense", SoftwareLicenseSchema);

module.exports = SoftwareLicense;
