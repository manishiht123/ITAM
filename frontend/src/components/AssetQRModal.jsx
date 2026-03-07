import { useRef, useEffect } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { FaTimes, FaPrint, FaQrcode } from "react-icons/fa";
import "./AssetQRModal.css";

function buildQRPayload(asset) {
  return [
    `ID:${asset.assetId || asset.id}`,
    `SN:${asset.serialNumber || ""}`,
    `${asset.name || ""}`,
    `${asset.entity || ""}`,
  ].filter(Boolean).join("|");
}

export default function AssetQRModal({ asset, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!asset) return null;

  const qrValue = buildQRPayload(asset);
  const assetTag = asset.assetId || asset.id;
  const metaLine = [asset.serialNumber, asset.department, asset.entity].filter(Boolean).join(" · ");

  const handlePrint = () => {
    // Use the hidden canvas to get a reliable PNG data URL (avoids SVG xmlns issues)
    const canvas = canvasRef.current?.querySelector("canvas");
    const imgSrc = canvas ? canvas.toDataURL("image/png") : "";

    const win = window.open("", "_blank", "width=360,height=480");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Asset Label — ${assetTag}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Segoe UI", Arial, sans-serif;
      padding: 20px;
      color: #0f172a;
      background: #fff;
      width: 300px;
    }
    .label-wrap {
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      padding: 18px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .label-qr img {
      display: block;
      border-radius: 4px;
      width: 160px;
      height: 160px;
    }
    .label-divider {
      width: 100%;
      height: 1px;
      background: #e2e8f0;
    }
    .label-tag {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: 0.05em;
      text-align: center;
    }
    .label-name {
      font-size: 12px;
      color: #374151;
      text-align: center;
      font-weight: 500;
      line-height: 1.4;
    }
    .label-meta {
      font-size: 10px;
      color: #6b7280;
      text-align: center;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="label-wrap">
    <div class="label-qr"><img src="${imgSrc}" alt="QR Code" /></div>
    <div class="label-divider"></div>
    <div class="label-tag">${assetTag}</div>
    <div class="label-name">${asset.name || ""}</div>
    ${metaLine ? `<div class="label-meta">${metaLine}</div>` : ""}
  </div>
</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="qr-modal-header">
          <div className="qr-modal-title">
            <FaQrcode />
            <span>Asset Label</span>
          </div>
          <button className="qr-modal-close" onClick={onClose}><FaTimes /></button>
        </div>

        {/* Label preview */}
        <div className="qr-modal-body">
          <div className="qr-label-wrap">
            <div className="label-wrap">
              <div className="label-qr">
                <QRCodeSVG value={qrValue} size={148} level="M" includeMargin={false} />
              </div>
              <div className="label-divider" />
              <div className="label-tag">{assetTag}</div>
              <div className="label-name">{asset.name}</div>
              {metaLine && <div className="label-meta">{metaLine}</div>}
            </div>
          </div>
        </div>

        {/* Hidden canvas for print PNG extraction */}
        <div ref={canvasRef} style={{ display: "none" }}>
          <QRCodeCanvas value={qrValue} size={160} level="M" includeMargin={false} />
        </div>

        {/* Actions */}
        <div className="qr-modal-footer">
          <button className="qr-btn-secondary" onClick={onClose}>Close</button>
          <button className="qr-btn-primary" onClick={handlePrint}>
            <FaPrint /> Print Label
          </button>
        </div>

      </div>
    </div>
  );
}
