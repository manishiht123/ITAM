const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const EmployeeSchema = {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    department: { type: DataTypes.STRING, allowNull: false },
    entity: { type: DataTypes.STRING, allowNull: false },
    employeeId: { type: DataTypes.STRING, allowNull: true },
    designation: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    joiningDate: { type: DataTypes.DATEONLY, allowNull: true },
    type: { type: DataTypes.STRING, defaultValue: "Permanent" },
    status: { type: DataTypes.STRING, defaultValue: "Active" },
    assetsCount: { type: DataTypes.INTEGER, defaultValue: 0 }
};

const Employee = sequelize.define("Employee", EmployeeSchema);
Employee.init = (seq) => seq.define("Employee", EmployeeSchema);

module.exports = Employee;
