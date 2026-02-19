const TenantManager = require("../utils/TenantManager");
const AssetTransfer = require("../models/AssetTransfer");
const AuditLog = require("../models/AuditLog");

const logAudit = async (req, action, details = "") => {
    try {
        const user = req.user?.email || req.user?.name || "System";
        const rawIp = req.headers["x-forwarded-for"] || req.ip || req.connection?.remoteAddress;
        const ip = rawIp ? rawIp.replace(/^::ffff:/, "") : rawIp;
        await AuditLog.create({ user, action, ip, details });
    } catch (err) {
        console.error("Audit log failed:", err.message);
    }
};

const getAssetModel = async (entityCode) => {
    const seq = await TenantManager.getConnection(entityCode);
    if (!seq.models.Asset) {
        const Asset = require("../models/Asset");
        if (Asset.init) return Asset.init(seq);
    }
    return seq.models.Asset;
};

/**
 * POST /api/assets/transfer
 * Initiates an asset transfer from one entity to another.
 * - Creates asset record in target entity DB
 * - Sets source asset status to "Retired" (with transfer note)
 * - Creates a transfer log in the main DB
 */
exports.initiateTransfer = async (req, res) => {
    try {
        const { assetId, fromEntity, toEntity, reason, notes, authorizedBy, transferDate } = req.body || {};

        console.log(`[Transfer] Request: assetId="${assetId}", fromEntity="${fromEntity}", toEntity="${toEntity}"`);

        if (!assetId || !fromEntity || !toEntity) {
            return res.status(400).json({ error: "assetId, fromEntity, and toEntity are required." });
        }

        // Reject if fromEntity is not a real entity (e.g. "ALL")
        const normalizedFrom = String(fromEntity).trim().toUpperCase();
        if (normalizedFrom === "ALL" || normalizedFrom === "ALL ENTITIES") {
            return res.status(400).json({ error: "Cannot transfer from 'All Entities' view. Please switch to a specific entity first." });
        }

        if (normalizedFrom === String(toEntity).trim().toUpperCase()) {
            return res.status(400).json({ error: "Source and target entities must be different." });
        }

        // ── Get source asset ─────────────────────────
        // Look up by the human-readable assetId string (e.g. "AST-2944"),
        // using a case-insensitive match to handle any stored casing differences.
        const SourceAsset = await getAssetModel(fromEntity);
        const seq = SourceAsset.sequelize;
        const assetIdStr = String(assetId).trim();

        console.log(`[Transfer] Searching for assetId="${assetIdStr}" in DB for entity="${fromEntity}"`);

        // Case-insensitive lookup so "AST-001" matches "ast-001" etc.
        const sourceAsset = await SourceAsset.findOne({
            where: seq.where(
                seq.fn("LOWER", seq.col("assetId")),
                assetIdStr.toLowerCase()
            )
        });

        if (!sourceAsset) {
            // Count total rows to help diagnose empty-DB issues
            const total = await SourceAsset.count();
            console.warn(`[Transfer] Asset "${assetIdStr}" NOT found in entity "${fromEntity}" (DB has ${total} assets total)`);
            return res.status(404).json({
                error: `Asset "${assetIdStr}" not found in entity "${fromEntity}". The entity DB has ${total} assets. Make sure you are transferring from the correct entity.`
            });
        }

        console.log(`[Transfer] Found asset: id=${sourceAsset.id}, assetId=${sourceAsset.assetId}, entity=${sourceAsset.entity}`);

        const assetData = sourceAsset.toJSON();

        // Block transfers for Retired or Theft/Missing assets
        if (["Retired", "Theft/Missing"].includes(assetData.status)) {
            return res.status(400).json({
                error: `Cannot transfer an asset with status "${assetData.status}".`
            });
        }

        // ── Check for duplicate in target entity ────
        const TargetAsset = await getAssetModel(toEntity);
        const existingInTarget = await TargetAsset.findOne({
            where: { assetId: assetData.assetId }
        });
        if (existingInTarget) {
            return res.status(409).json({
                error: `Asset ID "${assetData.assetId}" already exists in ${toEntity}.`
            });
        }

        const dateStr = transferDate || new Date().toISOString().split("T")[0];

        // If transferred specifically for repair, mark it Under Repair in the target entity
        const targetStatus = reason === "Send for Repair" ? "Under Repair" : "Available";

        // ── Create asset in target entity ────────────
        const newAsset = await TargetAsset.create({
            ...assetData,
            id: undefined,
            entity: toEntity,
            status: targetStatus,
            employeeId: null,
            department: null,
            comments: [
                `Transferred from ${fromEntity} on ${dateStr}.`,
                reason ? `Reason: ${reason}.` : "",
                assetData.comments || ""
            ].filter(Boolean).join(" ").trim()
        });

        // ── Retire source asset with transfer note ───
        await sourceAsset.update({
            status: "Retired",
            comments: [
                `Transferred to ${toEntity} on ${dateStr}.`,
                authorizedBy ? `Authorized by: ${authorizedBy}.` : "",
                assetData.comments || ""
            ].filter(Boolean).join(" ").trim()
        });

        // ── Create transfer log in main DB ───────────
        const transferLog = await AssetTransfer.create({
            sourceAssetId: assetData.assetId,
            assetName: assetData.name,
            category: assetData.category,
            serialNumber: assetData.serialNumber,
            makeModel: assetData.makeModel,
            fromEntity: String(fromEntity).trim().toUpperCase(),
            toEntity: String(toEntity).trim().toUpperCase(),
            reason: reason || "",
            notes: notes || "",
            authorizedBy: authorizedBy || req.user?.name || req.user?.email || "System",
            transferDate: dateStr,
            targetAssetId: newAsset.assetId,
            status: "Completed"
        });

        await logAudit(
            req,
            "ASSET_TRANSFER",
            `Asset ${assetData.assetId} (${assetData.name}) transferred from ${fromEntity} to ${toEntity}. Reason: ${reason || "N/A"}`
        );

        res.json({
            message: `Asset "${assetData.name}" successfully transferred to ${toEntity}.`,
            transfer: transferLog
        });
    } catch (err) {
        console.error("Asset transfer error:", err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/assets/transfers
 * Returns all asset transfer logs (most recent first).
 */
exports.getTransferHistory = async (req, res) => {
    try {
        const transfers = await AssetTransfer.findAll({
            order: [["createdAt", "DESC"]]
        });
        res.json(transfers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
