/**
 * Warranty Alert Scheduler
 * Runs daily at 08:00 — scans all tenant DBs for assets with warranties expiring
 * within the configured threshold and sends an email digest to recipients.
 */
const cron = require("node-cron");

let schedulerStarted = false;

// ── HTML email builder ────────────────────────────────────────────────────────

const urgencyColor = (u) => {
    if (u === "expired")  return "#dc2626";
    if (u === "critical") return "#f97316";
    if (u === "warning")  return "#ca8a04";
    return "#2563eb";
};

const urgencyLabel = (u) => {
    if (u === "expired")  return "EXPIRED";
    if (u === "critical") return "≤ 7 days";
    if (u === "warning")  return "≤ 30 days";
    return "≤ 90 days";
};

const buildEmailHtml = (rows, dateStr, entityName) => {
    const expired  = rows.filter((r) => r.urgency === "expired");
    const critical = rows.filter((r) => r.urgency === "critical");
    const warning  = rows.filter((r) => r.urgency === "warning");
    const soon     = rows.filter((r) => r.urgency === "soon");

    const tableRows = rows
        .slice(0, 100) // cap at 100 rows in email
        .map((r) => {
            const color = urgencyColor(r.urgency);
            const label = urgencyLabel(r.urgency);
            const daysText = r.warrantyExpired
                ? `Expired ${Math.abs(r.daysUntilExpiry)}d ago`
                : `${r.daysUntilExpiry}d remaining`;
            return `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:8px 10px;font-family:monospace;font-size:12px;color:#475569;">${r.assetId || ""}</td>
        <td style="padding:8px 10px;font-size:13px;color:#1e293b;">${r.name || "—"}</td>
        <td style="padding:8px 10px;font-size:12px;color:#64748b;">${r.category || "—"}</td>
        <td style="padding:8px 10px;font-size:12px;color:#475569;">${r.department || "—"}</td>
        <td style="padding:8px 10px;font-size:12px;color:#475569;">${r.warrantyExpireDate || "—"}</td>
        <td style="padding:8px 10px;">
          <span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;background:${color}20;color:${color};">
            ${label}
          </span>
        </td>
        <td style="padding:8px 10px;font-size:12px;color:${color};font-weight:600;">${daysText}</td>
      </tr>`;
        })
        .join("");

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Warranty Alerts</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="700" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:#0f2d6e;padding:28px 32px;">
            <p style="margin:0;font-size:11px;color:#93c5fd;letter-spacing:.08em;text-transform:uppercase;">ITAM System · ${entityName}</p>
            <h1 style="margin:6px 0 0;font-size:22px;color:#fff;">Warranty Expiry Alerts</h1>
            <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe;">Generated ${dateStr}</p>
          </td>
        </tr>

        <!-- Summary pills -->
        <tr>
          <td style="padding:20px 32px;background:#eef2ff;border-bottom:1px solid #c7d2fe;">
            <table cellpadding="0" cellspacing="0"><tr>
              ${expired.length  ? `<td style="padding-right:12px;"><span style="display:inline-block;padding:4px 12px;background:#fee2e2;color:#dc2626;border-radius:20px;font-size:12px;font-weight:700;">⚠ ${expired.length} Expired</span></td>` : ""}
              ${critical.length ? `<td style="padding-right:12px;"><span style="display:inline-block;padding:4px 12px;background:#ffedd5;color:#f97316;border-radius:20px;font-size:12px;font-weight:700;">🔴 ${critical.length} Critical (≤7d)</span></td>` : ""}
              ${warning.length  ? `<td style="padding-right:12px;"><span style="display:inline-block;padding:4px 12px;background:#fef9c3;color:#ca8a04;border-radius:20px;font-size:12px;font-weight:700;">🟡 ${warning.length} Warning (≤30d)</span></td>` : ""}
              ${soon.length     ? `<td><span style="display:inline-block;padding:4px 12px;background:#dbeafe;color:#2563eb;border-radius:20px;font-size:12px;font-weight:700;">🔵 ${soon.length} Soon (≤90d)</span></td>` : ""}
            </tr></table>
          </td>
        </tr>

        <!-- Table -->
        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <thead>
                <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
                  <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.04em;">Asset ID</th>
                  <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.04em;">Name</th>
                  <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.04em;">Category</th>
                  <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.04em;">Department</th>
                  <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.04em;">Expiry Date</th>
                  <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.04em;">Status</th>
                  <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.04em;">Days</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
            ${rows.length > 100 ? `<p style="font-size:12px;color:#94a3b8;margin-top:12px;">Showing top 100 of ${rows.length} assets — export CSV for full list.</p>` : ""}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">This is an automated alert from ITAM System. Update warranty dates in the Assets page to manage alerts.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

// ── Core check function (also exported for manual trigger) ─────────────────────

const runWarrantyCheck = async () => {
    const SystemPreference  = require("../models/SystemPreference");
    const EmailSettings     = require("../models/EmailSettings");
    const Entity            = require("../models/Entity");
    const { fetchWarrantyAssets, buildWarrantyRows } = require("../controllers/assetReportController");
    const nodemailer        = require("nodemailer");

    // Load global prefs
    const prefs = await SystemPreference.findOne();
    if (!prefs || !prefs.warrantyAlertEnabled) {
        console.log("[WarrantyAlert] Alerts disabled — skipping.");
        return;
    }

    // Parse thresholds (e.g. "7,30,60,90" → max threshold = 90)
    const alertDays = (prefs.warrantyAlertDays || "7,30,60,90")
        .split(",")
        .map((d) => parseInt(d.trim(), 10))
        .filter((d) => !isNaN(d) && d > 0);
    const maxDays = Math.max(...alertDays, 0);
    if (maxDays === 0) return;

    // Recipients
    let recipients = [];
    if (prefs.warrantyAlertRecipients) {
        try { recipients = JSON.parse(prefs.warrantyAlertRecipients); } catch {
            recipients = prefs.warrantyAlertRecipients
                .split(",")
                .map((r) => r.trim())
                .filter(Boolean);
        }
    }
    if (!recipients.length) {
        console.log("[WarrantyAlert] No recipients configured — skipping.");
        return;
    }

    // SMTP settings
    const emailSettings = await EmailSettings.findOne();
    if (!emailSettings || !emailSettings.enabled) {
        console.log("[WarrantyAlert] Email not configured — skipping.");
        return;
    }

    // Fetch assets from all entities
    const entities = await Entity.findAll();
    let allAssets = [];
    for (const entity of entities) {
        try {
            const assets = await fetchWarrantyAssets(entity.code);
            allAssets = allAssets.concat(assets.map((a) => ({ ...a, _entityName: entity.name || entity.code })));
        } catch (err) {
            console.error(`[WarrantyAlert] Skipped entity ${entity.code}:`, err.message);
        }
    }

    const rows = buildWarrantyRows(allAssets, maxDays);
    if (rows.length === 0) {
        console.log("[WarrantyAlert] No assets expiring within threshold — no email sent.");
        return;
    }

    // Build and send email
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
    const entityName = entities.length === 1 ? (entities[0].name || entities[0].code) : "All Entities";

    const transporter = nodemailer.createTransport({
        host:   emailSettings.host    || "smtp.gmail.com",
        port:   emailSettings.port    || 587,
        secure: emailSettings.secure  || false,
        auth:   { user: emailSettings.smtpUser, pass: emailSettings.smtpPass }
    });

    const fromName  = emailSettings.fromName  || "ITAM System";
    const fromEmail = emailSettings.fromEmail || emailSettings.smtpUser;

    await transporter.sendMail({
        from:    `"${fromName}" <${fromEmail}>`,
        to:      recipients.join(", "),
        subject: `[ITAM] Warranty Alerts — ${rows.length} asset(s) expiring — ${dateStr}`,
        html:    buildEmailHtml(rows, dateStr, entityName)
    });

    console.log(`[WarrantyAlert] Sent alert for ${rows.length} asset(s) to ${recipients.length} recipient(s).`);
};

// ── Scheduler start ────────────────────────────────────────────────────────────

const startScheduler = async () => {
    if (schedulerStarted) return;
    schedulerStarted = true;

    // Run once on startup
    try { await runWarrantyCheck(); } catch (err) {
        console.error("[WarrantyAlert] Startup check failed:", err.message);
    }

    // Daily at 08:00
    cron.schedule("0 8 * * *", async () => {
        try { await runWarrantyCheck(); } catch (err) {
            console.error("[WarrantyAlert] Daily check failed:", err.message);
        }
    });

    console.log("[WarrantyAlert] Scheduler started (daily at 08:00).");
};

module.exports = { startScheduler, runWarrantyCheck };
