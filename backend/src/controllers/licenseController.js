const TenantManager = require("../utils/TenantManager");

const getLicenseModel = async (req) => {
  const entityCode = req.headers["x-entity-code"];
  const sequelize = await TenantManager.getConnection(entityCode);
  if (!sequelize.models.License) {
    const License = require("../models/License");
    License.init(sequelize);
  }
  return sequelize.models.License;
};

exports.getLicenses = async (req, res) => {
  try {
    const License = await getLicenseModel(req);
    const licenses = await License.findAll({ order: [["createdAt", "DESC"]] });
    res.json(licenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createLicense = async (req, res) => {
  try {
    const License = await getLicenseModel(req);
    const { product, vendor } = req.body || {};
    if (!product || !vendor) {
      return res.status(400).json({ error: "Product and vendor are required." });
    }
    const license = await License.create(req.body);
    res.status(201).json(license);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
