const NotificationSettings = require("../models/NotificationSettings");

exports.getSettings = async (req, res) => {
    try {
        let settings = await NotificationSettings.findOne();
        if (!settings) {
            settings = await NotificationSettings.create({});
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        let settings = await NotificationSettings.findOne();
        if (!settings) {
            settings = await NotificationSettings.create(req.body);
        } else {
            await settings.update(req.body);
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
