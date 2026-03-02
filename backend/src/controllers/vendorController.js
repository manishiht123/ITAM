const TenantManager = require("../utils/TenantManager");
const AuditLog = require("../models/AuditLog");

const getVendorModel = async (req) => {
  const entityCode = req.headers["x-entity-code"];
  const sequelize = await TenantManager.getConnection(entityCode);
  if (!sequelize.models.Vendor) {
    const Vendor = require("../models/Vendor");
    if (Vendor.init) return Vendor.init(sequelize);
    return Vendor;
  }
  return sequelize.models.Vendor;
};

const logAudit = async (req, action, details = "") => {
  try {
    const user = req.user?.email || req.user?.name || "System";
    const rawIp = req.headers["x-forwarded-for"] || req.ip;
    const ip = rawIp ? rawIp.replace(/^::ffff:/, "") : rawIp;
    await AuditLog.create({ user, action, ip, details });
  } catch (_) {}
};

exports.getVendors = async (req, res) => {
  try {
    const Vendor = await getVendorModel(req);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    const vendors = await Vendor.findAll({ where, order: [["name", "ASC"]] });
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createVendor = async (req, res) => {
  try {
    const Vendor = await getVendorModel(req);
    const vendor = await Vendor.create(req.body);
    await logAudit(req, "Vendor created", `Name: ${req.body.name}, Type: ${req.body.vendorType || "—"}`);
    res.status(201).json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateVendor = async (req, res) => {
  try {
    const Vendor = await getVendorModel(req);
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    await vendor.update(req.body);
    await logAudit(req, "Vendor updated", `Name: ${vendor.name}`);
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteVendor = async (req, res) => {
  try {
    const Vendor = await getVendorModel(req);
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    const name = vendor.name;
    await vendor.destroy();
    await logAudit(req, "Vendor deleted", `Name: ${name}`);
    res.json({ message: "Vendor deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
