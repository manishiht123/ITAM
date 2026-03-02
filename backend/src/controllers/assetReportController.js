const TenantManager = require("../utils/TenantManager");
const Entity = require("../models/Entity");
const SystemPreference = require("../models/SystemPreference");

// ── helpers ───────────────────────────────────────────────────────────────────

const getAssetModel = async (entityCode) => {
    const sequelize = await TenantManager.getConnection(entityCode);
    if (!sequelize.models.Asset) {
        const Asset = require("../models/Asset");
        if (Asset.init) return Asset.init(sequelize);
    }
    return sequelize.models.Asset;
};

/** Aggregate a flat asset array grouped by `field` (department | location) */
const groupAssets = (assets, field) => {
    const groups = {};

    assets.forEach((a) => {
        const key = (a[field] || "").trim() || "Unassigned";
        if (!groups[key]) {
            groups[key] = {
                name: key,
                total: 0,
                inUse: 0,
                available: 0,
                underRepair: 0,
                retired: 0,
                other: 0,
                categories: {},
            };
        }
        const g = groups[key];
        g.total++;

        const st = (a.status || "").toLowerCase();
        if (st === "in use" || st === "allocated")           g.inUse++;
        else if (st === "available" || st === "in stock")    g.available++;
        else if (st === "under repair")                      g.underRepair++;
        else if (st === "retired")                           g.retired++;
        else                                                 g.other++;

        const cat = (a.category || "Uncategorized").trim();
        g.categories[cat] = (g.categories[cat] || 0) + 1;
    });

    return Object.values(groups)
        .map((g) => ({
            ...g,
            utilization: g.total > 0 ? Math.round((g.inUse / g.total) * 100) : 0,
            topCategory: Object.entries(g.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || "—",
        }))
        .sort((a, b) => b.total - a.total);
};

/** Fetch all assets across entities (or for a single entity) */
const fetchAssets = async (entityCode) => {
    const isAll = !entityCode || entityCode.toUpperCase() === "ALL" || entityCode.toUpperCase() === "ALL ENTITIES";

    if (isAll) {
        const entities = await Entity.findAll();
        const results = await Promise.allSettled(
            entities.map(async (e) => {
                const AssetModel = await getAssetModel(e.code);
                return AssetModel.findAll({
                    attributes: ["assetId", "department", "location", "status", "category"],
                    raw: true,
                });
            })
        );
        return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    }

    const AssetModel = await getAssetModel(entityCode);
    return AssetModel.findAll({
        attributes: ["assetId", "department", "location", "status", "category"],
        raw: true,
    });
};

// ── Export helpers for use by other modules (e.g. reportScheduler) ────────────
exports.groupAssets = groupAssets;
exports.fetchAssets = fetchAssets;

// ── controllers ───────────────────────────────────────────────────────────────

exports.getReportByDepartment = async (req, res) => {
    try {
        const entityCode = req.headers["x-entity-code"];
        const assets = await fetchAssets(entityCode);
        res.json(groupAssets(assets, "department"));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getReportByLocation = async (req, res) => {
    try {
        const entityCode = req.headers["x-entity-code"];
        const assets = await fetchAssets(entityCode);
        res.json(groupAssets(assets, "location"));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.exportReportByDepartment = async (req, res) => {
    try {
        const entityCode = req.headers["x-entity-code"];
        const assets = await fetchAssets(entityCode);
        sendCSV(res, groupAssets(assets, "department"), "department-report");
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.exportReportByLocation = async (req, res) => {
    try {
        const entityCode = req.headers["x-entity-code"];
        const assets = await fetchAssets(entityCode);
        sendCSV(res, groupAssets(assets, "location"), "location-report");
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── Depreciation helpers ───────────────────────────────────────────────────────

/** Fetch all assets (with financial fields) across entities or for a single entity */
const fetchDepreciationAssets = async (entityCode) => {
    const attrs = [
        "assetId", "name", "category", "department", "status",
        "dateOfPurchase", "price",
        "depreciationMethod", "usefulLifeMonths", "salvageValueAmount"
    ];
    const isAll = !entityCode || entityCode.toUpperCase() === "ALL" || entityCode.toUpperCase() === "ALL ENTITIES";

    if (isAll) {
        const entities = await Entity.findAll();
        const results = await Promise.allSettled(
            entities.map(async (e) => {
                const AssetModel = await getAssetModel(e.code);
                const rows = await AssetModel.findAll({ attributes: attrs, raw: true });
                return rows.map((r) => ({ ...r, _entity: e.code }));
            })
        );
        return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    }

    const AssetModel = await getAssetModel(entityCode);
    const rows = await AssetModel.findAll({ attributes: attrs, raw: true });
    return rows.map((r) => ({ ...r, _entity: entityCode }));
};

/**
 * Compute depreciation for a single asset.
 * @param {object} asset  - row from Assets table
 * @param {object} prefs  - global SystemPreference row
 * @returns {object}      - enriched asset with depreciation figures
 */
const calcDepreciation = (asset, prefs) => {
    const cost = parseFloat(asset.price) || 0;
    const purchaseDate = asset.dateOfPurchase ? new Date(asset.dateOfPurchase) : null;

    // Per-asset overrides fall back to global prefs
    const method = asset.depreciationMethod || prefs.depreciationMethod || "Straight Line";
    const usefulLifeMonths = asset.usefulLifeMonths || prefs.defaultUsefulLife || 36;
    const salvageValue = asset.salvageValueAmount != null
        ? parseFloat(asset.salvageValueAmount)
        : cost * ((prefs.salvageValuePercent || 5) / 100);

    if (!cost || !purchaseDate) {
        return {
            ...asset,
            cost,
            purchaseDate: asset.dateOfPurchase || null,
            method,
            usefulLifeMonths,
            salvageValue: Math.round(salvageValue),
            monthsElapsed: null,
            bookValue: cost || null,
            totalDepreciated: 0,
            depreciationPct: 0,
            status: asset.status || "—"
        };
    }

    const now = new Date();
    const monthsElapsed = Math.max(
        0,
        (now.getFullYear() - purchaseDate.getFullYear()) * 12 +
        (now.getMonth() - purchaseDate.getMonth())
    );

    let bookValue;
    const depreciableAmount = cost - salvageValue;

    if (method === "Declining Balance" || method === "WDV") {
        // Written-Down Value (annual rate derived from useful life)
        const usefulLifeYears = usefulLifeMonths / 12;
        const annualRate = usefulLifeYears > 0
            ? 1 - Math.pow(salvageValue / Math.max(cost, 1), 1 / usefulLifeYears)
            : 0;
        const monthlyRate = annualRate / 12;
        bookValue = cost * Math.pow(1 - monthlyRate, monthsElapsed);
    } else {
        // Straight-Line
        const monthlyDep = usefulLifeMonths > 0 ? depreciableAmount / usefulLifeMonths : 0;
        bookValue = cost - monthlyDep * Math.min(monthsElapsed, usefulLifeMonths);
    }

    bookValue = Math.max(salvageValue, Math.round(bookValue));
    const totalDepreciated = Math.round(cost - bookValue);
    const depreciationPct = cost > 0 ? Math.round((totalDepreciated / cost) * 100) : 0;

    return {
        ...asset,
        cost,
        purchaseDate: asset.dateOfPurchase,
        method,
        usefulLifeMonths,
        salvageValue: Math.round(salvageValue),
        monthsElapsed,
        bookValue,
        totalDepreciated,
        depreciationPct,
        status: asset.status || "—"
    };
};

exports.getDepreciationReport = async (req, res) => {
    try {
        const entityCode = req.headers["x-entity-code"];
        const [assets, prefs] = await Promise.all([
            fetchDepreciationAssets(entityCode),
            SystemPreference.findOne()
        ]);
        const global = prefs || {};
        const rows = assets.map((a) => calcDepreciation(a, global));
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.exportDepreciationReport = async (req, res) => {
    try {
        const entityCode = req.headers["x-entity-code"];
        const [assets, prefs] = await Promise.all([
            fetchDepreciationAssets(entityCode),
            SystemPreference.findOne()
        ]);
        const global = prefs || {};
        const rows = assets.map((a) => calcDepreciation(a, global));

        const headers = [
            "Asset ID", "Name", "Category", "Department", "Status",
            "Purchase Date", "Cost (₹)", "Method", "Useful Life (Mo)",
            "Salvage Value (₹)", "Months Elapsed", "Book Value (₹)",
            "Total Depreciated (₹)", "Depreciation %"
        ];
        const lines = [
            headers.join(","),
            ...rows.map((r) =>
                [
                    r.assetId, r.name, r.category, r.department, r.status,
                    r.purchaseDate || "", r.cost, r.method, r.usefulLifeMonths,
                    r.salvageValue, r.monthsElapsed ?? "", r.bookValue ?? "",
                    r.totalDepreciated, r.depreciationPct + "%"
                ]
                    .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
                    .join(",")
            )
        ].join("\n");

        const date = new Date().toISOString().split("T")[0];
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="depreciation-report-${date}.csv"`);
        res.send(lines);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── Faulty Asset Report ────────────────────────────────────────────────────────

const FAULTY_STATUSES    = new Set(["under repair", "theft/missing", "not submitted"]);
const FAULTY_CONDITIONS  = new Set(["needs repair", "fair"]);

const isFaulty = (a) =>
    FAULTY_STATUSES.has((a.status || "").toLowerCase()) ||
    FAULTY_CONDITIONS.has((a.condition || "").toLowerCase());

/** Fetch all asset fields needed for the faulty report */
const fetchFaultyAssets = async (entityCode) => {
    const attrs = [
        "assetId", "name", "category", "department", "location",
        "status", "condition", "makeModel", "serialNumber",
        "comments", "dateOfPurchase", "warrantyExpireDate",
        "vendorName", "employeeId"
    ];
    const isAll = !entityCode || entityCode.toUpperCase() === "ALL" || entityCode.toUpperCase() === "ALL ENTITIES";

    if (isAll) {
        const entities = await Entity.findAll();
        const results = await Promise.allSettled(
            entities.map(async (e) => {
                const AssetModel = await getAssetModel(e.code);
                const rows = await AssetModel.findAll({ attributes: attrs, raw: true });
                return rows.map((r) => ({ ...r, _entity: e.code }));
            })
        );
        return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    }

    const AssetModel = await getAssetModel(entityCode);
    const rows = await AssetModel.findAll({ attributes: attrs, raw: true });
    return rows.map((r) => ({ ...r, _entity: entityCode }));
};

exports.getFaultyAssetsReport = async (req, res) => {
    try {
        const entityCode = req.headers["x-entity-code"];
        const assets = await fetchFaultyAssets(entityCode);
        const today = new Date();
        const faulty = assets
            .filter(isFaulty)
            .map((a) => {
                const warrantyExpired = a.warrantyExpireDate
                    ? new Date(a.warrantyExpireDate) < today
                    : null;
                return { ...a, warrantyExpired };
            });
        res.json(faulty);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.exportFaultyAssetsReport = async (req, res) => {
    try {
        const entityCode = req.headers["x-entity-code"];
        const assets = await fetchFaultyAssets(entityCode);
        const today = new Date();
        const faulty = assets
            .filter(isFaulty)
            .map((a) => ({
                ...a,
                warrantyExpired: a.warrantyExpireDate
                    ? new Date(a.warrantyExpireDate) < today
                    : null
            }));

        const headers = [
            "Asset ID", "Name", "Category", "Department", "Location",
            "Status", "Condition", "Make / Model", "Serial Number",
            "Employee ID", "Vendor", "Purchase Date", "Warranty Expiry",
            "Warranty Expired?", "Comments"
        ];
        const lines = [
            headers.join(","),
            ...faulty.map((r) =>
                [
                    r.assetId, r.name, r.category, r.department, r.location,
                    r.status, r.condition, r.makeModel, r.serialNumber,
                    r.employeeId || "", r.vendorName || "",
                    r.dateOfPurchase || "", r.warrantyExpireDate || "",
                    r.warrantyExpired == null ? "" : (r.warrantyExpired ? "Yes" : "No"),
                    r.comments || ""
                ]
                    .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
                    .join(",")
            )
        ].join("\n");

        const date = new Date().toISOString().split("T")[0];
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="faulty-assets-${date}.csv"`);
        res.send(lines);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── Warranty Alerts ────────────────────────────────────────────────────────────

/** Fetch all asset fields needed for warranty alert report */
const fetchWarrantyAssets = async (entityCode) => {
    const attrs = [
        "assetId", "name", "category", "department", "location",
        "status", "makeModel", "serialNumber",
        "vendorName", "warrantyExpireDate", "dateOfPurchase", "employeeId"
    ];
    const isAll = !entityCode || entityCode.toUpperCase() === "ALL" || entityCode.toUpperCase() === "ALL ENTITIES";

    if (isAll) {
        const entities = await Entity.findAll();
        const results = await Promise.allSettled(
            entities.map(async (e) => {
                const AssetModel = await getAssetModel(e.code);
                const rows = await AssetModel.findAll({ attributes: attrs, raw: true });
                return rows.map((r) => ({ ...r, _entity: e.code }));
            })
        );
        return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    }

    const AssetModel = await getAssetModel(entityCode);
    const rows = await AssetModel.findAll({ attributes: attrs, raw: true });
    return rows.map((r) => ({ ...r, _entity: entityCode }));
};

const buildWarrantyRows = (assets, days) => {
    const today = new Date();
    return assets
        .filter((a) => a.warrantyExpireDate)
        .map((a) => {
            const expiry = new Date(a.warrantyExpireDate);
            const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
            const warrantyExpired = expiry < today;
            let urgency = "ok";
            if (warrantyExpired)         urgency = "expired";
            else if (daysUntilExpiry <= 7)  urgency = "critical";
            else if (daysUntilExpiry <= 30) urgency = "warning";
            else if (daysUntilExpiry <= 90) urgency = "soon";
            return { ...a, daysUntilExpiry, warrantyExpired, urgency };
        })
        .filter((a) => a.daysUntilExpiry <= days)
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
};

exports.getWarrantyAlerts = async (req, res) => {
    try {
        const entityCode = req.headers["x-entity-code"];
        const days = parseInt(req.query.days, 10) || 90;
        const assets = await fetchWarrantyAssets(entityCode);
        res.json(buildWarrantyRows(assets, days));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.exportWarrantyAlerts = async (req, res) => {
    try {
        const entityCode = req.headers["x-entity-code"];
        const days = parseInt(req.query.days, 10) || 90;
        const assets = await fetchWarrantyAssets(entityCode);
        const rows = buildWarrantyRows(assets, days);

        const headers = [
            "Asset ID", "Name", "Category", "Department", "Location",
            "Status", "Make / Model", "Serial Number",
            "Vendor", "Warranty Expiry", "Days Until Expiry", "Expired?", "Urgency"
        ];
        const lines = [
            headers.join(","),
            ...rows.map((r) =>
                [
                    r.assetId, r.name, r.category, r.department, r.location,
                    r.status, r.makeModel, r.serialNumber,
                    r.vendorName || "", r.warrantyExpireDate,
                    r.daysUntilExpiry, r.warrantyExpired ? "Yes" : "No", r.urgency
                ]
                    .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
                    .join(",")
            )
        ].join("\n");

        const date = new Date().toISOString().split("T")[0];
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="warranty-alerts-${date}.csv"`);
        res.send(lines);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Export for use in warrantyAlertScheduler
exports.fetchWarrantyAssets = fetchWarrantyAssets;
exports.buildWarrantyRows   = buildWarrantyRows;

// ── CSV helper ────────────────────────────────────────────────────────────────

function sendCSV(res, rows, filename) {
    const headers = ["Name", "Total", "In Use", "Available", "Under Repair", "Retired", "Other", "Utilization %", "Top Category"];
    const lines = [
        headers.join(","),
        ...rows.map((r) =>
            [r.name, r.total, r.inUse, r.available, r.underRepair, r.retired, r.other, r.utilization + "%", r.topCategory]
                .map((v) => `"${String(v || "").replace(/"/g, '""')}"`)
                .join(",")
        ),
    ].join("\n");

    const date = new Date().toISOString().split("T")[0];
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}-${date}.csv"`);
    res.send(lines);
}
