const nodemailer = require("nodemailer");
// EmailSettings always lives in the MAIN global DB — never in a tenant DB
const EmailSettings = require("../models/EmailSettings");

const buildTransporter = (settings) => {
    let host = settings.host;
    if (!host) {
        if (settings.provider === "google") host = "smtp.gmail.com";
        else if (settings.provider === "microsoft") host = "smtp.office365.com";
    }
    return nodemailer.createTransport({
        host,
        port: settings.port || 587,
        secure: Boolean(settings.secure),
        auth: { user: settings.smtpUser, pass: settings.smtpPass }
    });
};

exports.getEmailSettings = async (req, res) => {
    try {
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
        const existing = await EmailSettings.findOne();
        const payload = { ...req.body };
        // Preserve saved password if a new one wasn't provided
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

exports.testEmailConnection = async (req, res) => {
    try {
        const settings = await EmailSettings.findOne();
        if (!settings) {
            return res.status(400).json({ error: "No email settings configured. Please save your SMTP settings first." });
        }
        if (!settings.smtpUser || !settings.smtpPass) {
            return res.status(400).json({ error: "SMTP username and password are required." });
        }

        const transporter = buildTransporter(settings.toJSON());
        await transporter.verify();
        res.json({ success: true, message: `SMTP connection to ${settings.host || "server"} verified successfully.` });
    } catch (err) {
        // Provide a friendlier message for the most common Gmail error
        if (err.code === "EAUTH") {
            return res.status(400).json({
                error: "Authentication failed. For Gmail/Google Workspace, you must use an App Password — not your regular account password. Go to myaccount.google.com → Security → 2-Step Verification → App Passwords to generate one."
            });
        }
        res.status(400).json({ error: err.message });
    }
};
