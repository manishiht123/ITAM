/**
 * Report Scheduler Service
 * Uses node-cron to fire scheduled reports, generate CSV data, and email to recipients.
 */
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const { buildCronExpression, computeNextRun } = require("../utils/reportSchedulerUtils");

// Map of scheduleId → node-cron Task
const activeJobs = new Map();

// ── CSV builder ─────────────────────────────────────────────────────────────

const toCsv = (columns, rows) => {
    const header = columns.map(c => `"${c.label}"`).join(",");
    const body = rows.map(r =>
        columns.map(c => `"${String(r[c.key] ?? "").replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    return `${header}\n${body}`;
};

// ── Data fetchers ────────────────────────────────────────────────────────────

const fetchReportData = async (reportType, entityCode) => {
    const TenantManager = require("../utils/TenantManager");
    const Entity = require("../models/Entity");
    const { Op } = require("sequelize");

    const getEntitiesForCode = async (code) => {
        if (!code || code.toUpperCase() === "ALL") {
            const all = await Entity.findAll();
            return all.map(e => e.code).filter(Boolean);
        }
        return [code];
    };

    if (reportType === "assets") {
        const codes = await getEntitiesForCode(entityCode);
        const allAssets = [];
        for (const code of codes) {
            try {
                const seq = await TenantManager.getConnection(code);
                const Asset = seq.models.Asset || require("../models/Asset").init(seq);
                const Employee = seq.models.Employee || require("../models/Employee").init(seq);
                const [assets, employees] = await Promise.all([
                    Asset.findAll(),
                    Employee.findAll({ attributes: ["employeeId", "name", "email", "department"] }).catch(() => [])
                ]);
                const empMap = {};
                employees.forEach(e => { if (e.employeeId) empMap[e.employeeId.toLowerCase()] = e.toJSON(); });

                assets.forEach(a => {
                    const aj = a.toJSON();
                    const emp = aj.employeeId ? empMap[aj.employeeId.toLowerCase()] : null;
                    allAssets.push({
                        assetId: aj.assetId || aj.id,
                        name: aj.name || "-",
                        category: aj.category || "-",
                        serialNumber: aj.serialNumber || "-",
                        status: aj.status || "-",
                        entity: code,
                        employeeId: aj.employeeId || "-",
                        employeeName: emp?.name || "-",
                        employeeEmail: emp?.email || "-",
                        department: emp?.department || aj.department || "-",
                        location: aj.location || "-",
                        purchaseDate: aj.dateOfPurchase || "-",
                        price: aj.price || "-"
                    });
                });
            } catch (err) {
                console.error(`[Scheduler] Failed to fetch assets for ${code}:`, err.message);
            }
        }
        const columns = [
            { key: "assetId", label: "Asset ID" },
            { key: "name", label: "Asset Name" },
            { key: "category", label: "Category" },
            { key: "serialNumber", label: "Serial Number" },
            { key: "status", label: "Status" },
            { key: "entity", label: "Entity" },
            { key: "employeeId", label: "Employee ID" },
            { key: "employeeName", label: "Employee Name" },
            { key: "employeeEmail", label: "Employee Email" },
            { key: "department", label: "Department" },
            { key: "location", label: "Location" },
            { key: "purchaseDate", label: "Purchase Date" },
            { key: "price", label: "Price" }
        ];
        return { csv: toCsv(columns, allAssets), count: allAssets.length, title: "Asset Inventory Report" };
    }

    if (reportType === "licenses") {
        const codes = await getEntitiesForCode(entityCode);
        const allLicenses = [];
        for (const code of codes) {
            try {
                const seq = await TenantManager.getConnection(code);
                const SoftwareLicense = seq.models.SoftwareLicense || require("../models/SoftwareLicense").init(seq);
                const licenses = await SoftwareLicense.findAll();
                licenses.forEach(l => {
                    const lj = l.toJSON();
                    const owned = Number(lj.seatsOwned || 0);
                    const used = Number(lj.seatsUsed || 0);
                    let compliance = "Good";
                    if (owned > 0 && used > owned) compliance = "Critical";
                    else if (owned > 0 && used / owned >= 0.9) compliance = "Watch";
                    allLicenses.push({
                        product: lj.product || "-",
                        vendor: lj.vendor || "-",
                        entity: code,
                        seatsOwned: owned,
                        seatsUsed: used,
                        compliance,
                        renewalDate: lj.renewalDate || "-",
                        cost: lj.cost || "-"
                    });
                });
            } catch (err) {
                console.error(`[Scheduler] Failed to fetch licenses for ${code}:`, err.message);
            }
        }
        const columns = [
            { key: "product", label: "Product" },
            { key: "vendor", label: "Vendor" },
            { key: "entity", label: "Entity" },
            { key: "seatsOwned", label: "Seats Owned" },
            { key: "seatsUsed", label: "Seats Used" },
            { key: "compliance", label: "Compliance" },
            { key: "renewalDate", label: "Renewal Date" },
            { key: "cost", label: "Cost" }
        ];
        return { csv: toCsv(columns, allLicenses), count: allLicenses.length, title: "License Compliance Report" };
    }

    if (reportType === "assignments") {
        const codes = await getEntitiesForCode(entityCode);
        const allAssignments = [];
        for (const code of codes) {
            try {
                const seq = await TenantManager.getConnection(code);
                const SoftwareAssignment = seq.models.SoftwareAssignment || require("../models/SoftwareAssignment").init(seq);
                const SoftwareLicense = seq.models.SoftwareLicense || require("../models/SoftwareLicense").init(seq);
                const [assignments, licenses] = await Promise.all([
                    SoftwareAssignment.findAll(),
                    SoftwareLicense.findAll()
                ]);
                const licMap = {};
                licenses.forEach(l => { licMap[l.id] = l.toJSON(); });
                assignments.forEach(a => {
                    const aj = a.toJSON();
                    const lic = licMap[aj.softwareLicenseId] || {};
                    allAssignments.push({
                        employee: aj.employeeName || aj.employeeId || "-",
                        email: aj.employeeEmail || "-",
                        license: lic.product || "-",
                        vendor: lic.vendor || "-",
                        entity: code,
                        assignedAt: aj.assignedAt ? new Date(aj.assignedAt).toLocaleDateString() : "-"
                    });
                });
            } catch (err) {
                console.error(`[Scheduler] Failed to fetch assignments for ${code}:`, err.message);
            }
        }
        const columns = [
            { key: "employee", label: "Employee" },
            { key: "email", label: "Email" },
            { key: "license", label: "License" },
            { key: "vendor", label: "Vendor" },
            { key: "entity", label: "Entity" },
            { key: "assignedAt", label: "Assigned On" }
        ];
        return { csv: toCsv(columns, allAssignments), count: allAssignments.length, title: "Assignment & Ownership Report" };
    }

    throw new Error(`Unknown report type: ${reportType}`);
};

// ── Email sender ─────────────────────────────────────────────────────────────

const sendReportEmail = async (schedule, reportData) => {
    const EmailSettings = require("../models/EmailSettings");
    const settings = await EmailSettings.findOne();

    if (!settings || !settings.enabled) throw new Error("Email notifications are disabled or not configured.");
    if (!settings.smtpUser || !settings.smtpPass) throw new Error("SMTP credentials are not configured.");

    const recipients = (() => {
        try { return JSON.parse(schedule.recipients || "[]"); } catch { return []; }
    })();
    if (!recipients.length) throw new Error("No recipients configured for this schedule.");

    const transporter = nodemailer.createTransport({
        host: settings.host || "smtp.gmail.com",
        port: settings.port || 587,
        secure: settings.secure || false,
        auth: { user: settings.smtpUser, pass: settings.smtpPass }
    });

    const fromName = settings.fromName || "ITAM System";
    const fromEmail = settings.fromEmail || settings.smtpUser;
    const entityLabel = schedule.entityCode && schedule.entityCode.toUpperCase() !== "ALL"
        ? schedule.entityCode.toUpperCase()
        : "All Entities";
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
    const filename = `${reportData.title.replace(/\s+/g, "_")}_${now.toISOString().split("T")[0]}.csv`;

    await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: recipients.join(", "),
        subject: `[ITAM] ${reportData.title} — ${dateStr} (${entityLabel})`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
                <h2 style="color:#1a56db;margin:0 0 8px;">${reportData.title}</h2>
                <p style="color:#6b7280;margin:0 0 20px;">Scheduled report for <strong>${entityLabel}</strong> · Generated on ${dateStr}</p>
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:20px;">
                    <p style="margin:0;font-size:14px;color:#374151;">
                        This report contains <strong>${reportData.count} records</strong>.
                        Please find the CSV attachment for full details.
                    </p>
                </div>
                <p style="font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;margin-top:20px;">
                    This is an automated report generated by your ITAM system.
                    Schedule: <strong>${schedule.name}</strong>
                </p>
            </div>
        `,
        attachments: [{
            filename,
            content: reportData.csv,
            contentType: "text/csv"
        }]
    });
};

// ── Execute a single schedule ────────────────────────────────────────────────

const executeSchedule = async (schedule) => {
    const ReportSchedule = require("../models/ReportSchedule");
    console.log(`[Scheduler] Running schedule #${schedule.id}: "${schedule.name}"`);

    try {
        const reportData = await fetchReportData(schedule.reportType, schedule.entityCode);
        await sendReportEmail(schedule, reportData);

        const nextRun = computeNextRun(schedule);
        await ReportSchedule.update(
            { lastRun: new Date(), lastStatus: "success", lastError: null, nextRun },
            { where: { id: schedule.id } }
        );
        console.log(`[Scheduler] Schedule #${schedule.id} completed — ${reportData.count} records sent.`);
    } catch (err) {
        console.error(`[Scheduler] Schedule #${schedule.id} failed:`, err.message);
        const nextRun = computeNextRun(schedule);
        await ReportSchedule.update(
            { lastRun: new Date(), lastStatus: "failed", lastError: err.message, nextRun },
            { where: { id: schedule.id } }
        ).catch(() => {});
        throw err;
    }
};

// ── Register / unregister individual jobs ────────────────────────────────────

const registerSchedule = (schedule) => {
    // Remove old job if exists
    unregisterSchedule(schedule.id);

    if (!schedule.enabled) {
        console.log(`[Scheduler] Schedule #${schedule.id} is disabled — not registering.`);
        return;
    }

    const expression = buildCronExpression(schedule);
    if (!cron.validate(expression)) {
        console.error(`[Scheduler] Invalid cron expression for schedule #${schedule.id}: "${expression}"`);
        return;
    }

    const task = cron.schedule(expression, () => {
        executeSchedule(schedule).catch(() => {});
    }, { timezone: "Asia/Kolkata" });

    activeJobs.set(schedule.id, task);
    console.log(`[Scheduler] Registered schedule #${schedule.id} "${schedule.name}" → "${expression}"`);
};

const unregisterSchedule = (id) => {
    const existing = activeJobs.get(id);
    if (existing) {
        existing.stop();
        activeJobs.delete(id);
    }
};

// ── Bootstrap: load all schedules from DB and register ───────────────────────

const startScheduler = async () => {
    try {
        const ReportSchedule = require("../models/ReportSchedule");
        const schedules = await ReportSchedule.findAll({ where: { enabled: true } });
        console.log(`[Scheduler] Starting — ${schedules.length} active schedule(s) found.`);
        schedules.forEach(s => registerSchedule(s.toJSON()));
    } catch (err) {
        console.error("[Scheduler] Failed to start:", err.message);
    }
};

module.exports = { startScheduler, registerSchedule, unregisterSchedule, executeSchedule };
