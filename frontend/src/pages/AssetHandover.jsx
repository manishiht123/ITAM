import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaUndoAlt, FaArrowLeft, FaBoxOpen, FaBuilding,
  FaMapMarkerAlt, FaUser, FaTag, FaExclamationTriangle
} from "react-icons/fa";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import "./AssetHandover.css";

const RETURN_REASONS = [
  "Employee Exit",
  "Asset Replacement",
  "Sent for Repair",
  "Temporary Return",
  "Department Transfer",
  "Role Change",
  "Other",
];

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="ah-info-row">
      <span className="ah-info-icon"><Icon /></span>
      <div className="ah-info-content">
        <span className="ah-info-label">{label}</span>
        <span className="ah-info-value">{value || "—"}</span>
      </div>
    </div>
  );
}

export default function AssetHandover() {
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();

  // Asset + entityCode passed via navigate state from Assets.jsx
  const { asset, entityCode } = location.state || {};

  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Guard: if navigated to directly without state
  if (!asset || !entityCode) {
    return (
      <div className="ah-page">
        <div className="ah-card">
          <div className="ah-empty">
            <FaExclamationTriangle className="ah-empty-icon" />
            <p>No asset data found. Please use the Return button from the Assets page.</p>
            <button className="ah-btn-ghost" onClick={() => navigate("/assets")}>
              ← Back to Assets
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handoverDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric"
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) { toast.warning("Please select a reason for return."); return; }

    setLoading(true);
    try {
      await api.returnAsset(asset.id, { reason, notes }, entityCode);
      toast.success(`${asset.name} returned to inventory successfully.`);
      navigate(-1);
    } catch (err) {
      toast.error(err.message || "Failed to process asset return.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ah-page">
      {/* Header */}
      <div className="ah-page-header">
        <button className="ah-back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>
        <div>
          <h1 className="ah-page-title">Asset Handover</h1>
          <p className="ah-page-subtitle">Return asset to inventory and record the reason</p>
        </div>
      </div>

      <div className="ah-layout">
        {/* Left: Asset Details */}
        <div className="ah-card ah-details-card">
          <div className="ah-card-header">
            <FaBoxOpen className="ah-card-header-icon" />
            <span>Asset Being Returned</span>
          </div>

          <div className="ah-asset-title">
            <span className="ah-asset-badge">{asset.assetId}</span>
            <h2 className="ah-asset-name">{asset.name}</h2>
          </div>

          <div className="ah-info-list">
            <InfoRow icon={FaTag}          label="Category"    value={asset.category} />
            <InfoRow icon={FaUser}         label="Assigned To" value={asset.employeeName || asset.employeeId} />
            <InfoRow icon={FaBuilding}     label="Department"  value={asset.department} />
            <InfoRow icon={FaMapMarkerAlt} label="Location"    value={asset.location} />
            <InfoRow icon={FaTag}          label="Condition"   value={asset.condition} />
            <InfoRow icon={FaTag}          label="Serial No."  value={asset.serialNumber} />
          </div>

          <div className="ah-date-row">
            <span className="ah-date-label">Handover Date</span>
            <span className="ah-date-value">{handoverDate}</span>
          </div>
        </div>

        {/* Right: Return Form */}
        <div className="ah-card ah-form-card">
          <div className="ah-card-header">
            <FaUndoAlt className="ah-card-header-icon" />
            <span>Return Details</span>
          </div>

          <form onSubmit={handleSubmit} className="ah-form">
            <div className="ah-field">
              <label className="ah-label">
                Reason for Return <span className="ah-required">*</span>
              </label>
              <select
                className="ah-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                <option value="">Select reason…</option>
                {RETURN_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="ah-field">
              <label className="ah-label">Notes <span className="ah-optional">(optional)</span></label>
              <textarea
                className="ah-textarea"
                rows={4}
                placeholder="Add any additional details about the return, asset condition, accessories included, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="ah-info-banner">
              <FaExclamationTriangle className="ah-banner-icon" />
              <p>
                This will mark the asset as <strong>Available</strong> and remove it from the employee's record.
                A return notification email will be sent automatically.
              </p>
            </div>

            <div className="ah-actions">
              <button
                type="button"
                className="ah-btn-ghost"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ah-btn-primary"
                disabled={loading || !reason}
              >
                {loading ? (
                  <><span className="ah-spinner" /> Processing…</>
                ) : (
                  <><FaUndoAlt /> Confirm Handover</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
