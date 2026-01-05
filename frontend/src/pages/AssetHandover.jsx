import React, { useState } from "react";
import "./AssetHandover.css";
import { useLocation, useNavigate } from "react-router-dom";

export default function AssetHandover() {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const assetId = params.get("assetId");

  /* ===== AUTO DATE (SYSTEM) ===== */
  const handoverDate = new Date().toISOString().split("T")[0];

  const [reason, setReason] = useState("");

  const handleHandover = () => {
    const payload = {
      assetId,
      handoverDate, // auto-generated
      reason,
    };

    console.log("Handover Payload:", payload);
    alert("Asset handed over successfully (mock)");
    navigate("/assets");
  };

  return (
    <div className="asset-handover-page">

      <div className="page-header">
        <h1>Asset Handover</h1>
        <p>Return asset to inventory</p>
      </div>

      <div className="handover-card">

        <div className="field">
          <label>Asset ID</label>
          <input value={assetId || ""} disabled />
        </div>

        <div className="field">
          <label>Handover Date</label>
          <input value={handoverDate} disabled />
        </div>

        <div className="field">
          <label>Reason</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Select reason</option>
            <option>Employee Exit</option>
            <option>Asset Replacement</option>
            <option>Repair</option>
            <option>Temporary Return</option>
          </select>
        </div>

        <div className="handover-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate("/assets")}
          >
            Cancel
          </button>

          <button
            className="btn-primary"
            disabled={!reason}
            onClick={handleHandover}
          >
            Confirm Handover
          </button>
        </div>

      </div>
    </div>
  );
}

