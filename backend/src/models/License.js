const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const LicenseSchema = {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  product: { type: DataTypes.STRING, allowNull: false },
  vendor: { type: DataTypes.STRING, allowNull: false },
  renewalDate: { type: DataTypes.DATEONLY, allowNull: true },
  seatsOwned: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  seatsUsed: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.STRING, allowNull: true },
  compliance: { type: DataTypes.STRING, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true }
};

const License = sequelize.define("License", LicenseSchema);
License.init = (seq) => seq.define("License", LicenseSchema);

module.exports = License;
