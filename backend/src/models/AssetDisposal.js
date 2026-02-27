const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// Asset disposal records are stored in the MAIN database so they can be
// queried across all entities without hitting every tenant DB.
const AssetDisposal = sequelize.define("AssetDisposal", {
  id:             { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  assetId:        { type: DataTypes.STRING, allowNull: false },   // ITAM ID e.g. "OFB-LAP-001"
  assetName:      { type: DataTypes.STRING, allowNull: true },
  category:       { type: DataTypes.STRING, allowNull: true },
  serialNumber:   { type: DataTypes.STRING, allowNull: true },
  entity:         { type: DataTypes.STRING, allowNull: true },
  purchasePrice:  { type: DataTypes.STRING, allowNull: true },    // original purchase price
  disposalReason: { type: DataTypes.STRING, allowNull: false, defaultValue: "End of Life" },
  disposalMethod: { type: DataTypes.STRING, allowNull: false, defaultValue: "Scrap" },
  disposalDate:   { type: DataTypes.DATEONLY, allowNull: true },
  saleValue:      { type: DataTypes.STRING, allowNull: true },    // proceeds if sold / scrapped
  authorizedBy:   { type: DataTypes.STRING, allowNull: true },
  performedBy:    { type: DataTypes.STRING, allowNull: true },
  notes:          { type: DataTypes.TEXT, allowNull: true }
});

module.exports = AssetDisposal;
