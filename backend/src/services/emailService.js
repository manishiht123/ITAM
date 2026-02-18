const nodemailer = require("nodemailer");
const { buildConsentHtml, buildConsentPdf } = require("./consentForm");

const safeValue = (value) => (value === undefined || value === null || value === "" ? "-" : String(value));

const resolveHost = (settings) => {
    if (settings.host) return settings.host;
    if (settings.provider === "google") return "smtp.gmail.com";
    if (settings.provider === "microsoft") return "smtp.office365.com";
    return "";
};

const resolvePort = (settings) => {
    if (settings.port) return settings.port;
    return 587;
};

const buildTransporter = (settings) => {
    return nodemailer.createTransport({
        host: resolveHost(settings),
        port: resolvePort(settings),
        secure: Boolean(settings.secure),
        auth: {
            user: settings.smtpUser,
            pass: settings.smtpPass
        }
    });
};

const resolveFrom = (settings) => {
    if (settings.fromEmail) {
        return settings.fromName ? `${settings.fromName} <${settings.fromEmail}>` : settings.fromEmail;
    }
    return settings.fromName ? `${settings.fromName} <${settings.smtpUser}>` : settings.smtpUser;
};

const buildAllocationEmailHtml = (data, consentHtml) => {
    return `
      <div style="font-family: Arial, sans-serif; color: #111827;">
        <h2>Asset Allocation Confirmation</h2>
        <p>Hi ${safeValue(data.employeeName)},</p>
        <p>You have been allocated the following asset:</p>
        <ul>
          <li><strong>Asset ID:</strong> ${safeValue(data.assetId)}</li>
          <li><strong>Asset Name:</strong> ${safeValue(data.assetName)}</li>
          <li><strong>Asset Serial No:</strong> ${safeValue(data.serialNumber)}</li>
          <li><strong>RAM:</strong> ${safeValue(data.ram)}</li>
          <li><strong>Storage:</strong> ${safeValue(data.storage)}</li>
          <li><strong>Condition:</strong> ${safeValue(data.condition)}</li>
        </ul>
        <p>Please review the consent form below.</p>
        <hr />
        ${consentHtml}
      </div>
    `;
};

const buildReturnEmailHtml = (data) => {
    return `
      <div style="font-family: Arial, sans-serif; color: #111827;">
        <h2>Asset Return Notification</h2>
        <p>The following asset has been returned:</p>
        <ul>
          <li><strong>Asset ID:</strong> ${safeValue(data.assetId)}</li>
          <li><strong>Asset Name:</strong> ${safeValue(data.assetName)}</li>
          <li><strong>Asset Serial No:</strong> ${safeValue(data.serialNumber)}</li>
          <li><strong>Returned By:</strong> ${safeValue(data.employeeName)}</li>
          <li><strong>Returned To:</strong> ${safeValue(data.returnToName)} (${safeValue(data.returnToEmail)})</li>
          <li><strong>Return Date:</strong> ${safeValue(data.returnDate)}</li>
        </ul>
      </div>
    `;
};

const sendAllocationEmail = async ({ settings, employee, asset, entity }) => {
    if (!settings || !settings.enabled) return;
    if (!settings.smtpUser || !settings.smtpPass || !employee?.email) return;

    const allocationDate = new Date().toISOString().slice(0, 10);
    const data = {
        employeeName: employee.name,
        employeeEmail: employee.email,
        department: employee.department || "-",
        allocationDate,
        assetId: asset.assetId || asset.id,
        assetName: asset.name,
        category: asset.category || "-",
        serialNumber: asset.serialNumber,
        ram: asset.ram,
        storage: asset.storage,
        condition: asset.condition,
        entityName: entity?.name || "",
        entityLogo: entity?.logo || "",
        entityAddress: entity?.address || ""
    };

    const consentHtml = buildConsentHtml(data);
    const consentPdf = buildConsentPdf(data);

    const transporter = buildTransporter(settings);
    const from = resolveFrom(settings);

    const itRecipients = [settings.notifyEmail, settings.returnToEmail, settings.smtpUser]
        .filter(Boolean)
        .join(", ");
    const toRecipients = [employee.email, itRecipients].filter(Boolean).join(", ");

    await transporter.sendMail({
        from,
        to: toRecipients,
        subject: `Asset Allocation - ${safeValue(asset.assetId || asset.name)}`,
        html: buildAllocationEmailHtml(data, consentHtml),
        attachments: [
            {
                filename: "asset-consent-form.pdf",
                content: consentPdf
            }
        ]
    });
};

const sendReturnEmail = async ({ settings, employee, asset }) => {
    if (!settings || !settings.enabled) return;
    if (!settings.smtpUser || !settings.smtpPass) return;

    const toRecipients = [
        employee?.email,
        settings.notifyEmail,
        settings.returnToEmail,
        settings.smtpUser
    ]
        .filter(Boolean)
        .join(", ");
    if (!toRecipients) return;

    const data = {
        employeeName: employee?.name || "-",
        assetId: asset.assetId || asset.id,
        assetName: asset.name,
        serialNumber: asset.serialNumber,
        returnToName: settings.returnToName || "IT Admin",
        returnToEmail: settings.returnToEmail || settings.smtpUser,
        returnDate: new Date().toISOString().slice(0, 10)
    };

    const transporter = buildTransporter(settings);
    const from = resolveFrom(settings);

    await transporter.sendMail({
        from,
        to: toRecipients,
        subject: `Asset Return - ${safeValue(asset.assetId || asset.name)}`,
        html: buildReturnEmailHtml(data)
    });
};

module.exports = { sendAllocationEmail, sendReturnEmail };
