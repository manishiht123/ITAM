const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Organization = sequelize.define("Organization", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, defaultValue: "My Company" },
    taxId: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    contactEmail: { type: DataTypes.STRING, allowNull: true }
});

module.exports = Organization;
