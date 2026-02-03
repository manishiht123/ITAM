const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SoftwareAssignmentSchema = {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  employeeId: { type: DataTypes.STRING, allowNull: false },
  employeeName: { type: DataTypes.STRING, allowNull: true },
  employeeEmail: { type: DataTypes.STRING, allowNull: true },
  softwareLicenseId: { type: DataTypes.INTEGER, allowNull: false },
  assignedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  notes: { type: DataTypes.TEXT, allowNull: true }
};

const SoftwareAssignment = sequelize.define("SoftwareAssignment", SoftwareAssignmentSchema);
SoftwareAssignment.init = (seq) => seq.define("SoftwareAssignment", SoftwareAssignmentSchema);

module.exports = SoftwareAssignment;
