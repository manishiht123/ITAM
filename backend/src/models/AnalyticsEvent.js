const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const AnalyticsEvent = sequelize.define("AnalyticsEvent", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  username: { type: DataTypes.STRING, allowNull: true },
  role: { type: DataTypes.STRING, allowNull: true },
  eventType: { type: DataTypes.STRING, allowNull: false },
  page: { type: DataTypes.STRING, allowNull: true },
  action: { type: DataTypes.STRING, allowNull: true },
  entity: { type: DataTypes.STRING, allowNull: true },
  metadata: { type: DataTypes.TEXT, allowNull: true }
});

module.exports = AnalyticsEvent;
