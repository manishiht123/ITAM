const TenantManager = require("../utils/TenantManager");

const getLocationModel = async (req) => {
    const entityCode = req.headers['x-entity-code'];
    const sequelize = await TenantManager.getConnection(entityCode);
    if (!sequelize.models.Location) {
        console.error("[LocationController] Location model not found on connection!");
        const Location = require("../models/Location");
        if (Location.init) {
            Location.init(sequelize);
        }
        return Location;
    }
    return sequelize.models.Location;
};

exports.getLocations = async (req, res) => {
    try {
        const Location = await getLocationModel(req);
        const locations = await Location.findAll();
        res.json(locations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createLocation = async (req, res) => {
    try {
        const Location = await getLocationModel(req);
        const location = await Location.create(req.body);
        res.status(201).json(location);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateLocation = async (req, res) => {
    try {
        const Location = await getLocationModel(req);
        const location = await Location.findByPk(req.params.id);
        if (!location) {
            return res.status(404).json({ error: "Location not found" });
        }
        await location.update(req.body);
        res.json(location);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteLocation = async (req, res) => {
    try {
        const Location = await getLocationModel(req);
        await Location.destroy({ where: { id: req.params.id } });
        res.json({ message: "Location deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
