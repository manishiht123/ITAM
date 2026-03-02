const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// Approval requests are stored in the MAIN database so they can be
// queried across all entities without hitting every tenant DB.
const ApprovalRequest = sequelize.define("ApprovalRequest", {
  id:                  { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  requestType:         { type: DataTypes.ENUM("transfer", "disposal"), allowNull: false },
  entityCode:          { type: DataTypes.STRING, allowNull: false },   // source entity
  assetId:             { type: DataTypes.STRING, allowNull: false },   // human-readable ID
  assetName:           { type: DataTypes.STRING, allowNull: true },
  requestedBy:         { type: DataTypes.STRING, allowNull: false },   // submitter name
  requestedByEmail:    { type: DataTypes.STRING, allowNull: true },
  status:              { type: DataTypes.ENUM("Pending", "Approved", "Rejected"), allowNull: false, defaultValue: "Pending" },
  reviewedBy:          { type: DataTypes.STRING, allowNull: true },
  reviewedAt:          { type: DataTypes.DATE,   allowNull: true },
  reviewComments:      { type: DataTypes.TEXT,   allowNull: true },
  previousAssetStatus: { type: DataTypes.STRING, allowNull: true },    // for reverting on rejection
  payload:             { type: DataTypes.JSON,   allowNull: true },    // full snapshot of request data
  transferId:          { type: DataTypes.INTEGER, allowNull: true },   // FK → AssetTransfer.id (transfers only)
});

module.exports = ApprovalRequest;
