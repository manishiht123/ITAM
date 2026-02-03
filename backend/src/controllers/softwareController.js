const TenantManager = require("../utils/TenantManager");
const { Op } = require("sequelize");
const AuditLog = require("../models/AuditLog");

const getModels = async (req) => {
  const sequelize = await TenantManager.getConnection(req.headers["x-entity-code"]);
  const SoftwareLicense = sequelize.models.SoftwareLicense || require("../models/SoftwareLicense").init(sequelize);
  const SoftwareAssignment = sequelize.models.SoftwareAssignment || require("../models/SoftwareAssignment").init(sequelize);
  return { SoftwareLicense, SoftwareAssignment };
};

const logAudit = async (req, action, details = "") => {
  try {
    const user = req.user?.email || req.user?.name || "System";
    const ip = req.headers["x-forwarded-for"] || req.ip || req.connection?.remoteAddress;
    await AuditLog.create({ user, action, ip, details });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};

exports.getSoftwareInventory = async (req, res) => {
  try {
    const { SoftwareLicense, SoftwareAssignment } = await getModels(req);
    const licenses = await SoftwareLicense.findAll({ order: [["product", "ASC"]] });
    const assignments = await SoftwareAssignment.findAll({ order: [["assignedAt", "DESC"]] });

    const licenseMap = new Map(licenses.map((l) => [l.id, l.toJSON()]));
    const enriched = assignments.map((a) => ({
      ...a.toJSON(),
      license: licenseMap.get(a.softwareLicenseId) || null
    }));

    res.json({ licenses, assignments: enriched });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSoftwareLicense = async (req, res) => {
  try {
    const { SoftwareLicense } = await getModels(req);
    const { product, vendor } = req.body || {};
    if (!product || !vendor) {
      return res.status(400).json({ error: "Product and vendor are required." });
    }
    const license = await SoftwareLicense.create(req.body);
    await logAudit(
      req,
      "Software license added",
      `Product: ${license.product || "Unknown"}, Vendor: ${license.vendor || "Unknown"}`
    );
    res.status(201).json(license);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSoftwareAssignment = async (req, res) => {
  try {
    const { SoftwareLicense, SoftwareAssignment } = await getModels(req);
    const { softwareLicenseId, employeeId } = req.body || {};
    if (!softwareLicenseId || !employeeId) {
      return res.status(400).json({ error: "softwareLicenseId and employeeId are required." });
    }

    const license = await SoftwareLicense.findByPk(softwareLicenseId);
    if (!license) {
      return res.status(404).json({ error: "Software license not found." });
    }

    const assignment = await SoftwareAssignment.create(req.body);
    await license.update({
      seatsUsed: (license.seatsUsed || 0) + 1
    });
    await logAudit(
      req,
      "Software license assigned",
      `License: ${license.product || "Unknown"}, Employee: ${req.body.employeeId || "Unknown"}`
    );
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSoftwareLicense = async (req, res) => {
  try {
    const { SoftwareLicense } = await getModels(req);
    const license = await SoftwareLicense.findByPk(req.params.id);
    if (!license) {
      return res.status(404).json({ error: "Software license not found." });
    }
    await license.update(req.body);
    await logAudit(
      req,
      "Software license updated",
      `Product: ${license.product || "Unknown"}, Vendor: ${license.vendor || "Unknown"}`
    );
    res.json(license);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
