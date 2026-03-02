const CustomFieldDefinition = require("../models/CustomFieldDefinition");

// Generate a camelCase slug from a display name
const toFieldKey = (name) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^[^a-z]/, "f");  // ensure starts with letter

const parseOptions = (value) => {
  if (!value) return null;
  try {
    return JSON.stringify(
      Array.isArray(value) ? value : JSON.parse(value)
    );
  } catch {
    return null;
  }
};

// GET /api/custom-fields — returns all field definitions (active + inactive for admin)
exports.getAll = async (req, res) => {
  try {
    const fields = await CustomFieldDefinition.findAll({
      order: [["sortOrder", "ASC"], ["id", "ASC"]]
    });
    res.json(fields.map((f) => ({
      ...f.toJSON(),
      options: f.options ? JSON.parse(f.options) : []
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/custom-fields/active — only active fields (for AddAsset/EditAsset)
exports.getActive = async (req, res) => {
  try {
    const fields = await CustomFieldDefinition.findAll({
      where: { active: true },
      order: [["sortOrder", "ASC"], ["id", "ASC"]]
    });
    res.json(fields.map((f) => ({
      ...f.toJSON(),
      options: f.options ? JSON.parse(f.options) : []
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/custom-fields
exports.create = async (req, res) => {
  try {
    const { fieldName, fieldType, options, required, sortOrder, active } = req.body;
    if (!fieldName || !fieldName.trim()) {
      return res.status(400).json({ error: "fieldName is required" });
    }
    const validTypes = ["text", "number", "date", "select"];
    if (!validTypes.includes(fieldType)) {
      return res.status(400).json({ error: `fieldType must be one of: ${validTypes.join(", ")}` });
    }
    const fieldKey = toFieldKey(fieldName);
    const field = await CustomFieldDefinition.create({
      fieldName: fieldName.trim(),
      fieldKey,
      fieldType: fieldType || "text",
      options: parseOptions(options),
      required: !!required,
      sortOrder: sortOrder ?? 0,
      active: active !== undefined ? !!active : true,
    });
    res.status(201).json({ ...field.toJSON(), options: field.options ? JSON.parse(field.options) : [] });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "A custom field with that name already exists." });
    }
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/custom-fields/:id
exports.update = async (req, res) => {
  try {
    const { fieldName, fieldType, options, required, sortOrder, active } = req.body;
    const field = await CustomFieldDefinition.findByPk(req.params.id);
    if (!field) return res.status(404).json({ error: "Custom field not found" });

    const updates = {};
    if (fieldName !== undefined) {
      updates.fieldName = fieldName.trim();
      updates.fieldKey  = toFieldKey(fieldName);
    }
    if (fieldType !== undefined) updates.fieldType  = fieldType;
    if (options   !== undefined) updates.options    = parseOptions(options);
    if (required  !== undefined) updates.required   = !!required;
    if (sortOrder !== undefined) updates.sortOrder  = sortOrder;
    if (active    !== undefined) updates.active     = !!active;

    await field.update(updates);
    const updated = await CustomFieldDefinition.findByPk(req.params.id);
    res.json({ ...updated.toJSON(), options: updated.options ? JSON.parse(updated.options) : [] });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "A custom field with that name already exists." });
    }
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/custom-fields/:id
exports.remove = async (req, res) => {
  try {
    const field = await CustomFieldDefinition.findByPk(req.params.id);
    if (!field) return res.status(404).json({ error: "Custom field not found" });
    await field.destroy();
    res.json({ message: "Custom field deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
