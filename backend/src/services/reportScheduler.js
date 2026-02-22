/**
 * Report Scheduler Service
 * Uses node-cron to fire scheduled reports, generate HTML reports, and email to recipients.
 */
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const { buildCronExpression, computeNextRun } = require("../utils/reportSchedulerUtils");

// Map of scheduleId → node-cron Task
const activeJobs = new Map();

// ── PDF generator (PDFKit) ───────────────────────────────────────────────────

const generatePdf = async (title, columns, rows, entityName, entityLogo, dateStr) => {
    const path = require("path");
    const sharp = require("sharp");

    // ── Resolve logo buffer ──────────────────────────────────────────────────
    // Priority 1: entity-specific base64 logo from DB
    // Priority 2: default ITAM SVG (converted to PNG via sharp)
    let logoBuf = null;
    if (entityLogo) {
        try {
            // Use a broad regex that handles mime types like "svg+xml", "png", "jpeg" etc.
            const mimeMatch = entityLogo.match(/^data:image\/([^;]+);base64,/);
            const mimeType  = mimeMatch ? mimeMatch[1] : null;
            const b64       = entityLogo.replace(/^data:image\/[^;]+;base64,/, "");
            const imgBuf    = Buffer.from(b64, "base64");

            if (mimeType === "svg+xml" || mimeType === "svg") {
                // PDFKit cannot embed SVG — convert to PNG via sharp
                logoBuf = await sharp(imgBuf).resize(240, 96, { fit: "inside" }).png().toBuffer();
            } else {
                // PNG / JPEG can be embedded directly
                logoBuf = imgBuf;
            }
        } catch (_) {}
    }
    if (!logoBuf) {
        try {
            const defaultSvg = path.join(__dirname, "../../../frontend/src/assets/logos/default.svg");
            logoBuf = await sharp(defaultSvg)
                .resize(240, 96, { fit: "inside" })
                .png()
                .toBuffer();
        } catch (_) {}
    }

    // ── Build PDF (stream-based) ─────────────────────────────────────────────
    return new Promise((resolve, reject) => {
        const PDFDocument = require("pdfkit");

        const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0, autoFirstPage: true });
        // Register DejaVu Sans — supports ₹ and full Unicode (unlike built-in Helvetica)
        doc.registerFont("F",  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf");
        doc.registerFont("FB", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf");
        const chunks = [];
        doc.on("data", c => chunks.push(c));
        doc.on("end",  () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // ── Constants ──────────────────────────────────────────────────────
        const MARGIN      = 24;
        const HDR_H       = 80;    // header bar height
        const INFO_H      = 32;    // info strip height
        const COL_HDR_H   = 26;    // table column header height
        const ROW_H       = 20;    // data row height
        const FOOT_H      = 24;    // footer area height
        const pageW       = doc.page.width;
        const pageH       = doc.page.height;
        const tableW      = pageW - MARGIN * 2;

        // Colours
        const C_NAVY      = "#0f2d6e";   // header background
        const C_ACCENT    = "#2563eb";   // accent line below header
        const C_INFO_BG   = "#eef2ff";   // info strip background
        const C_INFO_TXT  = "#1e40af";   // info strip text
        const C_COL_BG    = "#1e3a6e";   // column header background
        const C_COL_TXT   = "#ffffff";   // column header text
        const C_ROW_ALT   = "#f4f7ff";   // alternating row tint
        const C_BORDER    = "#dde3f0";   // cell border
        const C_TXT_DK    = "#1e293b";   // cell text
        const C_TXT_LT    = "#64748b";   // secondary text
        const C_FOOT_LINE = "#cbd5e1";   // footer separator
        const C_FOOT_TXT  = "#94a3b8";   // footer text

        // ── Column widths (proportional) ────────────────────────────────────
        const WEIGHTS = {
            assetId: 0.75, name: 1.35, serialNumber: 1.0,  status: 1.0,
            entity: 0.75,  employeeId: 0.65, employeeName: 1.1, employeeEmail: 1.3,
            department: 0.9, location: 0.8, purchaseDate: 1.1,  price: 0.9,
            product: 1.2, vendor: 1.0, seatsOwned: 0.7,  seatsUsed: 0.7,
            compliance: 0.9, renewalDate: 1.0, cost: 0.9,
            employee: 1.2, email: 1.4, license: 1.2, assignedAt: 1.0,
            category: 0.9
        };
        const totalWt  = columns.reduce((s, c) => s + (WEIGHTS[c.key] || 1.0), 0);
        const colWidths = columns.map(c => ((WEIGHTS[c.key] || 1.0) / totalWt) * tableW);

        // ── Draw page header (navy bar + logo + title + date) ────────────────
        const drawHeader = () => {
            // Navy background
            doc.rect(0, 0, pageW, HDR_H).fill(C_NAVY);

            // Bright accent line at bottom of header
            doc.rect(0, HDR_H - 3, pageW, 3).fill(C_ACCENT);

            // Logo — left side, vertically centred in header
            const LOGO_MAX_W = 130;
            const LOGO_MAX_H = 52;
            const LOGO_Y = (HDR_H - LOGO_MAX_H) / 2 - 2;
            let textStartX = MARGIN;

            if (logoBuf) {
                try {
                    doc.image(logoBuf, MARGIN, LOGO_Y, { fit: [LOGO_MAX_W, LOGO_MAX_H] });
                    textStartX = MARGIN + LOGO_MAX_W + 16;
                } catch (_) {}
            }

            // Report title
            const titleY = 18;
            doc.fillColor("#ffffff")
               .font("FB")
               .fontSize(17)
               .text(title, textStartX, titleY, {
                   width: pageW - textStartX - MARGIN - 180,
                   lineBreak: false
               });

            // Entity + system sub-line
            doc.fillColor("#a5c3ff")
               .font("F")
               .fontSize(9.5)
               .text(`${entityName}  ·  IT Asset Management`, textStartX, titleY + 23, {
                   width: pageW - textStartX - MARGIN - 180,
                   lineBreak: false
               });

            // Date — right side
            doc.fillColor("#ffffff")
               .font("FB")
               .fontSize(11)
               .text(dateStr, MARGIN, titleY, {
                   width: pageW - MARGIN * 2,
                   align: "right",
                   lineBreak: false
               });

            // Record count — right side below date
            doc.fillColor("#a5c3ff")
               .font("F")
               .fontSize(8.5)
               .text(`${rows.length} record${rows.length !== 1 ? "s" : ""}`, MARGIN, titleY + 23, {
                   width: pageW - MARGIN * 2,
                   align: "right",
                   lineBreak: false
               });
        };

        // ── Draw info strip (entity · report type metadata) ──────────────────
        const drawInfoStrip = () => {
            const y = HDR_H;
            doc.rect(0, y, pageW, INFO_H).fill(C_INFO_BG);

            const items = [
                { label: "ENTITY",      value: entityName },
                { label: "REPORT",      value: title },
                { label: "GENERATED",   value: dateStr },
                { label: "RECORDS",     value: String(rows.length) }
            ];

            const itemW = tableW / items.length;
            items.forEach((item, i) => {
                const ix = MARGIN + i * itemW;
                const iy = y + 5;
                doc.fillColor(C_INFO_TXT).font("F").fontSize(7.5)
                   .text(item.label, ix, iy, { width: itemW - 8, lineBreak: false });
                doc.fillColor(C_NAVY).font("FB").fontSize(8.5)
                   .text(item.value, ix, iy + 11, { width: itemW - 8, lineBreak: false, ellipsis: true });
            });

            // Bottom border on info strip
            doc.moveTo(0, y + INFO_H).lineTo(pageW, y + INFO_H)
               .strokeColor(C_BORDER).lineWidth(0.5).stroke();
        };

        // ── Draw column header row ────────────────────────────────────────────
        const drawColHeaders = (y) => {
            // Dark navy background spanning full page width
            doc.rect(0, y, pageW, COL_HDR_H).fill(C_COL_BG);

            let x = MARGIN;
            columns.forEach((col, i) => {
                // Clip to column bounds so header text never overflows into adjacent column
                doc.save().rect(x + 3, y, colWidths[i] - 6, COL_HDR_H).clip();
                doc.fillColor(C_COL_TXT)
                   .font("FB")
                   .fontSize(6.5)
                   .text(col.label.toUpperCase(), x + 5, y + (COL_HDR_H - 7) / 2, { lineBreak: false });
                doc.restore();
                // Vertical divider between columns
                if (i < columns.length - 1) {
                    doc.moveTo(x + colWidths[i], y + 6)
                       .lineTo(x + colWidths[i], y + COL_HDR_H - 6)
                       .strokeColor("rgba(255,255,255,0.18)").lineWidth(0.5).stroke();
                }
                x += colWidths[i];
            });

            return y + COL_HDR_H;
        };

        // ── Draw footer ──────────────────────────────────────────────────────
        const drawFooter = (pageNum, totalPages) => {
            const fy = pageH - FOOT_H;
            doc.rect(0, fy, pageW, FOOT_H).fill("#f8fafc");
            doc.moveTo(0, fy).lineTo(pageW, fy)
               .strokeColor(C_FOOT_LINE).lineWidth(0.5).stroke();

            // Left: entity + report info
            doc.fillColor(C_FOOT_TXT).font("F").fontSize(7.5)
               .text(
                   `${entityName}  ·  ${title}  ·  Generated ${dateStr}`,
                   MARGIN, fy + 7,
                   { width: tableW - 80, lineBreak: false }
               );

            // Right: page number
            doc.fillColor(C_NAVY).font("FB").fontSize(7.5)
               .text(
                   `Page ${pageNum}${totalPages ? ` of ${totalPages}` : ""}`,
                   MARGIN, fy + 7,
                   { width: tableW, align: "right", lineBreak: false }
               );
        };

        // ── Pre-calculate total pages ────────────────────────────────────────
        const usableH    = pageH - HDR_H - INFO_H - COL_HDR_H - FOOT_H - 6;
        const rowsPerPg  = Math.floor(usableH / ROW_H);
        const totalPages = rows.length === 0 ? 1 : Math.ceil(rows.length / rowsPerPg);

        // ── Render pages ─────────────────────────────────────────────────────
        let pageNum = 1;
        drawHeader();
        drawInfoStrip();
        let y = HDR_H + INFO_H + 2;
        y = drawColHeaders(y);
        drawFooter(pageNum, totalPages);

        if (rows.length === 0) {
            doc.fillColor(C_TXT_LT).font("F").fontSize(10)
               .text("No records found for this report.", MARGIN, y + 28, {
                   width: tableW, align: "center"
               });
        } else {
            rows.forEach((row, rowIdx) => {
                // New page check (leave room for footer)
                if (y + ROW_H > pageH - FOOT_H - 4) {
                    doc.addPage();
                    pageNum += 1;
                    drawHeader();
                    drawInfoStrip();
                    y = HDR_H + INFO_H + 2;
                    y = drawColHeaders(y);
                    drawFooter(pageNum, totalPages);
                }

                // Alternating row background
                if (rowIdx % 2 === 1) {
                    doc.rect(MARGIN, y, tableW, ROW_H).fill(C_ROW_ALT);
                }

                // Cell text + vertical dividers
                let x = MARGIN;
                columns.forEach((col, i) => {
                    const val = String(row[col.key] ?? "-");
                    // Clip to cell bounds — prevents text from overflowing/wrapping into adjacent column
                    doc.save().rect(x + 3, y, colWidths[i] - 6, ROW_H).clip();
                    doc.fillColor(C_TXT_DK).font("F").fontSize(7)
                       .text(val, x + 5, y + (ROW_H - 7) / 2, { lineBreak: false });
                    doc.restore();
                    // Vertical divider
                    if (i < columns.length - 1) {
                        doc.moveTo(x + colWidths[i], y + 3)
                           .lineTo(x + colWidths[i], y + ROW_H - 3)
                           .strokeColor(C_BORDER).lineWidth(0.3).stroke();
                    }
                    x += colWidths[i];
                });

                // Horizontal row border
                doc.moveTo(MARGIN, y + ROW_H)
                   .lineTo(MARGIN + tableW, y + ROW_H)
                   .strokeColor(C_BORDER).lineWidth(0.3).stroke();

                y += ROW_H;
            });

            // Closing border at bottom of last row
            doc.rect(MARGIN, HDR_H + INFO_H + 2 + COL_HDR_H, tableW, y - (HDR_H + INFO_H + 2 + COL_HDR_H))
               .stroke(C_BORDER);
        }

        doc.end();
    });
};

// ── Notification email body ──────────────────────────────────────────────────

const toEmailHtml = (title, entityName, dateStr, count, scheduleName) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
    <div style="background:#1a56db;padding:24px 28px;">
      <div style="color:#fff;font-size:18px;font-weight:700;margin:0 0 4px;">${title}</div>
      <div style="color:rgba(255,255,255,0.72);font-size:12px;">${entityName} &middot; IT Asset Management</div>
    </div>
    <div style="padding:24px 28px;">
      <p style="margin:0 0 16px;font-size:14px;color:#374151;">
        Your scheduled report is ready. Please find the <strong>PDF attachment</strong> for the full ${count.toLocaleString()}-record report.
      </p>
      <div style="background:#f1f5f9;border-left:4px solid #1a56db;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:20px;">
        <div style="font-size:12px;color:#64748b;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.05em;">Report Details</div>
        <table style="font-size:13px;color:#1e293b;border-spacing:0;">
          <tr><td style="padding:2px 12px 2px 0;color:#64748b;">Report</td><td style="padding:2px 0;font-weight:600;">${title}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#64748b;">Entity</td><td style="padding:2px 0;font-weight:600;">${entityName}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#64748b;">Generated</td><td style="padding:2px 0;font-weight:600;">${dateStr}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#64748b;">Records</td><td style="padding:2px 0;font-weight:600;">${count.toLocaleString()}</td></tr>
        </table>
      </div>
      <p style="font-size:12px;color:#94a3b8;border-top:1px solid #e5e7eb;padding-top:16px;margin:0;">
        This is an automated report from your ITAM system &middot; Schedule: <strong>${scheduleName}</strong>
      </p>
    </div>
  </div>
</body>
</html>`;

// ── Data fetchers ────────────────────────────────────────────────────────────

const fetchReportData = async (reportType, entityCode) => {
    const TenantManager = require("../utils/TenantManager");
    const Entity = require("../models/Entity");

    // Resolve entity name + logo for the report header
    let entityName = "All Entities";
    let entityLogo = null;
    if (entityCode && entityCode.toUpperCase() !== "ALL") {
        const entityRow = await Entity.findOne({ where: { code: entityCode } }).catch(() => null);
        if (entityRow) {
            entityName = entityRow.name || entityCode;
            entityLogo = entityRow.logo || null;
        } else {
            entityName = entityCode;
        }
    }

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
                        price: aj.price ? "₹" + Number(aj.price).toLocaleString("en-IN") : "-"
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
        return { columns, rows: allAssets, count: allAssets.length, title: "Asset Inventory Report", entityName, entityLogo };
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
                        cost: lj.cost ? "₹" + Number(lj.cost).toLocaleString("en-IN") : "-"
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
        return { columns, rows: allLicenses, count: allLicenses.length, title: "License Compliance Report", entityName, entityLogo };
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
        return { columns, rows: allAssignments, count: allAssignments.length, title: "Assignment & Ownership Report", entityName, entityLogo };
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
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
    const filename = `${reportData.title.replace(/\s+/g, "_")}_${now.toISOString().split("T")[0]}.pdf`;

    // Generate PDF report
    const pdfBuffer = await generatePdf(
        reportData.title,
        reportData.columns,
        reportData.rows,
        reportData.entityName,
        reportData.entityLogo,
        dateStr
    );

    // Notification email body
    const emailHtml = toEmailHtml(
        reportData.title,
        reportData.entityName,
        dateStr,
        reportData.count,
        schedule.name
    );

    await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: recipients.join(", "),
        subject: `[ITAM] ${reportData.title} — ${dateStr} (${reportData.entityName})`,
        html: emailHtml,
        attachments: [{
            filename,
            content: pdfBuffer,
            contentType: "application/pdf"
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
