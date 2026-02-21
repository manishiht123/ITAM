const Entity = require("../models/Entity");
const TenantManager = require("../utils/TenantManager");
const sharp = require("sharp");

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

// Public endpoint — no auth required so email clients can load the logo image.
// Returns the entity logo as a PNG regardless of the source format (SVG → PNG).
exports.getEntityLogoImage = async (req, res) => {
    try {
        const entity = await Entity.findOne({ where: { code: req.params.code.toUpperCase() } });
        if (!entity || !entity.logo) {
            return res.status(404).send("No logo");
        }
        const logo = entity.logo;
        const match = logo.match(/^data:([^;]+);base64,(.+)$/s);
        if (!match) {
            // Plain URL — redirect
            return res.redirect(logo);
        }
        const [, mimeType, b64] = match;
        let imgBuf = Buffer.from(b64.trim(), "base64");
        let contentType = mimeType;

        // Convert SVG to PNG — email clients and most browsers can't render inline SVG via <img>
        if (mimeType === "image/svg+xml") {
            imgBuf = await sharp(imgBuf).png().toBuffer();
            contentType = "image/png";
        }

        res.set("Content-Type", contentType);
        res.set("Cache-Control", "public, max-age=86400");
        res.send(imgBuf);
    } catch (err) {
        console.error("[Logo endpoint] Error:", err.message);
        res.status(500).send("Error serving logo");
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
