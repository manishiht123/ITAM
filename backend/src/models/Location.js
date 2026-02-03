const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const LocationSchema = {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    city: { type: DataTypes.STRING, allowNull: false },
    country: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.STRING, allowNull: true },
    headcount: { type: DataTypes.INTEGER, defaultValue: 0 }
};

const Location = sequelize.define("Location", LocationSchema);
Location.init = (seq) => seq.define("Location", LocationSchema);

module.exports = Location;
