const nodemailer = require("nodemailer");
const sharp = require("sharp");
const { buildConsentHtml, buildConsentPdf } = require("./consentForm");

const safeValue = (v) => (v === undefined || v === null || v === "" ? "-" : String(v));

// Builds the complete logo <td> HTML element for use inside email header tables.
//
// Strategy (in priority order):
//   1. Base64 PNG embedded directly in <img src="data:image/png;base64,...">
//      - SVG logos are rasterised to PNG via sharp first.
//      - Gmail web supports PNG/JPEG base64 data URLs in <img> tags.
//      - No external server required; works for every entity automatically.
//   2. External URL fallback — used only if logo conversion fails and backendUrl
//      is configured (requires server reachable by the email client's image proxy).
//   3. Empty string — no logo panel shown rather than a broken image.
//
// This function is ASYNC because sharp rasterisation is async.
// accentColor is the right-border colour: amber for allocation, green for return.
const resolveLogoBlock = async (logo, entityName, backendUrl, entityCode, accentColor) => {
    const accent = accentColor || "#f59e0b";
    const tdStyle = `background:#ffffff;padding:10px 14px;border-right:4px solid ${accent};vertical-align:middle;width:130px;`;
    const alt = safeValue(entityName);

    // ── 1. Embedded base64 PNG in <img> tag ──────────────────────────────────────
    if (logo && logo.startsWith("data:")) {
        try {
            const mimeMatch = logo.match(/^data:([^;]+);base64,/);
            const b64Match  = logo.match(/^data:[^;]+;base64,(.+)$/s);
            if (mimeMatch && b64Match) {
                let mimeType = mimeMatch[1];
                let imgBuf   = Buffer.from(b64Match[1].trim(), "base64");

                // Convert SVG (and anything non-PNG/JPEG) to PNG so all email
                // clients can render it. Gmail blocks SVG data URLs for security.
                if (mimeType !== "image/png" && mimeType !== "image/jpeg") {
                    imgBuf   = await sharp(imgBuf).png().toBuffer();
                    mimeType = "image/png";
                }

                const b64Out = imgBuf.toString("base64");
                console.log(`[Email] Logo embedded as base64 ${mimeType} (${Math.round(b64Out.length * 0.75 / 1024)}KB)`);
                return `<td style="${tdStyle}">
                  <img src="data:${mimeType};base64,${b64Out}" alt="${alt}"
                       width="108" height="60"
                       style="display:block;max-width:108px;height:60px;object-fit:contain;" />
                </td>`;
            }
        } catch (err) {
            console.error("[Email] Logo base64 embedding failed:", err.message);
        }
    }

    // ── 2. External URL (requires backend to be publicly accessible) ─────────────
    if (backendUrl && entityCode) {
        const src = `${backendUrl}/api/entities/${entityCode}/logo-image`;
        console.log(`[Email] Logo falling back to URL: ${src}`);
        return `<td style="${tdStyle}">
          <img src="${src}" alt="${alt}" style="height:56px;max-width:108px;object-fit:contain;display:block;" />
        </td>`;
    }

    // ── 3. No logo ───────────────────────────────────────────────────────────────
    console.warn("[Email] No logo available — header will render without logo.");
    return "";
};

const resolveHost = (settings) => {
    if (settings.host) return settings.host;
    if (settings.provider === "google") return "smtp.gmail.com";
    if (settings.provider === "microsoft") return "smtp.office365.com";
    return "";
};

const resolvePort = (settings) => settings.port || 587;

const buildTransporter = (settings) =>
    nodemailer.createTransport({
        host: resolveHost(settings),
        port: resolvePort(settings),
        secure: Boolean(settings.secure),
        auth: { user: settings.smtpUser, pass: settings.smtpPass }
    });

const resolveFrom = (settings) => {
    if (settings.fromEmail) {
        return settings.fromName ? `${settings.fromName} <${settings.fromEmail}>` : settings.fromEmail;
    }
    return settings.fromName ? `${settings.fromName} <${settings.smtpUser}>` : settings.smtpUser;
};

// ─── Allocation Email ─────────────────────────────────────────────────────────
const buildAllocationEmailHtml = (data, logoBlock) => {

    const row = (label, value) => `
      <tr>
        <td style="padding:9px 16px;font-size:11px;font-weight:600;text-transform:uppercase;
                   letter-spacing:0.5px;color:#64748b;background:#f8fafc;
                   width:150px;border-bottom:1px solid #f1f5f9;">${label}</td>
        <td style="padding:9px 16px;font-size:13px;color:#1e293b;
                   border-bottom:1px solid #f1f5f9;">${safeValue(value)}</td>
      </tr>`;

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Asset Allocation</title></head>
<body style="margin:0;padding:28px 0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
       style="max-width:600px;background:#ffffff;border-radius:10px;
              overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.10);">

  <!-- ── HEADER ── -->
  <tr>
    <td style="background:#0f3460;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          ${logoBlock}
          <td style="padding:20px 22px;vertical-align:middle;">
            <div style="font-size:9px;font-weight:600;text-transform:uppercase;
                        letter-spacing:2px;color:#93c5fd;margin-bottom:5px;">
              ${safeValue(data.entityName)}
            </div>
            <div style="font-size:19px;font-weight:700;color:#ffffff;margin-bottom:3px;">
              Asset Allocation Confirmation
            </div>
            <div style="font-size:11px;color:#bfdbfe;">${safeValue(data.allocationDate)}</div>
          </td>
          <td style="padding:0 20px;vertical-align:middle;text-align:right;white-space:nowrap;">
            <span style="display:inline-block;background:#f59e0b;color:#1e293b;
                         font-size:9px;font-weight:800;letter-spacing:1.5px;
                         text-transform:uppercase;padding:6px 14px;border-radius:4px;">
              Confirmed
            </span>
          </td>
        </tr>
      </table>
      <!-- Amber accent bar -->
      <div style="height:3px;background:#f59e0b;"></div>
    </td>
  </tr>

  <!-- ── GREETING ── -->
  <tr>
    <td style="padding:28px 32px 0;">
      <p style="font-size:15px;color:#1e293b;margin:0 0 6px;">
        Hi <strong>${safeValue(data.employeeName)}</strong>,
      </p>
      <p style="font-size:13px;color:#475569;margin:0 0 24px;line-height:1.7;">
        A company asset has been allocated to you as of <strong>${safeValue(data.allocationDate)}</strong>.
        Please review the details below and sign the <strong>Consent Form</strong> attached to this email.
      </p>
    </td>
  </tr>

  <!-- ── ASSET DETAILS CARD ── -->
  <tr>
    <td style="padding:0 32px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <tr>
          <td colspan="2" style="background:#0f3460;padding:10px 16px;">
            <span style="font-size:10px;font-weight:700;text-transform:uppercase;
                         letter-spacing:1.5px;color:#ffffff;">Asset Details</span>
          </td>
        </tr>
        ${row("Asset ID",     data.assetId)}
        ${row("Asset Name",   data.assetName)}
        ${row("Serial No.",   data.serialNumber)}
        ${row("RAM",          data.ram)}
        ${row("Storage",      data.storage)}
        <tr>
          <td style="padding:9px 16px;font-size:11px;font-weight:600;text-transform:uppercase;
                     letter-spacing:0.5px;color:#64748b;background:#f8fafc;width:150px;">Condition</td>
          <td style="padding:9px 16px;font-size:13px;color:#1e293b;">${safeValue(data.condition)}</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── ACTION NOTICE ── -->
  <tr>
    <td style="padding:0 32px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#eff6ff;border-left:4px solid #1a56db;border-radius:0 6px 6px 0;">
        <tr>
          <td style="padding:12px 16px;">
            <p style="font-size:12.5px;color:#1d4ed8;margin:0;line-height:1.6;">
              &#128206; The <strong>Consent Form PDF</strong> is attached to this email.
              Please print, sign, and return a copy to the IT Administration team.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── FOOTER ── -->
  <tr>
    <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
      <p style="font-size:11px;color:#64748b;margin:0 0 4px;font-weight:600;">
        ${safeValue(data.entityName)}  ·  IT Asset Management
      </p>
      <p style="font-size:10px;color:#94a3b8;margin:0;">
        This is an automated notification. Please do not reply to this email.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>

</body>
</html>`;
};

// ─── Return Email ─────────────────────────────────────────────────────────────
const buildReturnEmailHtml = (data, logoBlock) => {

    const row = (label, value) => `
      <tr>
        <td style="padding:9px 16px;font-size:11px;font-weight:600;text-transform:uppercase;
                   letter-spacing:0.5px;color:#64748b;background:#f8fafc;
                   width:150px;border-bottom:1px solid #f1f5f9;">${label}</td>
        <td style="padding:9px 16px;font-size:13px;color:#1e293b;
                   border-bottom:1px solid #f1f5f9;">${safeValue(value)}</td>
      </tr>`;

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Asset Return</title></head>
<body style="margin:0;padding:28px 0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
       style="max-width:600px;background:#ffffff;border-radius:10px;
              overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.10);">

  <!-- ── HEADER ── -->
  <tr>
    <td style="background:#0f3460;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          ${logoBlock}
          <td style="padding:20px 22px;vertical-align:middle;">
            <div style="font-size:9px;font-weight:600;text-transform:uppercase;
                        letter-spacing:2px;color:#93c5fd;margin-bottom:5px;">
              ${safeValue(data.entityName || "IT Asset Management")}
            </div>
            <div style="font-size:19px;font-weight:700;color:#ffffff;margin-bottom:3px;">
              Asset Return Notification
            </div>
            <div style="font-size:11px;color:#bfdbfe;">${safeValue(data.returnDate)}</div>
          </td>
          <td style="padding:0 20px;vertical-align:middle;text-align:right;white-space:nowrap;">
            <span style="display:inline-block;background:#10b981;color:#ffffff;
                         font-size:9px;font-weight:800;letter-spacing:1.5px;
                         text-transform:uppercase;padding:6px 14px;border-radius:4px;">
              Returned
            </span>
          </td>
        </tr>
      </table>
      <!-- Green accent bar -->
      <div style="height:3px;background:#10b981;"></div>
    </td>
  </tr>

  <!-- ── BODY ── -->
  <tr>
    <td style="padding:28px 32px 0;">
      <p style="font-size:14px;color:#1e293b;margin:0 0 6px;font-weight:600;">
        Asset Return Recorded
      </p>
      <p style="font-size:13px;color:#475569;margin:0 0 24px;line-height:1.7;">
        The following asset has been successfully returned to IT Administration
        on <strong>${safeValue(data.returnDate)}</strong>.
      </p>
    </td>
  </tr>

  <!-- ── RETURN DETAILS CARD ── -->
  <tr>
    <td style="padding:0 32px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <tr>
          <td colspan="2" style="background:#0f3460;padding:10px 16px;">
            <span style="font-size:10px;font-weight:700;text-transform:uppercase;
                         letter-spacing:1.5px;color:#ffffff;">Return Details</span>
          </td>
        </tr>
        ${row("Asset ID",    data.assetId)}
        ${row("Asset Name",  data.assetName)}
        ${row("Serial No.",  data.serialNumber)}
        ${row("Returned By", data.employeeName)}
        ${row("Returned To", `${safeValue(data.returnToName)} (${safeValue(data.returnToEmail)})`)}
        <tr>
          <td style="padding:9px 16px;font-size:11px;font-weight:600;text-transform:uppercase;
                     letter-spacing:0.5px;color:#64748b;background:#f8fafc;width:150px;">Return Date</td>
          <td style="padding:9px 16px;font-size:13px;color:#1e293b;">${safeValue(data.returnDate)}</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── STATUS NOTICE ── -->
  <tr>
    <td style="padding:0 32px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#f0fdf4;border-left:4px solid #10b981;border-radius:0 6px 6px 0;">
        <tr>
          <td style="padding:12px 16px;">
            <p style="font-size:12.5px;color:#065f46;margin:0;line-height:1.6;">
              &#9989; Asset has been marked as <strong>Available</strong>
              in the IT Asset Management system.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── FOOTER ── -->
  <tr>
    <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
      <p style="font-size:11px;color:#64748b;margin:0 0 4px;font-weight:600;">
        ${safeValue(data.entityName || "IT Asset Management")}  ·  IT Asset Management
      </p>
      <p style="font-size:10px;color:#94a3b8;margin:0;">
        This is an automated notification. Please do not reply to this email.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>

</body>
</html>`;
};

// ─── Send Functions ───────────────────────────────────────────────────────────
const sendAllocationEmail = async ({ settings, employee, asset, entity, backendUrl, entityCode }) => {
    if (!settings || !settings.enabled) return;
    if (!settings.smtpUser || !settings.smtpPass || !employee?.email) return;

    const allocationDate = new Date().toISOString().slice(0, 10);
    const emp = (employee && typeof employee.toJSON === "function") ? employee.toJSON() : (employee || {});
    const ast = (asset && typeof asset.toJSON === "function") ? asset.toJSON() : (asset || {});
    const ent = (entity && typeof entity.toJSON === "function") ? entity.toJSON() : (entity || {});

    const data = {
        employeeName:  String(emp.name || "-"),
        employeeEmail: String(emp.email || "-"),
        department:    String(emp.department || "-"),
        allocationDate,
        assetId:       String(ast.assetId || ast.id || "-"),
        assetName:     String(ast.name || "-"),
        category:      String(ast.category || "-"),
        serialNumber:  String(ast.serialNumber || "-"),
        ram:           String(ast.ram || "-"),
        storage:       String(ast.storage || "-"),
        condition:     String(ast.condition || "-"),
        entityName:    String(ent.name || "IT Asset Management"),
        entityLogo:    String(ent.logo || ""),
        entityAddress: String(ent.address || "")
    };

    const consentPdf = await buildConsentPdf(data);

    const logoBlock = await resolveLogoBlock(data.entityLogo, data.entityName, backendUrl, entityCode, "#f59e0b");
    const transporter = buildTransporter(settings);
    const from = resolveFrom(settings);

    const itRecipients = [settings.notifyEmail, settings.returnToEmail, settings.smtpUser]
        .filter(Boolean)
        .join(", ");
    const toRecipients = [employee.email, itRecipients].filter(Boolean).join(", ");

    await transporter.sendMail({
        from,
        to: toRecipients,
        subject: `Asset Allocation — ${safeValue(asset.assetId || asset.name)}`,
        html: buildAllocationEmailHtml(data, logoBlock),
        attachments: [{ filename: "asset-consent-form.pdf", content: consentPdf }]
    });
};

const sendReturnEmail = async ({ settings, employee, asset, entity, backendUrl, entityCode }) => {
    if (!settings || !settings.enabled) return;
    if (!settings.smtpUser || !settings.smtpPass) return;

    const toRecipients = [
        employee?.email,
        settings.notifyEmail,
        settings.returnToEmail,
        settings.smtpUser
    ].filter(Boolean).join(", ");
    if (!toRecipients) return;

    const ent = (entity && typeof entity.toJSON === "function") ? entity.toJSON() : (entity || {});

    const data = {
        employeeName:  employee?.name || "-",
        assetId:       asset.assetId || asset.id,
        assetName:     asset.name,
        serialNumber:  asset.serialNumber,
        returnToName:  settings.returnToName || "IT Admin",
        returnToEmail: settings.returnToEmail || settings.smtpUser,
        returnDate:    new Date().toISOString().slice(0, 10),
        entityName:    String(ent.name || "IT Asset Management"),
        entityLogo:    String(ent.logo || "")
    };

    const logoBlock = await resolveLogoBlock(data.entityLogo, data.entityName, backendUrl, entityCode, "#10b981");
    const transporter = buildTransporter(settings);
    const from = resolveFrom(settings);

    await transporter.sendMail({
        from,
        to: toRecipients,
        subject: `Asset Return — ${safeValue(asset.assetId || asset.name)}`,
        html: buildReturnEmailHtml(data, logoBlock)
    });
};

// ─── Shared helpers for new templates ─────────────────────────────────────────
const buildTransporterAndFrom = (settings) => ({
    transporter: buildTransporter(settings),
    from: resolveFrom(settings)
});

const simpleRow = (label, value, color) =>
    `<tr>
      <td style="padding:9px 16px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#64748b;background:#f8fafc;width:160px;border-bottom:1px solid #f1f5f9;">${label}</td>
      <td style="padding:9px 16px;font-size:13px;color:${color || "#1e293b"};border-bottom:1px solid #f1f5f9;">${safeValue(value)}</td>
    </tr>`;

const buildEmailShell = (logoBlock, entityName, title, badgeText, accentColor, bodyHtml) => `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:28px 0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
       style="max-width:600px;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.10);">
  <tr><td style="background:#0f3460;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      ${logoBlock}
      <td style="padding:20px 22px;vertical-align:middle;">
        <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#93c5fd;margin-bottom:5px;">${safeValue(entityName)}</div>
        <div style="font-size:18px;font-weight:700;color:#fff;margin-bottom:3px;">${title}</div>
        <div style="font-size:11px;color:#bfdbfe;">${new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"})}</div>
      </td>
      <td style="padding:0 20px;vertical-align:middle;text-align:right;white-space:nowrap;">
        <span style="display:inline-block;background:${accentColor};color:#fff;font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;padding:6px 14px;border-radius:4px;">${badgeText}</span>
      </td>
    </tr></table>
    <div style="height:3px;background:${accentColor};"></div>
  </td></tr>
  <tr><td style="padding:24px 32px 0;">${bodyHtml}</td></tr>
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
    <p style="font-size:11px;color:#64748b;margin:0 0 4px;font-weight:600;">${safeValue(entityName || "IT Asset Management")} · IT Asset Management</p>
    <p style="font-size:10px;color:#94a3b8;margin:0;">This is an automated notification. Please do not reply.</p>
  </td></tr>
</table></td></tr></table></body></html>`;

const detailsCard = (title, rows) => `
  <table width="100%" cellpadding="0" cellspacing="0"
         style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
    <tr><td colspan="2" style="background:#0f3460;padding:10px 16px;">
      <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#fff;">${title}</span>
    </td></tr>
    ${rows}
  </table>`;

// ─── Approval Request Email (notify IT team when request is submitted) ─────────
const sendApprovalRequestEmail = async ({ settings, approval, entityInfo, backendUrl, entityCode }) => {
    if (!settings?.enabled || !settings?.smtpUser || !settings?.smtpPass) return;
    const to = [settings.notifyEmail, settings.smtpUser].filter(Boolean).join(", ");
    if (!to) return;

    const type = approval.requestType === "transfer" ? "Transfer" : "Disposal";
    const accentColor = approval.requestType === "transfer" ? "#7c3aed" : "#dc2626";
    const logoBlock = await resolveLogoBlock(entityInfo?.logo || "", entityInfo?.name || "", backendUrl, entityCode, accentColor);
    const { transporter, from } = buildTransporterAndFrom(settings);

    const body = `
      <p style="font-size:13px;color:#475569;margin:0 0 20px;line-height:1.7;">
        A new <strong>${type} approval request</strong> has been submitted and requires your review.
      </p>
      ${detailsCard("Request Details",
        simpleRow("Asset ID", approval.assetId) +
        simpleRow("Asset Name", approval.assetName) +
        simpleRow("Request Type", type) +
        simpleRow("Requested By", approval.requestedBy) +
        simpleRow("Entity", approval.entityCode)
      )}
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#eff6ff;border-left:4px solid #1a56db;border-radius:0 6px 6px 0;margin-bottom:24px;">
        <tr><td style="padding:12px 16px;font-size:12.5px;color:#1d4ed8;line-height:1.6;">
          &#128203; Log in to the ITAM system and review this request under <strong>Approvals</strong>.
        </td></tr>
      </table>`;

    await transporter.sendMail({
        from, to,
        subject: `[ITAM] ${type} Request Pending Approval — ${safeValue(approval.assetId)}`,
        html: buildEmailShell(logoBlock, entityInfo?.name, `New ${type} Request — Approval Required`, "Pending", accentColor, body)
    });
};

// ─── Approval Decision Email (notify requestor of approve / reject) ────────────
const sendApprovalDecisionEmail = async ({ settings, approval, entityInfo, backendUrl, entityCode }) => {
    if (!settings?.enabled || !settings?.smtpUser || !settings?.smtpPass) return;
    if (!approval.requestedByEmail) return;

    const approved = approval.status === "Approved";
    const accentColor = approved ? "#10b981" : "#ef4444";
    const badge = approved ? "Approved" : "Rejected";
    const type = approval.requestType === "transfer" ? "Transfer" : "Disposal";
    const logoBlock = await resolveLogoBlock(entityInfo?.logo || "", entityInfo?.name || "", backendUrl, entityCode, accentColor);
    const { transporter, from } = buildTransporterAndFrom(settings);

    const lastRow = approval.reviewComments
        ? `<tr><td style="padding:9px 16px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#64748b;background:#f8fafc;">Comments</td><td style="padding:9px 16px;font-size:13px;color:#1e293b;">${safeValue(approval.reviewComments)}</td></tr>`
        : "";

    const body = `
      <p style="font-size:14px;color:#1e293b;margin:0 0 4px;">Hi <strong>${safeValue(approval.requestedBy)}</strong>,</p>
      <p style="font-size:13px;color:#475569;margin:0 0 20px;line-height:1.7;">
        Your <strong>${type}</strong> request for asset <strong>${safeValue(approval.assetId)}</strong>
        has been <strong style="color:${accentColor};">${badge.toLowerCase()}</strong>
        by <strong>${safeValue(approval.reviewedBy)}</strong>.
      </p>
      ${detailsCard("Decision Details",
        simpleRow("Asset", `${approval.assetId} — ${approval.assetName}`) +
        `<tr><td style="padding:9px 16px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#64748b;background:#f8fafc;border-bottom:1px solid #f1f5f9;">Decision</td>
         <td style="padding:9px 16px;font-size:13px;font-weight:700;color:${accentColor};border-bottom:1px solid #f1f5f9;">${badge}</td></tr>` +
        simpleRow("Reviewed By", approval.reviewedBy) +
        lastRow
      )}`;

    await transporter.sendMail({
        from,
        to: approval.requestedByEmail,
        subject: `[ITAM] ${type} Request ${badge} — ${safeValue(approval.assetId)}`,
        html: buildEmailShell(logoBlock, entityInfo?.name, `${type} Request ${badge}`, badge, accentColor, body)
    });
};

// ─── Asset Status Change Email (notify IT team of theft / repair / etc.) ───────
const sendStatusChangeEmail = async ({ settings, asset, newStatus, changedBy, entityInfo, backendUrl, entityCode }) => {
    if (!settings?.enabled || !settings?.smtpUser || !settings?.smtpPass) return;
    const to = [settings.notifyEmail, settings.smtpUser].filter(Boolean).join(", ");
    if (!to) return;

    const isAlert = ["Theft/Missing", "Not Submitted"].includes(newStatus);
    const accentColor = isAlert ? "#dc2626" : "#f59e0b";
    const logoBlock = await resolveLogoBlock(entityInfo?.logo || "", entityInfo?.name || "", backendUrl, entityCode, accentColor);
    const { transporter, from } = buildTransporterAndFrom(settings);

    const body = `
      <p style="font-size:13px;color:#475569;margin:0 0 20px;line-height:1.7;">
        ${isAlert ? "&#9888;&#65039; An asset has been flagged with a critical status update." : "An asset status has been updated."}
      </p>
      ${detailsCard("Asset Details",
        simpleRow("Asset ID", asset.assetId) +
        simpleRow("Asset Name", asset.name) +
        `<tr><td style="padding:9px 16px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#64748b;background:#f8fafc;border-bottom:1px solid #f1f5f9;">New Status</td>
         <td style="padding:9px 16px;font-size:13px;font-weight:700;color:${accentColor};border-bottom:1px solid #f1f5f9;">${safeValue(newStatus)}</td></tr>` +
        simpleRow("Changed By", changedBy) +
        simpleRow("Serial No.", asset.serialNumber)
      )}`;

    await transporter.sendMail({
        from, to,
        subject: `[ITAM] Asset Status: ${safeValue(newStatus)} — ${safeValue(asset.assetId)}`,
        html: buildEmailShell(logoBlock, entityInfo?.name, `Asset Status Change${isAlert ? " — Alert" : ""}`, safeValue(newStatus), accentColor, body)
    });
};

// ─── Employee Offboarding Summary Email (to IT team) ──────────────────────────
const sendOffboardingSummaryEmail = async ({ settings, employee, returnedAssets, departureReason, lastWorkingDay, entityInfo, backendUrl, entityCode }) => {
    if (!settings?.enabled || !settings?.smtpUser || !settings?.smtpPass) return;
    const to = [settings.notifyEmail, settings.returnToEmail, settings.smtpUser].filter(Boolean).join(", ");
    if (!to) return;

    const logoBlock = await resolveLogoBlock(entityInfo?.logo || "", entityInfo?.name || "", backendUrl, entityCode, "#f59e0b");
    const { transporter, from } = buildTransporterAndFrom(settings);

    const assetRows = (returnedAssets || []).map(a =>
        `<tr>
          <td style="padding:8px 14px;font-size:12px;color:#1e293b;border-bottom:1px solid #f1f5f9;">${safeValue(a.assetId)}</td>
          <td style="padding:8px 14px;font-size:12px;color:#1e293b;border-bottom:1px solid #f1f5f9;">${safeValue(a.name)}</td>
          <td style="padding:8px 14px;font-size:12px;color:#1e293b;border-bottom:1px solid #f1f5f9;">${safeValue(a.category)}</td>
        </tr>`
    ).join("");

    const assetsTable = returnedAssets?.length ? `
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
        <tr><td colspan="3" style="background:#0f3460;padding:10px 16px;">
          <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#fff;">
            Assets Returned to Inventory (${returnedAssets.length})
          </span>
        </td></tr>
        <tr>
          <th style="padding:8px 14px;font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;background:#f8fafc;text-align:left;border-bottom:1px solid #e2e8f0;">Asset ID</th>
          <th style="padding:8px 14px;font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;background:#f8fafc;text-align:left;border-bottom:1px solid #e2e8f0;">Name</th>
          <th style="padding:8px 14px;font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;background:#f8fafc;text-align:left;border-bottom:1px solid #e2e8f0;">Category</th>
        </tr>
        ${assetRows}
      </table>` : `<p style="font-size:13px;color:#475569;margin-bottom:20px;">No assets were returned (employee had no assigned assets).</p>`;

    const body = `
      ${detailsCard("Employee Details",
        simpleRow("Name", employee.name) +
        simpleRow("Employee ID", employee.employeeId) +
        simpleRow("Department", employee.department) +
        simpleRow("Reason", departureReason) +
        simpleRow("Last Working Day", lastWorkingDay)
      )}
      ${assetsTable}`;

    await transporter.sendMail({
        from, to,
        subject: `[ITAM] Offboarding Complete — ${safeValue(employee.name)}`,
        html: buildEmailShell(logoBlock, entityInfo?.name, "Employee Offboarding Complete", "Offboarded", "#f59e0b", body)
    });
};

module.exports = {
    sendAllocationEmail,
    sendReturnEmail,
    sendApprovalRequestEmail,
    sendApprovalDecisionEmail,
    sendStatusChangeEmail,
    sendOffboardingSummaryEmail
};
