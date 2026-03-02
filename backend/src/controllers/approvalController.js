const { Op } = require("sequelize");
const ApprovalRequest = require("../models/ApprovalRequest");
const AssetDisposal = require("../models/AssetDisposal");
const AssetTransfer = require("../models/AssetTransfer");
const AuditLog = require("../models/AuditLog");
const TenantManager = require("../utils/TenantManager");

const logAudit = async (user, ip, action, details = "") => {
    try {
        await AuditLog.create({ user, action, ip, details });
    } catch (_) {}
};

const buildIp = (req) => {
    const raw = req.headers["x-forwarded-for"] || req.ip || req.connection?.remoteAddress || "";
    return raw.replace(/^::ffff:/, "");
};

const getAssetModel = async (entityCode) => {
    const seq = await TenantManager.getConnection(entityCode);
    if (!seq.models.Asset) {
        const Asset = require("../models/Asset");
        if (Asset.init) return Asset.init(seq);
    }
    return seq.models.Asset;
};

// ── Determine which entities the current user can see ────────────────────────
const userEntities = (req) => {
    const isAdmin = ["admin", "superadmin", "administrator"].includes(
        (req.user?.role || "").toLowerCase()
    );
    if (isAdmin) return null; // null = no filter (see all)
    return Array.isArray(req.user?.allowedEntities) ? req.user.allowedEntities : [];
};

// ── GET /api/approvals ────────────────────────────────────────────────────────

exports.getApprovals = async (req, res) => {
    try {
        const isManager = ["admin", "superadmin", "administrator", "manager"].includes(
            (req.user?.role || "").toLowerCase()
        );
        const { status } = req.query;

        const where = {};
        if (status) where.status = status;

        if (isManager) {
            // Managers/admins see all requests for their entities
            const allowed = userEntities(req);
            if (allowed !== null && allowed.length > 0) {
                where.entityCode = { [Op.in]: allowed };
            }
        } else {
            // Regular users see only their own requests
            where.requestedByEmail = req.user?.email || "";
        }

        const approvals = await ApprovalRequest.findAll({
            where,
            order: [["createdAt", "DESC"]]
        });

        res.json(approvals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── GET /api/approvals/pending-count ─────────────────────────────────────────

exports.getPendingCount = async (req, res) => {
    try {
        const where = { status: "Pending" };
        const allowed = userEntities(req);
        if (allowed !== null && allowed.length > 0) {
            where.entityCode = { [Op.in]: allowed };
        }
        const count = await ApprovalRequest.count({ where });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── POST /api/approvals/:id/review ───────────────────────────────────────────

exports.reviewApproval = async (req, res) => {
    try {
        const { action, comments } = req.body || {};
        if (!action || !["approve", "reject"].includes(action)) {
            return res.status(400).json({ error: "action must be 'approve' or 'reject'." });
        }

        const approval = await ApprovalRequest.findByPk(req.params.id);
        if (!approval) return res.status(404).json({ error: "Approval request not found." });
        if (approval.status !== "Pending") {
            return res.status(409).json({ error: `Request is already ${approval.status}.` });
        }

        const reviewer = req.user?.name || req.user?.email || "System";
        const reviewerEmail = req.user?.email || "";
        const ip = buildIp(req);

        if (action === "reject") {
            // ── REJECT ───────────────────────────────────────────────────────
            // Revert asset status
            try {
                const Asset = await getAssetModel(approval.entityCode);
                await Asset.update(
                    { status: approval.previousAssetStatus || "Available" },
                    { where: { assetId: approval.assetId } }
                );
            } catch (e) {
                console.error("[Approval] Revert asset status failed:", e.message);
            }

            // Cancel transfer log if applicable
            if (approval.requestType === "transfer" && approval.transferId) {
                await AssetTransfer.update(
                    { status: "Cancelled" },
                    { where: { id: approval.transferId } }
                );
            }

            // Mark approval rejected
            await approval.update({
                status:         "Rejected",
                reviewedBy:     reviewer,
                reviewedAt:     new Date(),
                reviewComments: comments || ""
            });

            await logAudit(reviewerEmail, ip, "APPROVAL_REJECTED",
                `${approval.requestType === "transfer" ? "Transfer" : "Disposal"} request for asset ${approval.assetId} rejected by ${reviewer}. Reason: ${comments || "N/A"}`
            );

            return res.json({ message: "Request rejected and asset status reverted." });
        }

        // ── APPROVE ───────────────────────────────────────────────────────────
        const payload = approval.payload || {};

        if (approval.requestType === "transfer") {
            // Re-run actual transfer: create target asset, retire source
            const { executeTransfer } = require("./assetTransferController");
            const fakeReq = { user: req.user, headers: req.headers };
            await executeTransfer(payload, fakeReq);

        } else if (approval.requestType === "disposal") {
            // Create the formal disposal record
            await AssetDisposal.create({
                assetId:        payload.assetId,
                assetName:      payload.assetName,
                category:       payload.category,
                serialNumber:   payload.serialNumber || "",
                entity:         payload.entity,
                purchasePrice:  payload.purchasePrice || "",
                disposalReason: payload.disposalReason || "End of Life",
                disposalMethod: payload.disposalMethod || "Scrap",
                disposalDate:   payload.disposalDate,
                saleValue:      payload.saleValue || "",
                authorizedBy:   payload.authorizedBy || reviewer,
                performedBy:    reviewer,
                notes:          payload.notes || ""
            });

            // Retire the asset in the tenant DB
            try {
                const Asset = await getAssetModel(approval.entityCode);
                await Asset.update(
                    { status: "Retired", employeeId: null, department: null, location: null },
                    { where: { assetId: approval.assetId } }
                );
            } catch (e) {
                console.error("[Approval] Retire asset failed:", e.message);
            }

            await logAudit(reviewerEmail, ip, "Asset retired",
                `Asset ID: ${payload.assetId}, Reason: ${payload.disposalReason}, Method: ${payload.disposalMethod}, Approved by: ${reviewer}`
            );
        }

        // Mark approval approved
        await approval.update({
            status:         "Approved",
            reviewedBy:     reviewer,
            reviewedAt:     new Date(),
            reviewComments: comments || ""
        });

        await logAudit(reviewerEmail, ip, "APPROVAL_APPROVED",
            `${approval.requestType === "transfer" ? "Transfer" : "Disposal"} request for asset ${approval.assetId} approved by ${reviewer}.`
        );

        res.json({ message: "Request approved and action executed successfully." });
    } catch (err) {
        console.error("[Approval] reviewApproval error:", err);
        res.status(500).json({ error: err.message });
    }
};
