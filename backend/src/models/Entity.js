const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Entity = sequelize.define("Entity", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    code: { type: DataTypes.STRING, allowNull: false, unique: true }, // e.g. OFB, OXYZO
    taxId: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    contactPerson: { type: DataTypes.STRING, allowNull: true },
    contactEmail: { type: DataTypes.STRING, allowNull: true },
    logo: { type: DataTypes.TEXT, allowNull: true }
});

module.exports = Entity;
