const TenantManager = require("../utils/TenantManager");

const getEmailSettingsModel = async (req) => {
    const entityCode = req.headers['x-entity-code'];
    const sequelize = await TenantManager.getConnection(entityCode);
    if (!sequelize.models.EmailSettings) {
        const EmailSettings = require("../models/EmailSettings");
        if (EmailSettings.init) {
            EmailSettings.init(sequelize);
        }
        return EmailSettings;
    }
    return sequelize.models.EmailSettings;
};

exports.getEmailSettings = async (req, res) => {
    try {
        const EmailSettings = await getEmailSettingsModel(req);
        const existing = await EmailSettings.findOne();
        if (!existing) {
            return res.json({
                enabled: true,
                provider: "custom",
                host: "",
                port: 587,
                secure: false,
                smtpUser: "",
                smtpPass: "",
                fromName: "",
                fromEmail: "",
                notifyEmail: "",
                returnToName: "",
                returnToEmail: "",
                hasPassword: false
            });
        }

        const data = existing.toJSON();
        data.smtpPass = "";
        data.hasPassword = Boolean(existing.smtpPass);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateEmailSettings = async (req, res) => {
    try {
        const EmailSettings = await getEmailSettingsModel(req);
        const existing = await EmailSettings.findOne();
        const payload = { ...req.body };

        if (!payload.smtpPass && existing) {
            payload.smtpPass = existing.smtpPass;
        }

        let record;
        if (existing) {
            await existing.update(payload);
            record = existing;
        } else {
            record = await EmailSettings.create(payload);
        }

        const data = record.toJSON();
        data.smtpPass = "";
        data.hasPassword = Boolean(record.smtpPass);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
