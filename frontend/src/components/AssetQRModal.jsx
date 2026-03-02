import { useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
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
  const printRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!asset) return null;

  const qrValue = buildQRPayload(asset);
  const assetTag = asset.assetId || asset.id;

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    const win = window.open("", "_blank", "width=340,height=440");
    win.document.write(`
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
              width: 280px;
            }
            .label-wrap {
              border: 1.5px solid #e2e8f0;
              border-radius: 10px;
              padding: 16px;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 10px;
            }
            .label-qr { display: flex; justify-content: center; }
            .label-qr svg { border-radius: 4px; }
            .label-tag {
              font-size: 15px;
              font-weight: 700;
              color: #0f172a;
              letter-spacing: 0.04em;
              text-align: center;
            }
            .label-name {
              font-size: 12px;
              color: #374151;
              text-align: center;
              font-weight: 500;
            }
            .label-meta {
              font-size: 10px;
              color: #6b7280;
              text-align: center;
            }
            .label-divider {
              width: 100%;
              height: 1px;
              background: #e2e8f0;
            }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
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
          <div className="qr-label-wrap" ref={printRef}>
            <div className="label-wrap">
              <div className="label-qr">
                <QRCodeSVG value={qrValue} size={148} level="M" includeMargin={false} />
              </div>
              <div className="label-divider" />
              <div className="label-tag">{assetTag}</div>
              <div className="label-name">{asset.name}</div>
              <div className="label-meta">
                {[asset.serialNumber, asset.department, asset.entity].filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>
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
