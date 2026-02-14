const TenantManager = require("../utils/TenantManager");
const { Op } = require("sequelize");
const XLSX = require("xlsx");
const { sendAllocationEmail, sendReturnEmail } = require("../services/emailService");
const NotificationSettings = require("../models/NotificationSettings");
const Entity = require("../models/Entity");
const defaultSequelize = require("../config/db");
const AuditLog = require("../models/AuditLog");

const normalizeAssetKey = (asset) => {
    const entity = (asset.entity || "GLOBAL").toString().trim().toUpperCase();
    const rawId = asset.assetId || asset.id;
    const assetId = rawId ? String(rawId).trim().toUpperCase() : "";
    return `${entity}::${assetId}`;
};

const dedupeAssets = (assets) => {
    const map = new Map();
    assets.forEach((asset) => {
        const key = normalizeAssetKey(asset);
        if (!map.has(key)) {
            map.set(key, asset);
        }
    });
    return Array.from(map.values());
};

const getAssetModel = async (req) => {
    const entityCode = req.headers['x-entity-code'];
    console.log(`[AssetController] Loading assets for entity: ${entityCode || "Global"}`);
    const sequelize = await TenantManager.getConnection(entityCode);
    if (!sequelize.models.Asset) {
        console.error("[AssetController] Asset model not found on connection!");
        // Force init if missing (fallback)
        const Asset = require("../models/Asset");
        // If it's the default connection, Asset should have been defined.
        // If separate connection, we need init.
    }
    return sequelize.models.Asset;
};

const logAudit = async (req, action, details = "") => {
    try {
        const user = req.user?.email || req.user?.name || "System";
        const rawIp = req.headers["x-forwarded-for"] || req.ip || req.connection?.remoteAddress;
        const ip = rawIp ? rawIp.replace(/^::ffff:/, "") : rawIp;
        await AuditLog.create({
            user,
            action,
            ip,
            details
        });
    } catch (err) {
        console.error("Audit log failed:", err.message);
    }
};

const normalizeHeader = (value) =>
    String(value || "")
        .replace(/[^a-z0-9]/gi, "")
        .toLowerCase();

const parseDate = (value) => {
    if (!value) return null;
    if (value instanceof Date && !isNaN(value.getTime())) {
        return value.toISOString().split("T")[0];
    }
    const raw = String(value).trim();
    if (!raw) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const match = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if (!match) return null;
    const [_, dd, mm, yyyy] = match;
    const day = dd.padStart(2, "0");
    const month = mm.padStart(2, "0");
    return `${yyyy}-${month}-${day}`;
};

const normalizeStatus = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "Available";
    const map = {
        allocated: "In Use",
        "in use": "In Use",
        available: "Available",
        "under repair": "Under Repair",
        retired: "Retired",
        "theft/missing": "Theft/Missing",
        "not submitted": "Not Submitted"
    };
    const key = raw.toLowerCase();
    return map[key] || raw;
};

const getDepartmentLocationSets = async (sequelize) => {
    const Department = sequelize.models.Department || require("../models/Department").init(sequelize);
    const Location = sequelize.models.Location || require("../models/Location").init(sequelize);
    const departments = await Department.findAll();
    const locations = await Location.findAll();
    const deptSet = new Set(departments.map((d) => String(d.name || "").toLowerCase()));
    const locSet = new Set(
        locations
            .map((l) => String(l.name || l.city || "").toLowerCase())
            .filter(Boolean)
    );
    return { deptSet, locSet };
};

exports.getAssets = async (req, res) => {
    try {
        const rawEntityCode = req.headers['x-entity-code'];
        const entityCode = rawEntityCode ? String(rawEntityCode).trim() : "";
        const isAllEntities = !entityCode || entityCode.toUpperCase() === "ALL" || entityCode.toUpperCase() === "ALL ENTITIES";
        if (isAllEntities) {
            // Aggregate assets across all tenant entities (exclude default DB assets)
            const entities = await Entity.findAll();
            const entityCodes = entities.map((e) => e.code).filter(Boolean);
            // Also discover any tenant DBs directly (in case Entity table is stale)
            let discoveredCodes = [];
            try {
                const [dbs] = await defaultSequelize.query("SHOW DATABASES LIKE 'itam_entity_%'");
                discoveredCodes = dbs
                    .map((row) => row.Database || row["Database (itam_entity_%)"])
                    .filter(Boolean)
                    .map((dbName) => dbName.replace("itam_entity_", "").toUpperCase());
            } catch (err) {
                console.error("[AssetController] Failed to discover tenant DBs:", err.message);
            }

            const allCodes = Array.from(new Set([...entityCodes, ...discoveredCodes]));

            const results = await Promise.allSettled([
                ...allCodes.map((code) => (async () => {
                    const sequelize = await TenantManager.getConnection(code);
                    const Asset = sequelize.models.Asset || require("../models/Asset").init(sequelize);
                    const assets = await Asset.findAll();
                    console.log(`[AssetController] ${code} assets: ${assets.length}`);
                    return assets.map((a) => ({ ...a.toJSON(), entity: a.entity || code }));
                })())
            ]);

            const aggregated = results.flatMap((r) => {
                if (r.status === "rejected") {
                    console.error("[AssetController] Aggregation error:", r.reason?.message || r.reason);
                    return [];
                }
                return r.value;
            });
            const uniqueAggregated = dedupeAssets(aggregated);
            console.log(`[AssetController] Aggregated assets: ${aggregated.length}, unique: ${uniqueAggregated.length}`);
            return res.json(uniqueAggregated);
        }

        const Asset = await getAssetModel(req);
        const assets = await Asset.findAll();
        const uniqueAssets = dedupeAssets(assets.map((a) => (a.toJSON ? a.toJSON() : a)));
        res.json(uniqueAssets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.importAssets = async (req, res) => {
    try {
        const rawEntityCode = req.headers["x-entity-code"];
        const entityCode = rawEntityCode ? String(rawEntityCode).trim() : "";
        if (!entityCode || entityCode.toUpperCase() === "ALL" || entityCode.toUpperCase() === "ALL ENTITIES") {
            return res.status(400).json({ error: "Select a single entity to import assets." });
        }
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ error: "No file uploaded." });
        }

        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (!rows.length) {
            return res.status(400).json({ error: "Import file is empty." });
        }

        const Asset = await getAssetModel(req);
        const sequelize = Asset.sequelize;
        const { deptSet, locSet } = await getDepartmentLocationSets(sequelize);

        const existingAssets = await Asset.findAll({ attributes: ["assetId"] });
        const existingSet = new Set(existingAssets.map((a) => String(a.assetId || "").toLowerCase()));

        const errors = [];
        const assetsToCreate = [];

        rows.forEach((row, index) => {
            const normalized = {};
            Object.keys(row).forEach((key) => {
                normalized[normalizeHeader(key)] = row[key];
            });

            const assetId = String(normalized.assetid || "").trim();
            if (!assetId) {
                errors.push({ row: index + 2, error: "Asset ID is required." });
                return;
            }
            if (existingSet.has(assetId.toLowerCase())) {
                errors.push({ row: index + 2, error: `Asset ID ${assetId} already exists.` });
                return;
            }

            const department = String(normalized.department || "").trim();
            if (department && !deptSet.has(department.toLowerCase())) {
                errors.push({ row: index + 2, error: `Department '${department}' not found.` });
                return;
            }

            const location = String(normalized.location || "").trim();
            if (location && !locSet.has(location.toLowerCase())) {
                errors.push({ row: index + 2, error: `Location '${location}' not found.` });
                return;
            }

            const category = String(normalized.assettype || normalized.category || "").trim() || "Laptop";
            const status = normalizeStatus(normalized.assetstatus);

            assetsToCreate.push({
                assetId,
                name: String(normalized.makemodel || normalized.assetname || assetId).trim(),
                category,
                entity: entityCode,
                status,
                employeeId: String(normalized.employeeid || "").trim() || null,
                department: department || null,
                location: location || null,
                makeModel: String(normalized.makemodel || "").trim() || null,
                serialNumber: String(normalized.serialnumber || "").trim() || null,
                storage: String(normalized.ssdhdd || "").trim() || null,
                ram: String(normalized.ramsize || "").trim() || null,
                cpu: String(normalized.cpu || "").trim() || null,
                os: String(normalized.os || "").trim() || null,
                comments: String(normalized.faultylaptopissue || "").trim() || null,
                additionalItems: String(normalized.additionalitems || "").trim() || null,
                insuranceStatus: String(normalized.insurancestatus || "").trim() || null,
                dateOfPurchase: parseDate(normalized.dateofpurchase),
                warrantyExpireDate: parseDate(normalized.warrantyexpiredate),
                price: String(normalized.price || "").trim() || null,
                invoiceNumber: String(normalized.invoicenumber || "").trim() || null,
                vendorName: String(normalized.vendorname || "").trim() || null
            });
        });

        if (errors.length) {
            return res.status(400).json({ error: "Validation failed.", details: errors });
        }

        await Asset.bulkCreate(assetsToCreate);
        return res.json({ message: `Imported ${assetsToCreate.length} assets.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.exportAssets = async (req, res) => {
    try {
        const rawEntityCode = req.headers["x-entity-code"];
        const entityCode = rawEntityCode ? String(rawEntityCode).trim() : "";
        const format = String(req.query.format || "csv").toLowerCase();

        const buildRows = async (code, assets) => {
            const sequelize = await TenantManager.getConnection(code);
            const Employee = sequelize.models.Employee || require("../models/Employee").init(sequelize);
            const SoftwareAssignment = sequelize.models.SoftwareAssignment || require("../models/SoftwareAssignment").init(sequelize);
            const SoftwareLicense = sequelize.models.SoftwareLicense || require("../models/SoftwareLicense").init(sequelize);

            const employees = await Employee.findAll();
            const assignments = await SoftwareAssignment.findAll();
            const licenses = await SoftwareLicense.findAll();

            const employeeMap = new Map(
                employees.map((e) => [String(e.employeeId || e.email || "").toLowerCase(), e.toJSON()])
            );
            const licenseMap = new Map(licenses.map((l) => [l.id, l.toJSON()]));
            const officeAssignments = new Map();
            assignments.forEach((a) => {
                const lic = licenseMap.get(a.softwareLicenseId);
                if (!lic || !/office/i.test(lic.product || "")) return;
                const key = String(a.employeeId || "").toLowerCase();
                if (key && !officeAssignments.has(key)) {
                    officeAssignments.set(key, a.toJSON());
                }
            });

            return assets.map((asset, index) => {
                const empKey = String(asset.employeeId || "").toLowerCase();
                const emp = employeeMap.get(empKey) || {};
                const office = officeAssignments.get(empKey) || {};
                return {
                    "S. No": index + 1,
                    "Employee ID": asset.employeeId || "",
                    "Asset ID": asset.assetId || "",
                    "Employee Mail": emp.email || "",
                    "Employee Name": emp.name || "",
                    "Asset Status": asset.status || "",
                    "Faulty laptop Issue": asset.comments || "",
                    "Department": asset.department || "",
                    "Location": asset.location || "",
                    "Asset Type": asset.category || "",
                    "Additional Items": asset.additionalItems || "",
                    "Make/Model": asset.makeModel || "",
                    "Serial Number": asset.serialNumber || "",
                    "Asset Owner": "",
                    "SSD/HDD": asset.storage || "",
                    "RAM SIZE": asset.ram || "",
                    "CPU": asset.cpu || "",
                    "OS": asset.os || "",
                    "Date of Purchase": asset.dateOfPurchase || "",
                    "Warranty Expire Date": asset.warrantyExpireDate || "",
                    "Price": asset.price || "",
                    "Invoice Number": asset.invoiceNumber || "",
                    "Vendor Name": asset.vendorName || "",
                    "Last User": "",
                    "Insurance Status": asset.insuranceStatus || "",
                    "MS Office Email": office.employeeEmail || emp.email || "",
                    "Windows Keys": "",
                    "Laptop Allocation Date": asset.status === "In Use" && asset.updatedAt
                        ? new Date(asset.updatedAt).toISOString().split("T")[0]
                        : ""
                };
            });
        };

        let rows = [];
        if (!entityCode || entityCode.toUpperCase() === "ALL" || entityCode.toUpperCase() === "ALL ENTITIES") {
            const entities = await Entity.findAll();
            const entityCodes = entities.map((e) => e.code).filter(Boolean);
            const results = await Promise.allSettled(
                entityCodes.map(async (code) => {
                    const sequelize = await TenantManager.getConnection(code);
                    const Asset = sequelize.models.Asset || require("../models/Asset").init(sequelize);
                    const assets = await Asset.findAll();
                    return buildRows(code, assets.map((a) => a.toJSON()));
                })
            );
            rows = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
        } else {
            const Asset = await getAssetModel(req);
            const assets = await Asset.findAll();
            rows = await buildRows(entityCode, assets.map((a) => a.toJSON()));
        }

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Assets");

        if (format === "xlsx") {
            const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=assets_export.xlsx");
            return res.send(buffer);
        }

        const csv = XLSX.utils.sheet_to_csv(worksheet);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=assets_export.csv");
        return res.send(csv);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createAsset = async (req, res) => {
    try {
        const Asset = await getAssetModel(req);
        const incomingAssetId = req.body?.assetId ? String(req.body.assetId).trim() : "";
        if (!incomingAssetId) {
            return res.status(400).json({ error: "assetId is required" });
        }

        const existing = await Asset.findOne({
            where: {
                [Op.and]: [
                    { assetId: { [Op.not]: null } },
                    Asset.sequelize.where(
                        Asset.sequelize.fn("LOWER", Asset.sequelize.col("assetId")),
                        incomingAssetId.toLowerCase()
                    )
                ]
            }
        });

        if (existing) {
            return res.status(409).json({ error: "Asset ID already exists" });
        }

        const asset = await Asset.create(req.body);
        await logAudit(req, "Asset created", `Asset ID: ${asset.assetId || asset.id}`);
        res.status(201).json(asset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateAsset = async (req, res) => {
    try {
        const Asset = await getAssetModel(req);
        const existing = await Asset.findByPk(req.params.id);

        const nextStatus = req.body?.status;
        const nextEmployeeId = req.body?.employeeId ? String(req.body.employeeId).trim() : "";
        const wantsAllocation = ["In Use", "Allocated"].includes(nextStatus);
        if (wantsAllocation && nextEmployeeId) {
            const SystemPreference = require("../models/SystemPreference");
            const pref = await SystemPreference.findOne();
            const maxAssetsPerEmployee = pref?.maxAssetsPerEmployee ?? 2;
            const overuseProtectionEnabled = pref?.overuseProtectionEnabled !== false;

            if (overuseProtectionEnabled) {
                const License = Asset.sequelize.models.License || require("../models/License").init(Asset.sequelize);
                const overused = await License.findOne({
                    where: Asset.sequelize.where(
                        Asset.sequelize.col("seatsUsed"),
                        { [Op.gt]: Asset.sequelize.col("seatsOwned") }
                    )
                });
                if (overused) {
                    return res.status(409).json({ error: "Allocation blocked: license usage is over the purchased limit." });
                }
            }
            const allocatedCount = await Asset.count({
                where: {
                    [Op.and]: [
                        { id: { [Op.ne]: req.params.id } },
                        { status: { [Op.in]: ["In Use", "Allocated"] } },
                        Asset.sequelize.where(
                            Asset.sequelize.fn("LOWER", Asset.sequelize.col("employeeId")),
                            nextEmployeeId.toLowerCase()
                        )
                    ]
                }
            });

            if (allocatedCount >= maxAssetsPerEmployee) {
                return res.status(409).json({ error: `Employee already has ${maxAssetsPerEmployee} allocated assets.` });
            }
        }

        await Asset.update(req.body, { where: { id: req.params.id } });
        const updated = await Asset.findByPk(req.params.id);
        await logAudit(
            req,
            "Asset updated",
            `Asset ID: ${updated?.assetId || req.params.id}, Status: ${updated?.status || "Unknown"}`
        );

        // Fire email notifications (non-blocking behavior)
        try {
            const entityCode = req.headers['x-entity-code'];
            const sequelize = await TenantManager.getConnection(entityCode);
            const Employee = sequelize.models.Employee || require("../models/Employee").init(sequelize);
            const EmailSettings = sequelize.models.EmailSettings || require("../models/EmailSettings").init(sequelize);
            const settings = await EmailSettings.findOne();
            const notificationSettings = await NotificationSettings.findOne();

            const lookupEmployee = async (employeeId) => {
                if (!employeeId) return null;
                return Employee.findOne({
                    where: {
                        [Op.or]: [
                            { employeeId: employeeId },
                            { email: employeeId }
                        ]
                    }
                });
            };

            if (existing && updated) {
                const wasAllocated = ["In Use", "Allocated"].includes(existing.status);
                const nowAllocated = updated.status === "In Use";
                const nowAvailable = ["Available", "In Stock"].includes(updated.status);

                const becameAllocated = !wasAllocated && nowAllocated;
                const becameReturned = wasAllocated && nowAvailable;

                const allocationEnabled = notificationSettings ? notificationSettings.assetAllocation !== false : true;
                const returnEnabled = notificationSettings ? notificationSettings.assetReturn !== false : true;

                if (becameAllocated && updated.employeeId && allocationEnabled) {
                    const employee = await lookupEmployee(updated.employeeId);
                    await sendAllocationEmail({ settings, employee, asset: updated });
                }

                if (becameReturned && returnEnabled) {
                    const employee = await lookupEmployee(existing.employeeId);
                    await sendReturnEmail({ settings, employee, asset: updated });
                }
            }
        } catch (emailErr) {
            console.error("Email notification failed:", emailErr.message);
        }

        res.json({ message: "Asset updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteAsset = async (req, res) => {
    try {
        const Asset = await getAssetModel(req);
        const existing = await Asset.findByPk(req.params.id);
        await Asset.destroy({ where: { id: req.params.id } });
        await logAudit(req, "Asset deleted", `Asset ID: ${existing?.assetId || req.params.id}`);
        res.json({ message: "Asset deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
