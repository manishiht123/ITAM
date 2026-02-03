const fs = require("fs");
const path = require("path");

const templatePath = path.join(__dirname, "..", "templates", "consentForm.html");

const safeValue = (value) => (value === undefined || value === null || value === "" ? "-" : String(value));

const buildConsentHtml = (data) => {
    const template = fs.readFileSync(templatePath, "utf8");
    return template
        .replace(/{{employeeName}}/g, safeValue(data.employeeName))
        .replace(/{{employeeEmail}}/g, safeValue(data.employeeEmail))
        .replace(/{{allocationDate}}/g, safeValue(data.allocationDate))
        .replace(/{{assetId}}/g, safeValue(data.assetId))
        .replace(/{{assetName}}/g, safeValue(data.assetName))
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
        "Asset Allocation Consent Form",
        `Employee: ${safeValue(data.employeeName)}`,
        `Email: ${safeValue(data.employeeEmail)}`,
        `Allocation Date: ${safeValue(data.allocationDate)}`,
        "",
        `Asset ID: ${safeValue(data.assetId)}`,
        `Asset Name: ${safeValue(data.assetName)}`,
        `Asset Serial No: ${safeValue(data.serialNumber)}`,
        `RAM: ${safeValue(data.ram)}`,
        `Storage: ${safeValue(data.storage)}`,
        `Condition: ${safeValue(data.condition)}`,
        "",
        "Employee agrees to use the asset responsibly and return it when requested.",
        "Employee Signature: ______________________",
        "IT Representative: ______________________"
    ];

    return buildPdf(lines);
};

module.exports = { buildConsentHtml, buildConsentPdf };
