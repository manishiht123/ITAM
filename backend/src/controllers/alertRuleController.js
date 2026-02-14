const AlertRule = require("../models/AlertRule");

exports.getAlertRules = async (req, res) => {
  try {
    const rules = await AlertRule.findAll({ order: [["createdAt", "DESC"]] });
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createAlertRule = async (req, res) => {
  try {
    const { name, eventType, severity, module, enabled } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Rule name is required" });
    }
    const rule = await AlertRule.create({
      name: name.trim(),
      eventType: eventType || "Any",
      severity: severity || "High",
      module: module || "All",
      enabled: enabled !== undefined ? Boolean(enabled) : true
    });
    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateAlertRule = async (req, res) => {
  try {
    const rule = await AlertRule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ error: "Alert rule not found" });
    const { name, eventType, severity, module, enabled } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (eventType !== undefined) updates.eventType = String(eventType);
    if (severity !== undefined) updates.severity = String(severity);
    if (module !== undefined) updates.module = String(module);
    if (enabled !== undefined) updates.enabled = Boolean(enabled);
    await rule.update(updates);
    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAlertRule = async (req, res) => {
  try {
    const rule = await AlertRule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ error: "Alert rule not found" });
    await rule.destroy();
    res.json({ message: "Alert rule deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
