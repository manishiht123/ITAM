import { useState, useEffect } from "react";
import "./AssetDetailDrawer.css";
import { useEscClose } from "../hooks/useEscClose";
import { Spinner } from "./ui";
import { FaPencilAlt } from "react-icons/fa";
import api from "../services/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const calcDepreciatedValue = (price, dateOfPurchase, usefulLifeYears = 3) => {
  if (!price || !dateOfPurchase) return null;
  const p = parseFloat(String(price).replace(/[^0-9.]/g, ""));
  if (isNaN(p) || p <= 0) return null;
  const purchased = new Date(dateOfPurchase);
  if (isNaN(purchased.getTime())) return null;
  const years = (Date.now() - purchased.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (years < 0) return p;
  return Math.max(0, p * (1 - years / usefulLifeYears));
};

const formatCurrency = (v) => {
  if (v === null || v === undefined) return "—";
  return "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 0 });
};

const STATUS_COLORS = {
  "In Use":        "#19cda5",
  "Allocated":     "#19cda5",
  "Available":     "#22c55e",
  "In Stock":      "#22c55e",
  "Under Repair":  "#f97316",
  "Retired":       "#ef4444",
  "Theft/Missing": "#db2777",
  "Not Submitted": "#f59e0b",
  "Pending Approval": "#6366f1",
};

// Returns "—" for null/undefined/empty
const val = (v) =>
  v !== null && v !== undefined && String(v).trim() !== "" ? String(v) : "—";

// ── Component ─────────────────────────────────────────────────────────────────

export default function AssetDetailDrawer({ asset, onClose, onEdit }) {
  const [cfDefs, setCfDefs]       = useState([]);
  const [cfLoading, setCfLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setCfLoading(true);
    api.getActiveCustomFields()
      .then((defs) => { if (!cancelled) setCfDefs(defs || []); })
      .catch(() => { if (!cancelled) setCfDefs([]); })
      .finally(() => { if (!cancelled) setCfLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEscClose(!!asset, onClose);

  if (!asset) return null;

  const statusColor = STATUS_COLORS[asset.status] || "#94a3b8";

  // Financial calculations
  const purchasePrice = asset.price
    ? parseFloat(String(asset.price).replace(/[^0-9.]/g, ""))
    : null;
  const deprValue = calcDepreciatedValue(asset.price, asset.dateOfPurchase);
  const deprPct = (deprValue !== null && purchasePrice)
    ? Math.round((deprValue / purchasePrice) * 100)
    : null;
  const deprColor = deprPct === null ? "#94a3b8"
    : deprPct > 50 ? "#22c55e"
    : deprPct > 0  ? "#f97316"
    : "#ef4444";

  // Custom fields — parse safely
  const assetCf = (() => {
    if (!asset.customFields) return {};
    if (typeof asset.customFields === "object") return asset.customFields;
    try { return JSON.parse(asset.customFields); } catch { return {}; }
  })();

  return (
    <div className="add-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="add-drawer">

        {/* ── Header ── */}
        <div className="add-header">
          <div>
            <h2 className="add-title">Asset Details</h2>
            <div className="add-asset-meta">
              <span className="add-asset-id">{asset.assetId || asset.id}</span>
              <span className="add-dot">·</span>
              <span>{asset.name}</span>
              {asset.category && (
                <>
                  <span className="add-dot">·</span>
                  <span className="add-cat">{asset.category}</span>
                </>
              )}
            </div>
            <span
              className="add-status-badge"
              style={{
                background: statusColor + "22",
                color: statusColor,
                border: `1px solid ${statusColor}55`,
              }}
            >
              {asset.status || "Unknown"}
            </span>
          </div>
          <button className="add-close" onClick={onClose} title="Close">✕</button>
        </div>

        {/* ── Body ── */}
        <div className="add-body">

          {/* ─ Identification ─ */}
          <div className="add-section">
            <div className="add-section-title">Identification</div>
            <div className="add-grid">
              <div className="add-field">
                <span className="add-label">Asset ID</span>
                <span className="add-value mono">{val(asset.assetId || asset.id)}</span>
              </div>
              <div className="add-field">
                <span className="add-label">Name</span>
                <span className="add-value">{val(asset.name)}</span>
              </div>
              <div className="add-field">
                <span className="add-label">Category</span>
                <span className="add-value">{val(asset.category)}</span>
              </div>
              <div className="add-field">
                <span className="add-label">Serial Number</span>
                <span className="add-value mono">{val(asset.serialNumber)}</span>
              </div>
              <div className="add-field full-width">
                <span className="add-label">Make / Model</span>
                <span className="add-value">{val(asset.makeModel)}</span>
              </div>
              {asset.entity && (
                <div className="add-field">
                  <span className="add-label">Entity</span>
                  <span className="add-value">{asset.entity}</span>
                </div>
              )}
            </div>
          </div>

          {/* ─ Status & Assignment ─ */}
          <div className="add-section">
            <div className="add-section-title">Status &amp; Assignment</div>
            <div className="add-grid">
              <div className="add-field">
                <span className="add-label">Status</span>
                <span>
                  <span
                    className="add-inline-badge"
                    style={{
                      background: statusColor + "22",
                      color: statusColor,
                      border: `1px solid ${statusColor}55`,
                    }}
                  >
                    {asset.status || "—"}
                  </span>
                </span>
              </div>
              <div className="add-field">
                <span className="add-label">Employee ID</span>
                <span className="add-value mono">{val(asset.employeeId)}</span>
              </div>
              <div className="add-field">
                <span className="add-label">Employee Name</span>
                <span className="add-value">{val(asset.employeeName)}</span>
              </div>
              <div className="add-field">
                <span className="add-label">Employee Email</span>
                <span className="add-value">{val(asset.employeeEmail)}</span>
              </div>
              <div className="add-field">
                <span className="add-label">Department</span>
                <span className="add-value">{val(asset.department)}</span>
              </div>
              <div className="add-field">
                <span className="add-label">Location</span>
                <span className="add-value">{val(asset.location)}</span>
              </div>
            </div>
          </div>

          {/* ─ Financial ─ */}
          <div className="add-section">
            <div className="add-section-title">Financial</div>
            <div className="add-grid">
              <div className="add-field">
                <span className="add-label">Purchase Price</span>
                <span className="add-value">
                  {purchasePrice ? formatCurrency(purchasePrice) : "—"}
                </span>
              </div>
              <div className="add-field">
                <span className="add-label">Date of Purchase</span>
                <span className="add-value">{fmtDate(asset.dateOfPurchase)}</span>
              </div>
              <div className="add-field">
                <span className="add-label">Warranty Expires</span>
                <span className="add-value">{fmtDate(asset.warrantyExpireDate)}</span>
              </div>
              <div className="add-field">
                <span className="add-label">Depreciated Value</span>
                <span className="add-value">
                  {deprValue !== null ? (
                    <>
                      {formatCurrency(deprValue)}
                      {deprPct !== null && (
                        <span style={{ fontSize: 11, marginLeft: 5, color: deprColor }}>
                          ({deprPct}%)
                        </span>
                      )}
                    </>
                  ) : "—"}
                </span>
              </div>
              {deprValue !== null && deprPct !== null && (
                <div className="add-field full-width">
                  <div className="add-depr-row">
                    <div className="add-depr-track">
                      <div
                        className="add-depr-fill"
                        style={{ width: `${deprPct}%`, background: deprColor }}
                      />
                    </div>
                    <span className="add-depr-pct" style={{ color: deprColor }}>
                      {deprPct}%
                    </span>
                  </div>
                </div>
              )}
              {asset.invoiceNumber && (
                <div className="add-field">
                  <span className="add-label">Invoice Number</span>
                  <span className="add-value mono">{asset.invoiceNumber}</span>
                </div>
              )}
              {asset.vendorName && (
                <div className="add-field">
                  <span className="add-label">Vendor</span>
                  <span className="add-value">{asset.vendorName}</span>
                </div>
              )}
            </div>
          </div>

          {/* ─ Technical Specs ─ */}
          {(asset.os || asset.cpu || asset.ram || asset.storage || asset.additionalItems || asset.comments) && (
            <div className="add-section">
              <div className="add-section-title">Technical Specs</div>
              <div className="add-grid">
                {asset.os && (
                  <div className="add-field">
                    <span className="add-label">OS</span>
                    <span className="add-value">{asset.os}</span>
                  </div>
                )}
                {asset.cpu && (
                  <div className="add-field">
                    <span className="add-label">CPU</span>
                    <span className="add-value">{asset.cpu}</span>
                  </div>
                )}
                {asset.ram && (
                  <div className="add-field">
                    <span className="add-label">RAM</span>
                    <span className="add-value">{asset.ram}</span>
                  </div>
                )}
                {asset.storage && (
                  <div className="add-field">
                    <span className="add-label">SSD / HDD</span>
                    <span className="add-value">{asset.storage}</span>
                  </div>
                )}
                {asset.additionalItems && (
                  <div className="add-field full-width">
                    <span className="add-label">Additional Items</span>
                    <span className="add-value">{asset.additionalItems}</span>
                  </div>
                )}
                {asset.comments && (
                  <div className="add-field full-width">
                    <span className="add-label">Comments</span>
                    <span className="add-value">{asset.comments}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─ Custom Fields ─ */}
          {cfLoading ? (
            <div className="add-section">
              <div className="add-section-title">Custom Fields</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", color: "var(--text-secondary)", fontSize: 13 }}>
                <Spinner size="sm" />
                Loading…
              </div>
            </div>
          ) : cfDefs.length > 0 ? (
            <div className="add-section">
              <div className="add-section-title">Custom Fields</div>
              <div className="add-cf-grid">
                {cfDefs.map((def) => (
                  <div key={def.id} className="add-field">
                    <span className="add-label">{def.fieldName}</span>
                    <span className="add-value">{val(assetCf[def.fieldKey])}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

        </div>

        {/* ── Footer ── */}
        <div className="add-footer">
          <button className="add-btn-close" onClick={onClose}>Close</button>
          <button className="add-btn-edit" onClick={() => onEdit(asset)}>
            <FaPencilAlt size={11} />
            Edit Asset
          </button>
        </div>

      </div>
    </div>
  );
}
