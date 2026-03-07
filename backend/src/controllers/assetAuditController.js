const { Op } = require("sequelize");
const AssetAudit = require("../models/AssetAudit");
const AssetAuditItem = require("../models/AssetAuditItem");
const AuditLog = require("../models/AuditLog");
const TenantManager = require("../utils/TenantManager");

const logAudit = async (user, ip, action, details = "") => {
    try { await AuditLog.create({ user, action, ip, details }); } catch (_) {}
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

// Determine which entities the user can see
const userEntities = (req) => {
    const isAdmin = ["admin", "superadmin", "administrator"].includes(
        (req.user?.role || "").toLowerCase()
    );
    if (isAdmin) return null;
    return Array.isArray(req.user?.allowedEntities) ? req.user.allowedEntities : [];
};

// ── GET /api/audits ──────────────────────────────────────────────────────────

exports.getAudits = async (req, res) => {
    try {
        const where = {};
        const allowed = userEntities(req);
        if (allowed !== null && allowed.length > 0) {
            where.entityCode = { [Op.in]: allowed };
        }
        const audits = await AssetAudit.findAll({
            where,
            order: [["createdAt", "DESC"]]
        });
        res.json(audits);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── GET /api/audits/:id ──────────────────────────────────────────────────────

exports.getAudit = async (req, res) => {
    try {
        const audit = await AssetAudit.findByPk(req.params.id);
        if (!audit) return res.status(404).json({ error: "Audit session not found." });

        const items = await AssetAuditItem.findAll({
            where: { auditId: audit.id },
            order: [["assetId", "ASC"]]
        });

        res.json({ ...audit.toJSON(), items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── POST /api/audits ─────────────────────────────────────────────────────────

exports.createAudit = async (req, res) => {
    try {
        const { sessionName, entityCode, location, department, auditDate, notes } = req.body || {};

        if (!sessionName || !entityCode || !auditDate) {
            return res.status(400).json({ error: "sessionName, entityCode, and auditDate are required." });
        }

        const creator = req.user?.name || req.user?.email || "System";
        const creatorEmail = req.user?.email || "";

        // Load assets from tenant DB
        const Asset = await getAssetModel(entityCode);
        const assetWhere = {
            status: { [Op.notIn]: ["Retired"] }
        };
        if (location) assetWhere.location = location;
        if (department) assetWhere.department = department;

        const assets = await Asset.findAll({ where: assetWhere });

        // Create the audit session
        const audit = await AssetAudit.create({
            sessionName,
            entityCode: String(entityCode).trim().toUpperCase(),
            location: location || null,
            department: department || null,
            auditDate,
            status: "Draft",
            createdBy: creator,
            createdByEmail: creatorEmail,
            notes: notes || null,
            totalExpected: assets.length,
            totalFound: 0,
            totalNotFound: 0,
            totalConditionChanged: 0,
        });

        // Batch-create audit items
        if (assets.length > 0) {
            const items = assets.map(a => ({
                auditId:        audit.id,
                assetId:        a.assetId || String(a.id),
                assetName:      a.name || "",
                category:       a.category || "",
                serialNumber:   a.serialNumber || "",
                makeModel:      a.makeModel || "",
                location:       a.location || "",
                department:     a.department || "",
                employeeId:     a.employeeId || "",
                expectedStatus: a.status || "",
                scanStatus:     "Pending",
            }));
            await AssetAuditItem.bulkCreate(items);
        }

        await logAudit(creatorEmail, buildIp(req), "AUDIT_CREATED",
            `Physical audit "${sessionName}" created for entity ${entityCode} with ${assets.length} assets.`
        );

        res.status(201).json({ message: "Audit session created.", auditId: audit.id, totalExpected: assets.length });
    } catch (err) {
        console.error("[createAudit]", err);
        res.status(500).json({ error: err.message });
    }
};

// ── POST /api/audits/:id/start ────────────────────────────────────────────────

exports.startAudit = async (req, res) => {
    try {
        const audit = await AssetAudit.findByPk(req.params.id);
        if (!audit) return res.status(404).json({ error: "Audit session not found." });
        if (audit.status === "Completed") {
            return res.status(409).json({ error: "Audit is already completed." });
        }
        await audit.update({ status: "In Progress" });
        res.json({ message: "Audit started." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── PATCH /api/audits/:id/items/:itemId ───────────────────────────────────────

exports.scanItem = async (req, res) => {
    try {
        const { scanStatus, actualCondition, notes } = req.body || {};
        const validStatuses = ["Pending", "Found", "Not Found", "Condition Changed"];
        if (!validStatuses.includes(scanStatus)) {
            return res.status(400).json({ error: `scanStatus must be one of: ${validStatuses.join(", ")}` });
        }

        const item = await AssetAuditItem.findOne({
            where: { id: req.params.itemId, auditId: req.params.id }
        });
        if (!item) return res.status(404).json({ error: "Audit item not found." });

        const audit = await AssetAudit.findByPk(req.params.id);
        if (!audit) return res.status(404).json({ error: "Audit session not found." });
        if (audit.status === "Completed") {
            return res.status(409).json({ error: "Cannot modify a completed audit." });
        }
        if (audit.status === "Draft") {
            await audit.update({ status: "In Progress" });
        }

        await item.update({
            scanStatus,
            actualCondition: actualCondition || null,
            notes: notes || null,
            scannedAt: new Date(),
            scannedBy: req.user?.name || req.user?.email || "System",
        });

        // Recount totals
        const [found, notFound, conditionChanged] = await Promise.all([
            AssetAuditItem.count({ where: { auditId: audit.id, scanStatus: "Found" } }),
            AssetAuditItem.count({ where: { auditId: audit.id, scanStatus: "Not Found" } }),
            AssetAuditItem.count({ where: { auditId: audit.id, scanStatus: "Condition Changed" } }),
        ]);

        await audit.update({
            totalFound: found,
            totalNotFound: notFound,
            totalConditionChanged: conditionChanged,
        });

        res.json({ message: "Item scanned.", item: item.toJSON(), totals: { found, notFound, conditionChanged } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── POST /api/audits/:id/complete ─────────────────────────────────────────────

exports.completeAudit = async (req, res) => {
    try {
        const audit = await AssetAudit.findByPk(req.params.id);
        if (!audit) return res.status(404).json({ error: "Audit session not found." });
        if (audit.status === "Completed") {
            return res.status(409).json({ error: "Audit is already completed." });
        }

        // Final recount
        const [found, notFound, conditionChanged] = await Promise.all([
            AssetAuditItem.count({ where: { auditId: audit.id, scanStatus: "Found" } }),
            AssetAuditItem.count({ where: { auditId: audit.id, scanStatus: "Not Found" } }),
            AssetAuditItem.count({ where: { auditId: audit.id, scanStatus: "Condition Changed" } }),
        ]);

        await audit.update({
            status: "Completed",
            completedAt: new Date(),
            totalFound: found,
            totalNotFound: notFound,
            totalConditionChanged: conditionChanged,
        });

        await logAudit(
            req.user?.email || "",
            buildIp(req),
            "AUDIT_COMPLETED",
            `Physical audit "${audit.sessionName}" (ID ${audit.id}) completed. Found: ${found}, Not Found: ${notFound}, Condition Changed: ${conditionChanged} of ${audit.totalExpected}.`
        );

        res.json({ message: "Audit completed.", auditId: audit.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── DELETE /api/audits/:id ───────────────────────────────────────────────────

exports.deleteAudit = async (req, res) => {
    try {
        const audit = await AssetAudit.findByPk(req.params.id);
        if (!audit) return res.status(404).json({ error: "Audit session not found." });
        if (audit.status === "Completed") {
            return res.status(409).json({ error: "Cannot delete a completed audit." });
        }

        await AssetAuditItem.destroy({ where: { auditId: audit.id } });
        await audit.destroy();

        res.json({ message: "Audit session deleted." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── GET /api/audits/:id/export ────────────────────────────────────────────────

exports.exportAudit = async (req, res) => {
    try {
        const audit = await AssetAudit.findByPk(req.params.id);
        if (!audit) return res.status(404).json({ error: "Audit session not found." });

        const items = await AssetAuditItem.findAll({
            where: { auditId: audit.id },
            order: [["assetId", "ASC"]]
        });

        const header = ["Asset ID", "Asset Name", "Category", "Serial Number", "Make/Model",
            "Location", "Department", "Employee", "Expected Status", "Scan Status",
            "Actual Condition", "Scanned At", "Scanned By", "Notes"].join(",");

        const escape = (v) => `"${String(v || "").replace(/"/g, '""')}"`;

        const rows = items.map(i => [
            escape(i.assetId), escape(i.assetName), escape(i.category),
            escape(i.serialNumber), escape(i.makeModel), escape(i.location),
            escape(i.department), escape(i.employeeId), escape(i.expectedStatus),
            escape(i.scanStatus), escape(i.actualCondition),
            i.scannedAt ? escape(new Date(i.scannedAt).toLocaleString()) : '""',
            escape(i.scannedBy), escape(i.notes)
        ].join(","));

        const csv = [header, ...rows].join("\n");
        const filename = `Audit_${audit.sessionName.replace(/\s+/g, "_")}_${audit.auditDate}.csv`;

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
