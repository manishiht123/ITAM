const fs = require("fs");
const path = require("path");

const templatePath = path.join(__dirname, "..", "templates", "consentForm.html");

const safeValue = (value) => (value === undefined || value === null || value === "" ? "-" : String(value));

const buildConsentHtml = (data) => {
    const template = fs.readFileSync(templatePath, "utf8");

    // Build logo img tag — render inline if base64/URL present, otherwise empty placeholder
    const entityLogoHtml = data.entityLogo
        ? `<img src="${data.entityLogo}" alt="${safeValue(data.entityName)}" class="header-logo" />`
        : `<div class="header-logo-placeholder"></div>`;

    return template
        .replace(/{{entityLogoHtml}}/g, entityLogoHtml)
        .replace(/{{entityName}}/g, safeValue(data.entityName))
        .replace(/{{entityAddress}}/g, safeValue(data.entityAddress))
        .replace(/{{employeeName}}/g, safeValue(data.employeeName))
        .replace(/{{employeeEmail}}/g, safeValue(data.employeeEmail))
        .replace(/{{department}}/g, safeValue(data.department))
        .replace(/{{allocationDate}}/g, safeValue(data.allocationDate))
        .replace(/{{assetId}}/g, safeValue(data.assetId))
        .replace(/{{assetName}}/g, safeValue(data.assetName))
        .replace(/{{category}}/g, safeValue(data.category))
        .replace(/{{serialNumber}}/g, safeValue(data.serialNumber))
        .replace(/{{ram}}/g, safeValue(data.ram))
        .replace(/{{storage}}/g, safeValue(data.storage))
        .replace(/{{condition}}/g, safeValue(data.condition));
};

const escapePdfText = (text) => String(text)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const buildPdf = (lines) => {
    const content = [
        "BT",
        "/F1 12 Tf",
        "14 TL",
        "50 760 Td",
        ...lines.map((line, idx) => {
            const prefix = idx === 0 ? "" : "T* ";
            return `${prefix}(${escapePdfText(line)}) Tj`;
        }),
        "ET"
    ].join("\n");

    const objects = [];
    objects.push("<< /Type /Catalog /Pages 2 0 R >>");
    objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
    objects.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>");
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

    const parts = ["%PDF-1.4\n"];
    let offset = parts[0].length;
    const xref = ["0000000000 65535 f \n"];

    objects.forEach((obj, index) => {
        const objHeader = `${index + 1} 0 obj\n`;
        parts.push(objHeader);
        offset += objHeader.length;
        xref.push(String(offset).padStart(10, "0") + " 00000 n \n");
        parts.push(obj + "\nendobj\n");
        offset += (obj + "\nendobj\n").length;
    });

    const xrefStart = parts.join("").length;
    parts.push(`xref\n0 ${objects.length + 1}\n`);
    parts.push(xref.join(""));
    parts.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);

    return Buffer.from(parts.join(""), "binary");
};

const buildConsentPdf = (data) => {
    const lines = [
        data.entityName ? `${safeValue(data.entityName)} - IT Asset Management` : "IT Asset Management",
        "Asset Allocation Consent Form",
        `Generated: ${safeValue(data.allocationDate)}`,
        "",
        "-- EMPLOYEE DETAILS --",
        `Name: ${safeValue(data.employeeName)}`,
        `Email: ${safeValue(data.employeeEmail)}`,
        `Department: ${safeValue(data.department)}`,
        `Allocation Date: ${safeValue(data.allocationDate)}`,
        "",
        "-- ASSET DETAILS --",
        `Asset ID: ${safeValue(data.assetId)}`,
        `Asset Name: ${safeValue(data.assetName)}`,
        `Category: ${safeValue(data.category)}`,
        `Serial Number: ${safeValue(data.serialNumber)}`,
        `RAM: ${safeValue(data.ram)}`,
        `Storage: ${safeValue(data.storage)}`,
        `Condition: ${safeValue(data.condition)}`,
        "",
        "-- TERMS & CONDITIONS --",
        "The asset must be used solely for official business purposes.",
        "Any damage or loss must be reported to IT immediately.",
        "The asset must be returned upon resignation or request.",
        "",
        "Employee Signature: ______________________  Date: ___________",
        "IT Representative:  ______________________  Date: ___________"
    ];

    return buildPdf(lines);
};

module.exports = { buildConsentHtml, buildConsentPdf };
