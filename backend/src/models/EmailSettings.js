const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const EmailSettingsSchema = {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    provider: { type: DataTypes.STRING, allowNull: false, defaultValue: "custom" },
    smtpUser: { type: DataTypes.STRING, allowNull: false },
    smtpPass: { type: DataTypes.STRING, allowNull: false },
    fromName: { type: DataTypes.STRING, allowNull: true },
    fromEmail: { type: DataTypes.STRING, allowNull: true },
    host: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
    port: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 587 },
    secure: { type: DataTypes.BOOLEAN, defaultValue: false },
    notifyEmail: { type: DataTypes.STRING, allowNull: true },
    returnToName: { type: DataTypes.STRING, allowNull: true },
    returnToEmail: { type: DataTypes.STRING, allowNull: true },
    enabled: { type: DataTypes.BOOLEAN, defaultValue: true }
};

const EmailSettings = sequelize.define("EmailSettings", EmailSettingsSchema);
EmailSettings.init = (seq) => seq.define("EmailSettings", EmailSettingsSchema);

module.exports = EmailSettings;
