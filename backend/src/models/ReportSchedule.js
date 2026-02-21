const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ReportScheduleSchema = {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    reportType: { type: DataTypes.STRING, allowNull: false }, // 'assets' | 'licenses' | 'assignments'
    entityCode: { type: DataTypes.STRING, allowNull: true },  // null = All Entities
    frequency: { type: DataTypes.STRING, allowNull: false },  // 'daily' | 'weekly' | 'monthly' | 'quarterly'
    time: { type: DataTypes.STRING(5), allowNull: false, defaultValue: "08:00" }, // "HH:MM"
    dayOfWeek: { type: DataTypes.INTEGER, allowNull: true },  // 0-6 for weekly (0=Sun)
    dayOfMonth: { type: DataTypes.INTEGER, allowNull: true }, // 1-31 for monthly/quarterly
    recipients: { type: DataTypes.TEXT, allowNull: false },   // JSON array: ["a@b.com", ...]
    enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    lastRun: { type: DataTypes.DATE, allowNull: true },
    nextRun: { type: DataTypes.DATE, allowNull: true },
    lastStatus: { type: DataTypes.STRING, allowNull: true }, // 'success' | 'failed' | null
    lastError: { type: DataTypes.TEXT, allowNull: true }
};

const ReportSchedule = sequelize.define("ReportSchedule", ReportScheduleSchema);
ReportSchedule.init = (seq) => seq.define("ReportSchedule", ReportScheduleSchema);

module.exports = ReportSchedule;
