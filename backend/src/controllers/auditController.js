const AuditLog = require("../models/AuditLog");

exports.getLogs = async (req, res) => {
    try {
        const logs = await AuditLog.findAll({ order: [["timestamp", "DESC"]] });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createLog = async (req, res) => {
    try {
        const log = await AuditLog.create(req.body);
        res.status(201).json(log);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
