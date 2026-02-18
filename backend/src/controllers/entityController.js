const Entity = require("../models/Entity");
const TenantManager = require("../utils/TenantManager");

exports.getEntities = async (req, res) => {
    try {
        const entities = await Entity.findAll();

        // Filter based on user allowedEntities if they are not an admin
        const isAdmin = req.user && ["admin", "superadmin", "administrator"].includes(String(req.user.role).toLowerCase());

        if (!isAdmin && req.user && Array.isArray(req.user.allowedEntities) && req.user.allowedEntities.length > 0) {
            const allowed = req.user.allowedEntities;
            const filtered = entities.filter((entity) => allowed.includes(entity.code));
            return res.json(filtered);
        }

        res.json(entities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createEntity = async (req, res) => {
    try {
        const entity = await Entity.create(req.body);

        // Provision Database
        if (entity.code) {
            await TenantManager.createTenantDB(entity.code);
        }

        res.status(201).json(entity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteEntity = async (req, res) => {
    try {
        await Entity.destroy({ where: { id: req.params.id } });
        res.json({ message: "Entity deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateEntity = async (req, res) => {
    try {
        const [updated] = await Entity.update(req.body, { where: { id: req.params.id } });
        if (updated) {
            const updatedEntity = await Entity.findByPk(req.params.id);
            res.json(updatedEntity);
        } else {
            res.status(404).json({ error: "Entity not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
