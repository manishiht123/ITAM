const TenantManager = require("../utils/TenantManager");
const XLSX = require("xlsx");
const Entity = require("../models/Entity");
const { Op } = require("sequelize");

const getEmployeeModel = async (req) => {
    const entityCode = req.headers['x-entity-code'];
    const sequelize = await TenantManager.getConnection(entityCode);
    if (!sequelize.models.Employee) {
        const Employee = require("../models/Employee");
        if (Employee.init) {
            return Employee.init(sequelize);
        }
    }
    return sequelize.models.Employee;
};

exports.getEmployees = async (req, res) => {
    try {
        const Employee = await getEmployeeModel(req);
        const employees = await Employee.findAll();
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createEmployee = async (req, res) => {
    try {
        const Employee = await getEmployeeModel(req);
        const employee = await Employee.create(req.body);
        res.status(201).json(employee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateEmployee = async (req, res) => {
    try {
        const Employee = await getEmployeeModel(req);
        await Employee.update(req.body, { where: { id: req.params.id } });
        const updated = await Employee.findByPk(req.params.id);
        res.json(updated || { message: "Employee updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteEmployee = async (req, res) => {
    try {
        const Employee = await getEmployeeModel(req);
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }
        await employee.destroy();
        res.json({ message: "Employee deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.importEmployees = async (req, res) => {
    try {
        const rawEntityCode = req.headers["x-entity-code"];
        const entityCode = rawEntityCode ? String(rawEntityCode).trim() : "";

        if (!entityCode || entityCode.toUpperCase() === "ALL") {
            return res.status(400).json({ error: "Select a single entity to import employees." });
        }

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ error: "No file uploaded." });
        }

        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

        if (!rows.length) {
            return res.status(400).json({ error: "Import file is empty." });
        }

        const Employee = await getEmployeeModel(req);
        const existingEmployees = await Employee.findAll({ attributes: ["email", "employeeId"] });
        const existingEmails = new Set(existingEmployees.map(e => String(e.email || "").toLowerCase()));

        const toCreate = [];
        const errors = [];

        rows.forEach((row, idx) => {
            const name = String(row["Employee Name"] || row["name"] || "").trim();
            const email = String(row["Employee Email ID"] || row["email"] || "").trim();
            const empId = String(row["Employee ID"] || row["employeeId"] || "").trim();
            const department = String(row["Department"] || row["department"] || "").trim();

            if (!name || !email) {
                errors.push({ row: idx + 2, error: "Name and Email are required." });
                return;
            }

            if (existingEmails.has(email.toLowerCase())) {
                errors.push({ row: idx + 2, error: `Email ${email} already exists.` });
                return;
            }

            toCreate.push({
                name,
                email,
                employeeId: empId || null,
                department: department || "General",
                entity: entityCode,
                status: "Active",
                type: "Permanent"
            });
        });

        if (errors.length > 0) {
            return res.status(400).json({ error: "Validation failed", details: errors });
        }

        await Employee.bulkCreate(toCreate);
        res.json({ message: `Imported ${toCreate.length} employees.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getEmployeeAssets = async (req, res) => {
    try {
        const entityCode = req.headers["x-entity-code"];
        if (!entityCode || entityCode.toUpperCase() === "ALL") {
            return res.status(400).json({ error: "A specific entity code is required." });
        }
        const Employee = await getEmployeeModel(req);
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) return res.status(404).json({ error: "Employee not found." });

        const tSeq = await TenantManager.getConnection(entityCode);
        const Asset = tSeq.models.Asset || require("../models/Asset").init(tSeq);
        const identifiers = [employee.employeeId, employee.email].filter(Boolean);
        const assets = await Asset.findAll({
            where: {
                employeeId: { [Op.in]: identifiers },
                status: { [Op.in]: ["In Use", "Allocated", "Pending Approval"] }
            }
        });
        res.json({ employee, assets });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.offboardEmployee = async (req, res) => {
    try {
        const entityCode = req.headers["x-entity-code"];
        if (!entityCode || entityCode.toUpperCase() === "ALL") {
            return res.status(400).json({ error: "A specific entity code is required." });
        }
        const Employee = await getEmployeeModel(req);
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) return res.status(404).json({ error: "Employee not found." });

        const { departureReason = "Not specified", lastWorkingDay, notes = "", assetIds = [] } = req.body;

        const tSeq = await TenantManager.getConnection(entityCode);
        const Asset = tSeq.models.Asset || require("../models/Asset").init(tSeq);

        let returnedCount = 0;
        for (const assetId of assetIds) {
            try {
                const asset = await Asset.findByPk(assetId);
                if (!asset) continue;
                await Asset.update(
                    { status: "Available", employeeId: null, department: null, location: null },
                    { where: { id: assetId } }
                );
                returnedCount++;

                // Non-blocking return email
                try {
                    const EmailSettings = require("../models/EmailSettings");
                    const NotificationSettings = require("../models/NotificationSettings");
                    const { sendReturnEmail } = require("../services/emailService");
                    const Entity = require("../models/Entity");
                    const settings = await EmailSettings.findOne();
                    const notifSettings = await NotificationSettings.findOne();
                    const returnEnabled = notifSettings ? notifSettings.assetReturn !== false : true;
                    if (settings?.enabled && returnEnabled && employee.email) {
                        const entityInfo = await Entity.findOne({ where: { code: entityCode } });
                        const backendUrl = settings.backendUrl || `http://${req.hostname}:5000`;
                        const updatedAsset = await Asset.findByPk(assetId);
                        await sendReturnEmail({
                            settings: settings.toJSON(),
                            employee: employee.toJSON(),
                            asset: updatedAsset.toJSON(),
                            entity: entityInfo?.toJSON ? entityInfo.toJSON() : entityInfo,
                            backendUrl,
                            entityCode
                        });
                    }
                } catch (emailErr) {
                    console.error(`[Offboard] Email for asset ${assetId} failed:`, emailErr.message);
                }
            } catch (assetErr) {
                console.error(`[Offboard] Failed to return asset ${assetId}:`, assetErr.message);
            }
        }

        await Employee.update({ status: "Inactive" }, { where: { id: req.params.id } });

        const AuditLog = require("../models/AuditLog");
        const user = req.user?.email || req.user?.name || "System";
        const rawIp = req.headers["x-forwarded-for"] || req.ip || req.connection?.remoteAddress;
        const ip = rawIp ? rawIp.replace(/^::ffff:/, "") : rawIp;
        await AuditLog.create({
            user, action: "Employee offboarded", ip,
            details: `Employee: ${employee.name} (${employee.employeeId || employee.email}) | Reason: ${departureReason} | Assets returned: ${returnedCount}${notes ? ` | Notes: ${notes}` : ""}`
        });

        // Non-blocking offboarding summary email to IT team
        try {
            const EmailSettings = require("../models/EmailSettings");
            const NotificationSettings = require("../models/NotificationSettings");
            const Entity = require("../models/Entity");
            const { sendOffboardingSummaryEmail } = require("../services/emailService");
            const settings = await EmailSettings.findOne();
            const notifSettings = await NotificationSettings.findOne();
            if (settings?.enabled && notifSettings?.employeeOffboarding !== false) {
                const entityInfo = await Entity.findOne({ where: { code: entityCode } });
                const backendUrl = settings.backendUrl || `http://${req.hostname}:5000`;
                // Collect returned asset details for the email
                const returnedAssets = [];
                for (const assetId of assetIds) {
                    try {
                        const a = await Asset.findByPk(assetId, { raw: true });
                        if (a) returnedAssets.push(a);
                    } catch (_) {}
                }
                await sendOffboardingSummaryEmail({
                    settings: settings.toJSON(),
                    employee: employee.toJSON(),
                    returnedAssets,
                    departureReason,
                    lastWorkingDay,
                    entityInfo: entityInfo?.toJSON ? entityInfo.toJSON() : entityInfo,
                    backendUrl,
                    entityCode
                });
            }
        } catch (emailErr) {
            console.error("[Offboard] Summary email failed:", emailErr.message);
        }

        res.json({ message: "Employee offboarded successfully.", returnedCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.exportEmployees = async (req, res) => {
    try {
        const rawEntityCode = req.headers["x-entity-code"];
        const entityCode = rawEntityCode ? String(rawEntityCode).trim() : "";
        console.log(`[EmployeeExport] Processing export for: ${entityCode || "ALL"}`);

        const buildRows = async (sequelize, employeesList) => {
            if (!employeesList || employeesList.length === 0) return [];

            const Asset = sequelize.models.Asset || require("../models/Asset").init(sequelize);
            const Department = sequelize.models.Department || require("../models/Department").init(sequelize);

            const [assets, depts] = await Promise.all([
                Asset.findAll({ raw: true }).catch(err => {
                    console.error(`[EmployeeExport] Asset fetch fail: ${err.message}`);
                    return [];
                }),
                Department.findAll({ raw: true }).catch(err => {
                    console.error(`[EmployeeExport] Dept fetch fail: ${err.message}`);
                    return [];
                })
            ]);

            const deptMap = new Map();
            depts.forEach(d => {
                if (d.name) deptMap.set(String(d.name).toLowerCase(), d.location || "");
            });

            const assetMap = new Map();
            assets.forEach(a => {
                const key = String(a.employeeId || "").toLowerCase();
                if (key) {
                    if (!assetMap.has(key)) assetMap.set(key, []);
                    assetMap.get(key).push(a.assetId || a.name);
                }
            });

            return employeesList.map((emp, index) => {
                const empIdKey = String(emp.employeeId || "").toLowerCase();
                const empEmailKey = String(emp.email || "").toLowerCase();

                let allocated = assetMap.get(empIdKey) || [];
                if (allocated.length === 0 && empEmailKey) {
                    allocated = assetMap.get(empEmailKey) || [];
                }

                return {
                    "S.No.": index + 1,
                    "Employee Name": emp.name || "",
                    "Employee Email ID": emp.email || "",
                    "Employee ID": emp.employeeId || "",
                    "Location": deptMap.get(String(emp.department || "").toLowerCase()) || "",
                    "Department": emp.department || "",
                    "Allocated Asset": allocated.join(", ")
                };
            });
        };

        let allRows = [];
        if (!entityCode || entityCode.toUpperCase() === "ALL") {
            const entities = await Entity.findAll();
            // Sequential processing to avoid connection spikes
            for (const ent of entities) {
                try {
                    const sequelize = await TenantManager.getConnection(ent.code);
                    const Employee = sequelize.models.Employee || require("../models/Employee").init(sequelize);
                    const employees = await Employee.findAll({ raw: true });
                    const rows = await buildRows(sequelize, employees);
                    allRows = [...allRows, ...rows];
                } catch (err) {
                    console.error(`[EmployeeExport] Skipping entity ${ent.code}: ${err.message}`);
                }
            }
        } else {
            const sequelize = await TenantManager.getConnection(entityCode);
            const Employee = sequelize.models.Employee || require("../models/Employee").init(sequelize);
            const employees = await Employee.findAll({ raw: true });
            allRows = await buildRows(sequelize, employees);
        }

        const worksheet = XLSX.utils.json_to_sheet(allRows.length > 0 ? allRows : [
            { "S.No.": "No Data Found", "Employee Name": "", "Employee Email ID": "", "Employee ID": "", "Location": "", "Department": "", "Allocated Asset": "" }
        ]);
        const csv = XLSX.utils.sheet_to_csv(worksheet);

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=employees_export_${new Date().toISOString().slice(0, 10)}.csv`);
        res.send(csv);
    } catch (error) {
        console.error("[EmployeeExport Global Error]", error);
        res.status(500).json({ error: error.message || "Export failed" });
    }
};

