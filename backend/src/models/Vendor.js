const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const VendorSchema = {
  id:            { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name:          { type: DataTypes.STRING,  allowNull: false },
  contactPerson: { type: DataTypes.STRING,  allowNull: true },
  email:         { type: DataTypes.STRING,  allowNull: true },
  phone:         { type: DataTypes.STRING,  allowNull: true },
  street:        { type: DataTypes.STRING,  allowNull: true },
  city:          { type: DataTypes.STRING,  allowNull: true },
  state:         { type: DataTypes.STRING,  allowNull: true },
  country:       { type: DataTypes.STRING,  allowNull: true },
  vendorType:    { type: DataTypes.STRING,  allowNull: true },
  paymentTerms:  { type: DataTypes.STRING,  allowNull: true },
  gstNumber:     { type: DataTypes.STRING,  allowNull: true },
  panNumber:     { type: DataTypes.STRING,  allowNull: true },
  status:        { type: DataTypes.STRING,  allowNull: true, defaultValue: "Active" },
  rating:        { type: DataTypes.INTEGER, allowNull: true },
  notes:         { type: DataTypes.TEXT,    allowNull: true, defaultValue: null },
};

const Vendor = sequelize.define("Vendor", VendorSchema);
Vendor.init = (seq) => seq.define("Vendor", VendorSchema);

module.exports = Vendor;
