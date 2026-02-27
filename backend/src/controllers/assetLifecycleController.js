const { Op } = require("sequelize");
const TenantManager = require("../utils/TenantManager");
const AuditLog = require("../models/AuditLog");
const AssetDisposal = require("../models/AssetDisposal");

// ── helpers ─────────────────────────────────────────────────────────────────

const getAssetModel = async (req) => {
  const entityCode = req.headers["x-entity-code"];
  const sequelize = await TenantManager.getConnection(entityCode);
  if (!sequelize.models.Asset) {
    const Asset = require("../models/Asset");
    if (Asset.init) return Asset.init(sequelize);
  }
  return sequelize.models.Asset;
};

const logAudit = async (req, action, details = "") => {
  try {
    const user = req.user?.email || req.user?.name || "System";
    const rawIp = req.headers["x-forwarded-for"] || req.ip || req.connection?.remoteAddress;
    const ip = rawIp ? rawIp.replace(/^::ffff:/, "") : rawIp;
    await AuditLog.create({ user, action, ip, details });
  } catch (_) {}
};

const mapEventType = (action = "") => {
  const a = action.toLowerCase();
  if (a.includes("creat"))                              return "created";
  if (a.includes("allocat") || a.includes("in use"))   return "allocated";
  if (a.includes("return") || a.includes("available")) return "returned";
  if (a.includes("repair"))                             return "maintenance";
  if (a.includes("transfer"))                           return "transferred";
  if (a.includes("retir"))                              return "retired";
  if (a.includes("theft") || a.includes("missing") || a.includes("lost")) return "lost";
  if (a.includes("delet"))                              return "deleted";
  return "updated";
};

// ── POST /api/assets/:id/retire ──────────────────────────────────────────────

exports.retireAsset = async (req, res) => {
  try {
    const Asset = await getAssetModel(req);
    const asset = await Asset.findByPk(req.params.id);
    if (!asset) return res.status(404).json({ error: "Asset not found" });
    if (asset.status === "Retired") {
      return res.status(409).json({ error: "Asset is already retired." });
    }

    const {
      disposalReason  = "End of Life",
      disposalMethod  = "Scrap",
      disposalDate    = new Date().toISOString().split("T")[0],
      saleValue       = "",
      authorizedBy    = "",
      notes           = ""
    } = req.body || {};

    // Record formal disposal
    await AssetDisposal.create({
      assetId:        asset.assetId,
      assetName:      asset.name,
      category:       asset.category,
      serialNumber:   asset.serialNumber || "",
      entity:         req.headers["x-entity-code"] || asset.entity || "",
      purchasePrice:  asset.price || "",
      disposalReason,
      disposalMethod,
      disposalDate,
      saleValue,
      authorizedBy,
      performedBy:    req.user?.email || req.user?.name || "System",
      notes
    });

    // Update asset — release from employee + mark Retired
    await Asset.update(
      { status: "Retired", employeeId: null, department: null, location: null },
      { where: { id: req.params.id } }
    );

    await logAudit(
      req,
      "Asset retired",
      `Asset ID: ${asset.assetId}, Reason: ${disposalReason}, Method: ${disposalMethod}${authorizedBy ? `, Authorized by: ${authorizedBy}` : ""}`
    );

    return res.json({ message: "Asset retired successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/assets/:id/history ──────────────────────────────────────────────

exports.getAssetHistory = async (req, res) => {
  try {
    const Asset = await getAssetModel(req);
    const asset = await Asset.findByPk(req.params.id);
    if (!asset) return res.status(404).json({ error: "Asset not found" });

    const assetId = asset.assetId || String(asset.id);

    // Fetch audit log entries that mention this asset ID
    const logs = await AuditLog.findAll({
      where: {
        [Op.or]: [
          { details: { [Op.like]: `%Asset ID: ${assetId}%` } },
          { details: { [Op.like]: `%Asset ID: ${assetId.toLowerCase()}%` } }
        ]
      },
      order: [["timestamp", "ASC"]],
      limit: 200
    });

    // Fetch disposal record (if retired)
    const disposal = await AssetDisposal.findOne({
      where: { assetId },
      order: [["createdAt", "DESC"]]
    });

    // Build structured event list
    const events = [
      // Creation event — always first
      {
        id:          "genesis",
        eventType:   "created",
        eventDate:   asset.createdAt,
        description: "Asset registered in ITAM system",
        performedBy: "System",
        details:     `Category: ${asset.category} | Entity: ${asset.entity}`
      },
      // Audit-log events (deduplicated by timestamp+action)
      ...logs.map((log) => ({
        id:          `log-${log.id}`,
        eventType:   mapEventType(log.action),
        eventDate:   log.timestamp || log.createdAt,
        description: log.action,
        performedBy: log.user,
        details:     log.details,
        ip:          log.ip
      })),
      // Disposal event if the asset was formally retired through the new workflow
      ...(disposal ? [{
        id:          `disposal-${disposal.id}`,
        eventType:   "retired",
        eventDate:   disposal.disposalDate || disposal.createdAt,
        description: `Formally retired — ${disposal.disposalReason}`,
        performedBy: disposal.performedBy,
        details:     [
          `Method: ${disposal.disposalMethod}`,
          disposal.authorizedBy ? `Authorized by: ${disposal.authorizedBy}` : null,
          disposal.saleValue    ? `Proceeds: ₹${disposal.saleValue}` : null,
          disposal.notes        ? `Notes: ${disposal.notes}` : null
        ].filter(Boolean).join(" | "),
        disposal: disposal.toJSON()
      }] : [])
    ];

    // Sort chronologically and remove exact duplicates
    const seen = new Set();
    const uniqueEvents = events
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
      .filter((e) => {
        const key = `${e.eventDate}::${e.description}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    return res.json({
      asset:    asset.toJSON(),
      events:   uniqueEvents,
      disposal: disposal?.toJSON() || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/assets/disposals ────────────────────────────────────────────────

exports.getDisposals = async (req, res) => {
  try {
    const entityCode = req.headers["x-entity-code"];
    const isAll = !entityCode ||
      entityCode.toUpperCase() === "ALL" ||
      entityCode.toUpperCase() === "ALL ENTITIES";

    const where = isAll ? {} : { entity: entityCode };

    const disposals = await AssetDisposal.findAll({
      where,
      order: [["createdAt", "DESC"]]
    });

    return res.json(disposals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
