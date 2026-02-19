const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const templatePath = path.join(__dirname, "..", "templates", "consentForm.html");

const safeVal = (v) => (v === undefined || v === null || v === "" ? "-" : String(v));

// ─── HTML template (used for web/email preview) ───────────────────────────────
const buildConsentHtml = (data) => {
    const template = fs.readFileSync(templatePath, "utf8");

    const entityLogoHtml = data.entityLogo
        ? `<img src="${data.entityLogo}" alt="${safeVal(data.entityName)}" class="header-logo" />`
        : `<div class="header-logo-placeholder"></div>`;

    return template
        .replace(/{{entityLogoHtml}}/g, entityLogoHtml)
        .replace(/{{entityName}}/g, safeVal(data.entityName))
        .replace(/{{entityAddress}}/g, safeVal(data.entityAddress))
        .replace(/{{employeeName}}/g, safeVal(data.employeeName))
        .replace(/{{employeeEmail}}/g, safeVal(data.employeeEmail))
        .replace(/{{department}}/g, safeVal(data.department))
        .replace(/{{allocationDate}}/g, safeVal(data.allocationDate))
        .replace(/{{assetId}}/g, safeVal(data.assetId))
        .replace(/{{assetName}}/g, safeVal(data.assetName))
        .replace(/{{category}}/g, safeVal(data.category))
        .replace(/{{serialNumber}}/g, safeVal(data.serialNumber))
        .replace(/{{ram}}/g, safeVal(data.ram))
        .replace(/{{storage}}/g, safeVal(data.storage))
        .replace(/{{condition}}/g, safeVal(data.condition));
};

// ─── PDF generation (pdfkit) ─────────────────────────────────────────────────
const buildConsentPdf = (data) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 0, size: "A4" });
            const buffers = [];
            doc.on("data", (chunk) => buffers.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(buffers)));
            doc.on("error", reject);

            const PW = doc.page.width;   // 595.28
            const margin = 48;
            const CW = PW - margin * 2;  // content width ~499

            // ── COLOURS ──
            const C = {
                navy:    "#0f3460",
                blue:    "#1a56db",
                amber:   "#f59e0b",
                white:   "#ffffff",
                slate50: "#f8fafc",
                slate100:"#f1f5f9",
                slate200:"#e2e8f0",
                slate400:"#94a3b8",
                slate500:"#64748b",
                slate700:"#334155",
                dark:    "#1e293b",
                noticeB: "#eff6ff",
                noticeT: "#1d4ed8",
                termsB:  "#fffbeb",
                termsT:  "#78350f",
                termsTi: "#92400e",
            };

            // ── HELPERS ──
            const text = (str, x, yPos, opts = {}) => {
                doc.text(str, x, yPos, { lineBreak: false, ...opts });
            };

            // Draws a filled rectangle
            const fillRect = (x, yPos, w, h, color) => {
                doc.rect(x, yPos, w, h).fill(color);
            };

            // Draws a rectangle with border
            const box = (x, yPos, w, h, fill, stroke) => {
                doc.lineWidth(0.5);
                if (fill && stroke) {
                    doc.rect(x, yPos, w, h).fillAndStroke(fill, stroke);
                } else if (fill) {
                    doc.rect(x, yPos, w, h).fill(fill);
                } else {
                    doc.rect(x, yPos, w, h).stroke(stroke);
                }
            };

            // ─── HEADER BAND (y = 0 … 108) ───────────────────────────────────
            fillRect(0, 0, PW, 108, C.navy);

            // Logo white panel (left)
            const hasLogo = data.entityLogo && data.entityLogo.startsWith("data:");
            const logoPanelW = 138;

            if (hasLogo) {
                fillRect(0, 0, logoPanelW, 108, C.white);
                // Amber divider
                fillRect(logoPanelW, 0, 4, 108, C.amber);
                try {
                    const [, b64] = data.entityLogo.split(",");
                    if (b64) {
                        const imgBuf = Buffer.from(b64, "base64");
                        doc.image(imgBuf, 12, 14, { width: logoPanelW - 24, height: 80, fit: [logoPanelW - 24, 80], align: "center", valign: "center" });
                    }
                } catch (_) { /* skip logo on error */ }
            }

            // Header text
            const textStart = hasLogo ? logoPanelW + 18 : margin;
            const textW = PW - textStart - 90; // leave room for badge

            doc.fillColor(C.noticeB).font("Helvetica").fontSize(8);
            text(safeVal(data.entityName).toUpperCase(), textStart, 16, { width: textW, characterSpacing: 1.5 });

            doc.fillColor(C.white).font("Helvetica-Bold").fontSize(16);
            text("Asset Allocation Consent Form", textStart, 30, { width: textW });

            doc.fillColor("#bfdbfe").font("Helvetica").fontSize(9);
            text(`IT Asset Management  ·  Generated: ${safeVal(data.allocationDate)}`, textStart, 54, { width: textW });

            // OFFICIAL badge (amber pill top-right)
            const badgeX = PW - margin - 56;
            fillRect(badgeX, 38, 56, 20, C.amber);
            doc.fillColor(C.dark).font("Helvetica-Bold").fontSize(7);
            text("OFFICIAL", badgeX, 44, { width: 56, align: "center", characterSpacing: 1.5 });

            // Amber accent bar below header
            fillRect(0, 108, PW, 4, C.amber);

            let y = 124;

            // ── SECTION HEADER ──
            const sectionHead = (label, yPos) => {
                fillRect(margin, yPos, 4, 14, C.blue);
                doc.fillColor(C.blue).font("Helvetica-Bold").fontSize(8.5);
                text(label.toUpperCase(), margin + 11, yPos + 2, { characterSpacing: 1.5 });
                return yPos + 22;
            };

            // ── INFO BOX (for 2-col grid) ──
            const infoBox = (label, value, x, yPos, w) => {
                box(x, yPos, w, 46, C.slate50, C.slate200);
                doc.fillColor(C.slate400).font("Helvetica-Bold").fontSize(7.5);
                text(label.toUpperCase(), x + 10, yPos + 9, { width: w - 20, characterSpacing: 1 });
                doc.fillColor(C.dark).font("Helvetica").fontSize(11);
                text(safeVal(value), x + 10, yPos + 22, { width: w - 20, lineBreak: false });
            };

            // ─── NOTICE BANNER ───────────────────────────────────────────────
            fillRect(margin, y, CW, 30, C.noticeB);
            fillRect(margin, y, 4, 30, C.blue);
            doc.fillColor(C.noticeT).font("Helvetica").fontSize(9);
            doc.text(
                "This document confirms the allocation of a company asset. By accepting the asset, the employee agrees to all terms stated herein.",
                margin + 12, y + 9, { width: CW - 20, lineBreak: true }
            );
            y += 40;

            // ─── EMPLOYEE DETAILS ─────────────────────────────────────────────
            y = sectionHead("Employee Details", y);
            const halfW = (CW - 10) / 2;
            infoBox("Full Name",       data.employeeName,  margin,           y, halfW);
            infoBox("Email Address",   data.employeeEmail, margin + halfW + 10, y, halfW);
            y += 54;
            infoBox("Department",      data.department,    margin,           y, halfW);
            infoBox("Allocation Date", data.allocationDate, margin + halfW + 10, y, halfW);
            y += 60;

            // ─── ASSET DETAILS TABLE ──────────────────────────────────────────
            y = sectionHead("Asset Details", y);

            // Table header row
            const labelColW = 158;
            fillRect(margin, y, CW, 22, C.navy);
            doc.fillColor(C.white).font("Helvetica-Bold").fontSize(8.5);
            text("FIELD",   margin + 10, y + 7, { width: labelColW - 10, characterSpacing: 1 });
            text("DETAILS", margin + labelColW + 10, y + 7, { width: CW - labelColW - 20, characterSpacing: 1 });
            y += 22;

            const assetRows = [
                ["Asset ID",      data.assetId],
                ["Asset Name",    data.assetName],
                ["Category",      data.category],
                ["Serial Number", data.serialNumber],
                ["RAM",           data.ram],
                ["Storage",       data.storage],
                ["Condition",     data.condition],
            ];

            assetRows.forEach(([label, value], i) => {
                const rowH = 21;
                const evenRow = i % 2 === 0;
                // Row background
                fillRect(margin, y, CW, rowH, evenRow ? C.white : "#fafbfc");
                // Label cell background
                fillRect(margin, y, labelColW, rowH, evenRow ? C.slate50 : C.slate100);
                // Cell border
                doc.lineWidth(0.4).rect(margin, y, CW, rowH).stroke(C.slate200);
                doc.lineWidth(0.4).moveTo(margin + labelColW, y).lineTo(margin + labelColW, y + rowH).stroke(C.slate200);

                doc.fillColor(C.slate500).font("Helvetica-Bold").fontSize(8.5);
                text(label.toUpperCase(), margin + 10, y + 6, { width: labelColW - 20, characterSpacing: 0.5 });

                doc.fillColor(C.slate700).font("Helvetica").fontSize(9.5);
                text(safeVal(value), margin + labelColW + 10, y + 6, { width: CW - labelColW - 20 });
                y += rowH;
            });
            y += 14;

            // ─── TERMS & CONDITIONS ───────────────────────────────────────────
            y = sectionHead("Terms & Conditions", y);

            const terms = [
                "The asset must be used solely for official business purposes and company-approved activities.",
                "The employee is fully responsible for the safekeeping, care, and proper use of this asset.",
                "Any damage, loss, or theft must be reported to the IT Department immediately.",
                "The asset must be returned in good condition upon resignation, transfer, or request.",
                "Unauthorised software installation or hardware modification is strictly prohibited.",
                "The company may audit asset usage and retrieve the asset at any time during employment.",
            ];

            const termsBoxH = 20 + terms.length * 15 + 10;
            fillRect(margin, y, CW, termsBoxH, C.termsB);
            fillRect(margin, y, 4, termsBoxH, C.amber);
            doc.lineWidth(0.5).rect(margin, y, CW, termsBoxH).stroke("#fde68a");

            doc.fillColor(C.termsTi).font("Helvetica-Bold").fontSize(9);
            text("By accepting this asset, the employee acknowledges and agrees to:", margin + 12, y + 10, { width: CW - 24 });

            let tY = y + 24;
            terms.forEach((term, i) => {
                doc.fillColor(C.termsT).font("Helvetica").fontSize(8.5);
                text(`${i + 1}.  ${term}`, margin + 12, tY, { width: CW - 28, lineBreak: false });
                tY += 15;
            });
            y += termsBoxH + 16;

            // ─── SIGNATURE SECTION ────────────────────────────────────────────
            y = sectionHead("Acknowledgement & Signatures", y);

            const sigW = (CW - 20) / 2;

            // Employee sig box
            doc.lineWidth(0.5).rect(margin, y, sigW, 68).stroke(C.slate200);
            doc.fillColor(C.slate500).font("Helvetica-Bold").fontSize(8);
            text("EMPLOYEE SIGNATURE", margin + 12, y + 10, { characterSpacing: 0.8 });
            // Signature line
            doc.lineWidth(1.5).moveTo(margin + 12, y + 44).lineTo(margin + sigW - 12, y + 44).stroke(C.navy);
            doc.fillColor(C.dark).font("Helvetica-Bold").fontSize(9);
            text(safeVal(data.employeeName), margin + 12, y + 48);
            doc.fillColor(C.slate400).font("Helvetica").fontSize(8);
            text("Date: _______________", margin + 12, y + 58);

            // IT Rep sig box
            const sig2X = margin + sigW + 20;
            doc.lineWidth(0.5).rect(sig2X, y, sigW, 68).stroke(C.slate200);
            doc.fillColor(C.slate500).font("Helvetica-Bold").fontSize(8);
            text("IT REPRESENTATIVE", sig2X + 12, y + 10, { characterSpacing: 0.8 });
            doc.lineWidth(1.5).moveTo(sig2X + 12, y + 44).lineTo(sig2X + sigW - 12, y + 44).stroke(C.navy);
            doc.fillColor(C.slate500).font("Helvetica").fontSize(9);
            text("Authorised by IT Department", sig2X + 12, y + 48);
            doc.fillColor(C.slate400).font("Helvetica").fontSize(8);
            text("Date: _______________", sig2X + 12, y + 58);
            y += 82;

            // ─── FOOTER ──────────────────────────────────────────────────────
            doc.lineWidth(1).moveTo(margin, y).lineTo(PW - margin, y).stroke(C.slate200);
            y += 8;
            doc.fillColor(C.slate400).font("Helvetica").fontSize(8.5);
            text(`${safeVal(data.entityName)}  ·  IT Asset Management System`, margin, y, { width: CW / 2 });
            text(`Document Date: ${safeVal(data.allocationDate)}`, margin + CW / 2, y, { width: CW / 2, align: "right" });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = { buildConsentHtml, buildConsentPdf };
