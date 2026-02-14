const User = require("../models/User");
const bcrypt = require("bcryptjs");

const parseJsonField = (value, fallback) => {
    if (!value) return fallback;
    try {
        return JSON.parse(value);
    } catch (err) {
        return fallback;
    }
};

const serializeField = (value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    return JSON.stringify(value);
};


exports.getUsers = async (req, res) => {
    try {
        const users = await User.findAll({ attributes: { exclude: ['password'] } });
        const normalized = users.map((user) => {
            const data = user.toJSON();
            return {
                ...data,
                allowedEntities: parseJsonField(data.allowedEntities, []),
                entityPermissions: parseJsonField(data.entityPermissions, {})
            };
        });
        res.json(normalized);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role, status, allowedEntities, entityPermissions } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            status,
            allowedEntities: serializeField(allowedEntities),
            entityPermissions: serializeField(entityPermissions)
        });
        res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        const { name, email, phone, title } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = String(name);
        if (email !== undefined) updates.email = String(email);
        if (phone !== undefined) updates.phone = String(phone);
        if (title !== undefined) updates.title = String(title);
        await User.update(updates, { where: { id: userId } });
        const updated = await User.findByPk(userId, { attributes: { exclude: ["password"] } });
        const data = updated.toJSON();
        res.json({
            ...data,
            allowedEntities: parseJsonField(data.allowedEntities, []),
            entityPermissions: parseJsonField(data.entityPermissions, {})
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { name, email, role, status, password, allowedEntities, entityPermissions } = req.body;
        const updates = {
            name,
            email,
            role,
            status,
            allowedEntities: serializeField(allowedEntities),
            entityPermissions: serializeField(entityPermissions)
        };

        if (password) {
            updates.password = await bcrypt.hash(password, 10);
        }

        await User.update(updates, { where: { id: req.params.id } });
        const updated = await User.findByPk(req.params.id, { attributes: { exclude: ["password"] } });
        res.json(updated || { message: "User updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

