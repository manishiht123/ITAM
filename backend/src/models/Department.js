const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const DepartmentSchema = {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    head: { type: DataTypes.STRING, allowNull: true },
    location: { type: DataTypes.STRING, allowNull: false },
    employees: { type: DataTypes.INTEGER, defaultValue: 0 }
};

const Department = sequelize.define("Department", DepartmentSchema);
Department.init = (seq) => seq.define("Department", DepartmentSchema);

module.exports = Department;
