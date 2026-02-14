const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: "employee" },
  status: { type: DataTypes.STRING, defaultValue: "Active" },
  phone: { type: DataTypes.STRING, allowNull: true },
  title: { type: DataTypes.STRING, allowNull: true },
  allowedEntities: { type: DataTypes.TEXT, allowNull: true },
  entityPermissions: { type: DataTypes.TEXT, allowNull: true }
});

module.exports = User;

