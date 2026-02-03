const Organization = require("../models/Organization");

exports.getOrganization = async (req, res) => {
    try {
        let org = await Organization.findOne();
        if (!org) {
            org = await Organization.create({ name: "My Organization" });
        }
        res.json(org);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateOrganization = async (req, res) => {
    try {
        let org = await Organization.findOne();
        if (!org) {
            org = await Organization.create(req.body);
        } else {
            await org.update(req.body);
        }
        res.json(org);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
