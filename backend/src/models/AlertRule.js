const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const AlertRule = sequelize.define("AlertRule", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  eventType: { type: DataTypes.STRING, allowNull: false, defaultValue: "Any" },
  severity: { type: DataTypes.STRING, allowNull: false, defaultValue: "High" },
  module: { type: DataTypes.STRING, allowNull: false, defaultValue: "All" },
  enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
});

module.exports = AlertRule;
