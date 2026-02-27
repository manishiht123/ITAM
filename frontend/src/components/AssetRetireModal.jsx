import { useState } from "react";
import { Button } from "./ui";
import "./AssetRetireModal.css";

const DISPOSAL_REASONS = [
  "End of Life",
  "Physical Damage / Beyond Repair",
  "Technology Upgrade",
  "Theft / Loss",
  "Surplus / No Longer Needed",
  "Warranty Expired",
  "Other"
];

const DISPOSAL_METHODS = [
  "Scrap",
  "Sell",
  "Donate",
  "Recycle",
  "Return to Vendor",
  "Destroy",
  "Other"
];

export default function AssetRetireModal({ asset, onConfirm, onCancel, loading }) {
  const [form, setForm] = useState({
    disposalReason:  "End of Life",
    disposalMethod:  "Scrap",
    disposalDate:    new Date().toISOString().split("T")[0],
    saleValue:       "",
    authorizedBy:    "",
    notes:           ""
  });

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(form);
  };

  if (!asset) return null;

  return (
    <div className="page-modal-overlay">
      <div className="page-modal arm-modal">
        {/* Header */}
        <div className="page-modal-header arm-header">
          <div>
            <h2>Retire Asset</h2>
            <p className="arm-subtitle">
              Record formal disposal of <strong>{asset.name}</strong>
              <span className="arm-asset-id">{asset.assetId || asset.id}</span>
            </p>
          </div>
          <button className="page-modal-close" onClick={onCancel}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="page-modal-body">
          {/* Asset summary strip */}
          <div className="arm-asset-strip">
            {[
              ["Category",  asset.category],
              ["Serial No.", asset.serialNumber || "—"],
              ["Entity",    asset.entity],
              ["Status",    asset.status],
              ["Orig. Price", asset.price ? `₹${asset.price}` : "—"]
            ].map(([lbl, val]) => (
              <div key={lbl} className="arm-strip-item">
                <span className="arm-strip-label">{lbl}</span>
                <span className="arm-strip-value">{val}</span>
              </div>
            ))}
          </div>

          {/* Form grid */}
          <div className="arm-form-grid">
            <div className="page-modal-field">
              <label className="page-modal-label">Disposal Reason <span className="arm-req">*</span></label>
              <select className="page-modal-input" value={form.disposalReason}
                onChange={(e) => set("disposalReason", e.target.value)} required>
                {DISPOSAL_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>

            <div className="page-modal-field">
              <label className="page-modal-label">Disposal Method <span className="arm-req">*</span></label>
              <select className="page-modal-input" value={form.disposalMethod}
                onChange={(e) => set("disposalMethod", e.target.value)} required>
                {DISPOSAL_METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>

            <div className="page-modal-field">
              <label className="page-modal-label">Disposal Date</label>
              <input type="date" className="page-modal-input"
                value={form.disposalDate}
                onChange={(e) => set("disposalDate", e.target.value)} />
            </div>

            <div className="page-modal-field">
              <label className="page-modal-label">
                Sale / Scrap Value (₹)
                <span className="arm-hint"> — if applicable</span>
              </label>
              <input type="number" min="0" className="page-modal-input"
                placeholder="0"
                value={form.saleValue}
                onChange={(e) => set("saleValue", e.target.value)} />
            </div>

            <div className="page-modal-field arm-full">
              <label className="page-modal-label">Authorized By</label>
              <input type="text" className="page-modal-input"
                placeholder="Name or designation of approver"
                value={form.authorizedBy}
                onChange={(e) => set("authorizedBy", e.target.value)} />
            </div>

            <div className="page-modal-field arm-full">
              <label className="page-modal-label">Notes</label>
              <textarea className="page-modal-input arm-textarea"
                rows={3}
                placeholder="Any additional disposal notes, reference numbers…"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)} />
            </div>
          </div>

          {/* Warning */}
          <div className="arm-warning">
            <span className="arm-warning-icon">⚠</span>
            This will permanently mark the asset as <strong>Retired</strong> and release it
            from any employee association. It cannot be re-allocated after retirement.
          </div>

          <div className="page-modal-footer">
            <Button variant="secondary" type="button" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" disabled={loading}>
              {loading ? "Retiring…" : "Confirm Retirement"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
