const TenantManager = require("../utils/TenantManager");
const AssetTransfer = require("../models/AssetTransfer");
const ApprovalRequest = require("../models/ApprovalRequest");
const AuditLog = require("../models/AuditLog");
const { Op } = require("sequelize");
const { generateAssetId } = require("../utils/assetIdGenerator");

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
 * Executes the actual cross-entity transfer once approved.
 * Called by the approval controller when a transfer request is approved.
 *
 * @param {object} payload  - stored ApprovalRequest.payload
 * @param {object} fakeReq  - minimal req-like object with user info for audit log
 */
const executeTransfer = async (payload, fakeReq) => {
    const {
        fromEntity, toEntity, assetData, targetAssetId,
        reason, notes, authorizedBy, transferDate, transferLogId
    } = payload;

    const TargetAsset = await getAssetModel(toEntity);
    const SourceAsset = await getAssetModel(fromEntity);
    const dateStr = transferDate || new Date().toISOString().split("T")[0];
    const targetStatus = reason === "Send for Repair" ? "Under Repair" : "Available";

    // Create asset in target entity
    const newAsset = await TargetAsset.create({
        ...assetData,
        id: undefined,
        assetId: targetAssetId,
        entity: toEntity,
        status: targetStatus,
        employeeId: null,
        department: null,
        location: null,
        comments: [
            `Transferred from ${fromEntity} on ${dateStr}. Original ID: ${assetData.assetId}.`,
            reason ? `Reason: ${reason}.` : "",
            assetData.comments || ""
        ].filter(Boolean).join(" ").trim()
    });

    // Retire source asset
    await SourceAsset.update(
        {
            status: "Retired",
            comments: [
                `Transferred to ${toEntity} on ${dateStr}.`,
                authorizedBy ? `Authorized by: ${authorizedBy}.` : "",
                assetData.comments || ""
            ].filter(Boolean).join(" ").trim()
        },
        { where: { assetId: assetData.assetId } }
    );

    // Update the pending transfer log to Completed
    if (transferLogId) {
        await AssetTransfer.update(
            { status: "Completed", targetAssetId: newAsset.assetId },
            { where: { id: transferLogId } }
        );
    }

    await logAudit(
        fakeReq,
        "ASSET_TRANSFER",
        `Asset ${assetData.assetId} (${assetData.name}) transferred from ${fromEntity} to ${toEntity}. Reason: ${reason || "N/A"}`
    );

    return newAsset;
};

// Export for use in approvalController
exports.executeTransfer = executeTransfer;

/**
 * POST /api/assets/transfer
 * Submits a transfer request for manager approval.
 * Sets source asset to "Pending Approval" and creates an ApprovalRequest.
 */
exports.initiateTransfer = async (req, res) => {
    try {
        const { assetId, fromEntity, toEntity, reason, notes, authorizedBy, transferDate } = req.body || {};

        console.log(`[Transfer] Request: assetId="${assetId}", fromEntity="${fromEntity}", toEntity="${toEntity}"`);

        if (!assetId || !fromEntity || !toEntity) {
            return res.status(400).json({ error: "assetId, fromEntity, and toEntity are required." });
        }

        const normalizedFrom = String(fromEntity).trim().toUpperCase();
        if (normalizedFrom === "ALL" || normalizedFrom === "ALL ENTITIES") {
            return res.status(400).json({ error: "Cannot transfer from 'All Entities' view. Please switch to a specific entity first." });
        }

        if (normalizedFrom === String(toEntity).trim().toUpperCase()) {
            return res.status(400).json({ error: "Source and target entities must be different." });
        }

        // ── Get source asset ──────────────────────────────────────────────────
        const SourceAsset = await getAssetModel(fromEntity);
        const seq = SourceAsset.sequelize;
        const assetIdStr = String(assetId).trim();

        let sourceAsset = await SourceAsset.findOne({ where: { assetId: assetIdStr } });
        if (!sourceAsset) {
            sourceAsset = await SourceAsset.findOne({
                where: {
                    [Op.and]: [
                        { assetId: { [Op.not]: null } },
                        seq.where(seq.fn("LOWER", seq.col("assetId")), assetIdStr.toLowerCase())
                    ]
                }
            });
        }

        if (!sourceAsset) {
            const total = await SourceAsset.count();
            return res.status(404).json({
                error: `Asset "${assetIdStr}" not found in entity "${fromEntity}". The entity DB has ${total} assets.`
            });
        }

        const assetData = sourceAsset.toJSON();

        if (["Retired", "Theft/Missing", "Pending Approval"].includes(assetData.status)) {
            return res.status(400).json({
                error: `Cannot transfer an asset with status "${assetData.status}".`
            });
        }

        const previousAssetStatus = assetData.status;

        // ── Pre-generate target asset ID (stored in payload for use on approval) ──
        const TargetAsset = await getAssetModel(toEntity);
        const generatedId = await generateAssetId(toEntity, assetData.category, TargetAsset.sequelize);
        const targetAssetId = generatedId || assetData.assetId;

        // Check for duplicate in target entity
        const existingInTarget = await TargetAsset.findOne({ where: { assetId: targetAssetId } });
        if (existingInTarget) {
            return res.status(409).json({ error: `Asset ID "${targetAssetId}" already exists in ${toEntity}.` });
        }

        const dateStr = transferDate || new Date().toISOString().split("T")[0];

        // ── Lock source asset ─────────────────────────────────────────────────
        await sourceAsset.update({ status: "Pending Approval" });

        // ── Create pending transfer log ───────────────────────────────────────
        const transferLog = await AssetTransfer.create({
            sourceAssetId: assetData.assetId,
            assetName:     assetData.name,
            category:      assetData.category,
            serialNumber:  assetData.serialNumber,
            makeModel:     assetData.makeModel,
            fromEntity:    String(fromEntity).trim().toUpperCase(),
            toEntity:      String(toEntity).trim().toUpperCase(),
            reason:        reason || "",
            notes:         notes || "",
            authorizedBy:  authorizedBy || req.user?.name || req.user?.email || "System",
            transferDate:  dateStr,
            targetAssetId: targetAssetId,
            status:        "Pending"
        });

        // ── Create approval request ───────────────────────────────────────────
        const approval = await ApprovalRequest.create({
            requestType:         "transfer",
            entityCode:          String(fromEntity).trim().toUpperCase(),
            assetId:             assetData.assetId,
            assetName:           assetData.name,
            requestedBy:         req.user?.name || req.user?.email || "System",
            requestedByEmail:    req.user?.email || "",
            previousAssetStatus,
            transferId:          transferLog.id,
            payload: {
                fromEntity:    String(fromEntity).trim().toUpperCase(),
                toEntity:      String(toEntity).trim().toUpperCase(),
                assetData,
                targetAssetId,
                reason:        reason || "",
                notes:         notes || "",
                authorizedBy:  authorizedBy || req.user?.name || req.user?.email || "System",
                transferDate:  dateStr,
                transferLogId: transferLog.id
            }
        });

        await logAudit(
            req,
            "TRANSFER_REQUESTED",
            `Asset ${assetData.assetId} (${assetData.name}) transfer from ${fromEntity} to ${toEntity} submitted for approval.`
        );

        // Non-blocking approval request email to IT team
        try {
            const EmailSettings = require("../models/EmailSettings");
            const NotificationSettings = require("../models/NotificationSettings");
            const Entity = require("../models/Entity");
            const { sendApprovalRequestEmail } = require("../services/emailService");
            const settings = await EmailSettings.findOne();
            const notifSettings = await NotificationSettings.findOne();
            if (settings?.enabled && notifSettings?.approvalRequest !== false) {
                const entityInfo = await Entity.findOne({ where: { code: String(fromEntity).trim().toUpperCase() } });
                const backendUrl = settings.backendUrl || `http://${req.hostname}:5000`;
                await sendApprovalRequestEmail({
                    settings: settings.toJSON(),
                    approval: { ...approval.toJSON(), requestedBy: req.user?.name || req.user?.email || "System" },
                    entityInfo: entityInfo?.toJSON ? entityInfo.toJSON() : entityInfo,
                    backendUrl,
                    entityCode: String(fromEntity).trim().toUpperCase()
                });
            }
        } catch (emailErr) {
            console.error("[initiateTransfer] Approval request email failed:", emailErr.message);
        }

        res.json({
            message: `Transfer request for "${assetData.name}" submitted for manager approval.`,
            requestId: approval.id,
            transferId: transferLog.id
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
