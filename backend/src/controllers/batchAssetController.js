/**
 * Batch Asset Operations
 * All three endpoints accept an `assets` array: [{ id, entity }]
 * Processing is grouped by entity to minimise DB round-trips.
 */

const TenantManager  = require("../utils/TenantManager");
const ApprovalRequest = require("../models/ApprovalRequest");
const AssetTransfer  = require("../models/AssetTransfer");
const AuditLog       = require("../models/AuditLog");
const { generateAssetId } = require("../utils/assetIdGenerator");

const logAudit = async (req, action, details = "") => {
  try {
    const user  = req.user?.email || req.user?.name || "System";
    const rawIp = req.headers["x-forwarded-for"] || req.ip || req.connection?.remoteAddress;
    const ip    = rawIp ? rawIp.replace(/^::ffff:/, "") : rawIp;
    await AuditLog.create({ user, action, ip, details });
  } catch (_) {}
};

const getAssetModel = async (entityCode) => {
  const seq = await TenantManager.getConnection(entityCode);
  if (!seq.models.Asset) {
    const Asset = require("../models/Asset");
    if (Asset.init) return Asset.init(seq);
  }
  return seq.models.Asset;
};

// Group an array of {id, entity} items by entity code (uppercased)
const groupByEntity = (assets) => {
  const map = {};
  for (const a of assets) {
    const key = String(a.entity || "").trim().toUpperCase();
    if (!key || key === "ALL") continue;
    if (!map[key]) map[key] = [];
    map[key].push(Number(a.id));
  }
  return map;
};

// ─── POST /api/assets/batch/status ─────────────────────────────────────────
// Body: { assets: [{id, entity}], status }
// Allowed target statuses (cannot bulk-allocate as that requires employee assignment)
const ALLOWED_BATCH_STATUSES = ["Available", "Under Repair", "Not Submitted"];

exports.batchStatusChange = async (req, res) => {
  try {
    const { assets, status } = req.body || {};
    if (!assets?.length) return res.status(400).json({ error: "No assets provided." });
    if (!ALLOWED_BATCH_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${ALLOWED_BATCH_STATUSES.join(", ")}` });
    }

    const grouped = groupByEntity(assets);
    const releasingStatuses = ["Available", "Not Submitted"];

    let totalSuccess = 0;
    const skipped = [];

    for (const [entityCode, ids] of Object.entries(grouped)) {
      try {
        const Asset = await getAssetModel(entityCode);
        const found = await Asset.findAll({ where: { id: ids } });

        for (const asset of found) {
          if (["Retired", "Theft/Missing", "Pending Approval"].includes(asset.status)) {
            skipped.push({ assetId: asset.assetId, reason: `Cannot change status from "${asset.status}"` });
            continue;
          }
          const updates = { status };
          if (releasingStatuses.includes(status)) {
            updates.employeeId = null;
            updates.department = null;
            updates.location   = null;
          }
          await Asset.update(updates, { where: { id: asset.id } });
          totalSuccess++;
        }
      } catch (err) {
        console.error(`[BatchStatus] Entity ${entityCode}:`, err.message);
      }
    }

    await logAudit(
      req,
      "BATCH_STATUS_CHANGE",
      `Changed ${totalSuccess} asset(s) to "${status}". Skipped: ${skipped.length}.`
    );

    res.json({ success: totalSuccess, skipped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/assets/batch/transfer ───────────────────────────────────────
// Body: { assets: [{id, entity}], toEntity, reason, notes, authorizedBy, transferDate }
exports.batchTransfer = async (req, res) => {
  try {
    const { assets, toEntity, reason, notes, authorizedBy, transferDate } = req.body || {};
    if (!assets?.length) return res.status(400).json({ error: "No assets provided." });
    if (!toEntity)       return res.status(400).json({ error: "toEntity is required." });

    const normalizedTo = String(toEntity).trim().toUpperCase();
    if (normalizedTo === "ALL" || normalizedTo === "ALL ENTITIES") {
      return res.status(400).json({ error: "Cannot transfer to 'All Entities'." });
    }

    const grouped = groupByEntity(assets);
    let totalSuccess = 0;
    const skipped = [];
    const dateStr = transferDate || new Date().toISOString().split("T")[0];

    for (const [entityCode, ids] of Object.entries(grouped)) {
      if (entityCode === normalizedTo) {
        skipped.push(...ids.map(id => ({ id, reason: "Source and target entities are the same." })));
        continue;
      }
      try {
        const SourceAsset  = await getAssetModel(entityCode);
        const TargetAsset  = await getAssetModel(normalizedTo);
        const found = await SourceAsset.findAll({ where: { id: ids } });

        for (const asset of found) {
          if (["Retired", "Theft/Missing", "Pending Approval"].includes(asset.status)) {
            skipped.push({ assetId: asset.assetId, reason: `Cannot transfer asset with status "${asset.status}"` });
            continue;
          }

          const assetData = asset.toJSON();
          const previousAssetStatus = assetData.status;

          // Pre-generate target asset ID (sequential, so safe to call per-asset)
          let targetAssetId;
          try {
            targetAssetId = await generateAssetId(normalizedTo, assetData.category, TargetAsset.sequelize);
          } catch (_) {
            targetAssetId = assetData.assetId;
          }

          // Lock source asset
          await asset.update({ status: "Pending Approval" });

          // Create transfer log
          const transferLog = await AssetTransfer.create({
            sourceAssetId: assetData.assetId,
            assetName:     assetData.name,
            category:      assetData.category,
            serialNumber:  assetData.serialNumber,
            makeModel:     assetData.makeModel,
            fromEntity:    entityCode,
            toEntity:      normalizedTo,
            reason:        reason || "",
            notes:         notes  || "",
            authorizedBy:  authorizedBy || req.user?.name || req.user?.email || "System",
            transferDate:  dateStr,
            targetAssetId,
            status:        "Pending"
          });

          // Create approval request
          await ApprovalRequest.create({
            requestType:         "transfer",
            entityCode,
            assetId:             assetData.assetId,
            assetName:           assetData.name,
            requestedBy:         req.user?.name || req.user?.email || "System",
            requestedByEmail:    req.user?.email || "",
            previousAssetStatus,
            transferId:          transferLog.id,
            payload: {
              fromEntity:    entityCode,
              toEntity:      normalizedTo,
              assetData,
              targetAssetId,
              reason:        reason || "",
              notes:         notes  || "",
              authorizedBy:  authorizedBy || req.user?.name || req.user?.email || "System",
              transferDate:  dateStr,
              transferLogId: transferLog.id
            }
          });

          totalSuccess++;
        }
      } catch (err) {
        console.error(`[BatchTransfer] Entity ${entityCode}:`, err.message);
      }
    }

    await logAudit(
      req,
      "BATCH_TRANSFER_REQUESTED",
      `${totalSuccess} asset(s) queued for transfer to ${normalizedTo}. Skipped: ${skipped.length}.`
    );

    res.json({ success: totalSuccess, skipped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/assets/batch/dispose ────────────────────────────────────────
// Body: { assets: [{id, entity}], disposalReason, disposalMethod, disposalDate, saleValue, authorizedBy, notes }
exports.batchDispose = async (req, res) => {
  try {
    const {
      assets,
      disposalReason = "End of Life",
      disposalMethod = "Scrap",
      disposalDate   = new Date().toISOString().split("T")[0],
      saleValue      = "",
      authorizedBy   = "",
      notes          = ""
    } = req.body || {};

    if (!assets?.length) return res.status(400).json({ error: "No assets provided." });

    const grouped = groupByEntity(assets);
    let totalSuccess = 0;
    const skipped = [];

    for (const [entityCode, ids] of Object.entries(grouped)) {
      try {
        const Asset = await getAssetModel(entityCode);
        const found = await Asset.findAll({ where: { id: ids } });

        for (const asset of found) {
          if (["Retired", "Pending Approval"].includes(asset.status)) {
            skipped.push({ assetId: asset.assetId, reason: `Cannot dispose asset with status "${asset.status}"` });
            continue;
          }

          const previousAssetStatus = asset.status;

          // Lock asset pending approval
          await asset.update({ status: "Pending Approval" });

          // Create approval request
          await ApprovalRequest.create({
            requestType:         "disposal",
            entityCode,
            assetId:             asset.assetId,
            assetName:           asset.name,
            requestedBy:         req.user?.name || req.user?.email || "System",
            requestedByEmail:    req.user?.email || "",
            previousAssetStatus,
            payload: {
              assetId:       asset.assetId,
              assetName:     asset.name,
              category:      asset.category,
              serialNumber:  asset.serialNumber || "",
              entity:        entityCode,
              purchasePrice: asset.price || "",
              disposalReason,
              disposalMethod,
              disposalDate,
              saleValue,
              authorizedBy,
              notes,
              assetDbId:     asset.id
            }
          });

          totalSuccess++;
        }
      } catch (err) {
        console.error(`[BatchDispose] Entity ${entityCode}:`, err.message);
      }
    }

    await logAudit(
      req,
      "BATCH_DISPOSAL_REQUESTED",
      `${totalSuccess} asset(s) submitted for batch disposal. Reason: ${disposalReason}. Skipped: ${skipped.length}.`
    );

    res.json({ success: totalSuccess, skipped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
