const { Op } = require("sequelize");
const Role = require("../models/Role");

exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({ order: [["name", "ASC"]] });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions, entityPermissions } = req.body || {};
    const trimmedName = String(name || "").trim();
    if (!trimmedName) {
      return res.status(400).json({ error: "Role name is required" });
    }

    const existing = await Role.findOne({
      where: Role.sequelize.where(
        Role.sequelize.fn("LOWER", Role.sequelize.col("name")),
        trimmedName.toLowerCase()
      )
    });
    if (existing) {
      return res.status(409).json({ error: "Role name already exists" });
    }

    const role = await Role.create({
      name: trimmedName,
      description: description || "",
      permissions: Array.isArray(permissions) ? permissions : [],
      entityPermissions: entityPermissions && typeof entityPermissions === "object" ? entityPermissions : {}
    });
    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ error: "Role not found" });

    const { name, description, permissions, entityPermissions } = req.body || {};
    if (name !== undefined) role.name = String(name).trim();
    if (description !== undefined) role.description = description;
    if (permissions !== undefined) role.permissions = Array.isArray(permissions) ? permissions : [];
    if (entityPermissions !== undefined) role.entityPermissions = (entityPermissions && typeof entityPermissions === "object") ? entityPermissions : {};

    await role.save();
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ error: "Role not found" });
    await role.destroy();
    res.json({ message: "Role deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
