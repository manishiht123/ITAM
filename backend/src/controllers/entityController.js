const Entity = require("../models/Entity");

exports.getEntities = async (req, res) => {
    try {
        const entities = await Entity.findAll();
        if (req.user && Array.isArray(req.user.allowedEntities) && req.user.allowedEntities.length) {
            const allowed = req.user.allowedEntities;
            return res.json(entities.filter((entity) => allowed.includes(entity.code)));
        }
        res.json(entities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const TenantManager = require("../utils/TenantManager");

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
