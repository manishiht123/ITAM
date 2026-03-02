const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CustomFieldDefinition = sequelize.define("CustomFieldDefinition", {
  id:        { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  fieldName: { type: DataTypes.STRING,  allowNull: false },          // Display label
  fieldKey:  { type: DataTypes.STRING,  allowNull: false, unique: true }, // slug for JSON storage
  fieldType: { type: DataTypes.STRING,  allowNull: false, defaultValue: "text" }, // text|number|date|select
  options:   { type: DataTypes.TEXT,    allowNull: true, defaultValue: null },    // JSON array for select
  required:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  active:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
});

module.exports = CustomFieldDefinition;
