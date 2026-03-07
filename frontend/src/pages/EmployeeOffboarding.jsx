import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaArrowLeft, FaArrowRight, FaCheck, FaUserMinus,
  FaBoxOpen, FaExclamationTriangle, FaClipboardList,
  FaCalendarAlt, FaBuilding, FaTag, FaLaptop
} from "react-icons/fa";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import "./EmployeeOffboarding.css";

const DEPARTURE_REASONS = [
  "Resignation",
  "Retirement",
  "Termination",
  "Contract End",
  "Internal Transfer",
  "Role Change",
  "Other",
];

const STEPS = ["Departure Details", "Asset Checklist", "Review & Confirm"];

function StepBar({ current }) {
  return (
    <div className="eo-steps">
      {STEPS.map((label, i) => (
        <div key={i} className={`eo-step ${i < current ? "done" : i === current ? "active" : ""}`}>
          <div className="eo-step-circle">
            {i < current ? <FaCheck /> : <span>{i + 1}</span>}
          </div>
          <span className="eo-step-label">{label}</span>
          {i < STEPS.length - 1 && <div className="eo-step-line" />}
        </div>
      ))}
    </div>
  );
}

export default function EmployeeOffboarding() {
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();

  const { employee, entityCode } = location.state || {};

  const [step, setStep] = useState(0);
  const [departureReason, setDepartureReason] = useState("");
  const [lastWorkingDay, setLastWorkingDay] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");

  const [assets, setAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState(new Set());

  const [submitting, setSubmitting] = useState(false);

  // Guard: navigate without state
  if (!employee || !entityCode) {
    return (
      <div className="eo-page">
        <div className="eo-guard">
          <FaExclamationTriangle className="eo-guard-icon" />
          <p>No employee data. Please use the Offboard button from the Employees page.</p>
          <button className="eo-btn-ghost" onClick={() => navigate("/employees")}>
            ← Back to Employees
          </button>
        </div>
      </div>
    );
  }

  // Load assets when entering step 1
  useEffect(() => {
    if (step === 1 && assets.length === 0 && !assetsLoading) {
      setAssetsLoading(true);
      api.getEmployeeAssets(employee.id, entityCode)
        .then(({ assets: list }) => {
          setAssets(list || []);
          setSelectedAssetIds(new Set((list || []).map((a) => a.id)));
        })
        .catch((err) => toast.error(err.message || "Failed to load assets"))
        .finally(() => setAssetsLoading(false));
    }
  }, [step]);

  const toggleAsset = (id) => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedAssetIds.size === assets.length) {
      setSelectedAssetIds(new Set());
    } else {
      setSelectedAssetIds(new Set(assets.map((a) => a.id)));
    }
  };

  const handleNext = () => {
    if (step === 0 && !departureReason) {
      toast.warning("Please select a reason for departure.");
      return;
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await api.offboardEmployee(
        employee.id,
        {
          departureReason,
          lastWorkingDay,
          notes,
          assetIds: [...selectedAssetIds],
        },
        entityCode
      );
      toast.success(
        `${employee.name} offboarded. ${result.returnedCount} asset(s) returned to inventory.`
      );
      navigate("/employees");
    } catch (err) {
      toast.error(err.message || "Offboarding failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAssets = assets.filter((a) => selectedAssetIds.has(a.id));

  return (
    <div className="eo-page">
      {/* Page Header */}
      <div className="eo-page-header">
        <button className="eo-back-btn" onClick={() => navigate("/employees")}>
          <FaArrowLeft /> Back
        </button>
        <div>
          <h1 className="eo-page-title">Employee Offboarding</h1>
          <p className="eo-page-subtitle">
            Process departure and return all assigned assets
          </p>
        </div>
      </div>

      {/* Step Bar */}
      <StepBar current={step} />

      {/* ===== STEP 0: Departure Details ===== */}
      {step === 0 && (
        <div className="eo-card">
          <div className="eo-card-header">
            <FaUserMinus className="eo-card-icon orange" />
            <span>Employee Information &amp; Departure Details</span>
          </div>

          {/* Employee summary */}
          <div className="eo-emp-summary">
            <div className="eo-emp-avatar">
              {(employee.name || "?")[0].toUpperCase()}
            </div>
            <div className="eo-emp-info">
              <div className="eo-emp-name">{employee.name}</div>
              <div className="eo-emp-meta">
                {[employee.email, employee.designation].filter(Boolean).join(" · ")}
              </div>
              <div className="eo-emp-tags">
                {employee.department && (
                  <span className="eo-tag"><FaBuilding />{employee.department}</span>
                )}
                {employee.employeeId && (
                  <span className="eo-tag"><FaTag />{employee.employeeId}</span>
                )}
                {employee.assetsCount > 0 && (
                  <span className="eo-tag orange">
                    <FaLaptop />{employee.assetsCount} asset{employee.assetsCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="eo-form">
            <div className="eo-field">
              <label className="eo-label">
                Reason for Departure <span className="eo-required">*</span>
              </label>
              <select
                className="eo-select"
                value={departureReason}
                onChange={(e) => setDepartureReason(e.target.value)}
              >
                <option value="">Select reason…</option>
                {DEPARTURE_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="eo-field">
              <label className="eo-label">
                <FaCalendarAlt /> Last Working Day
              </label>
              <input
                type="date"
                className="eo-input"
                value={lastWorkingDay}
                onChange={(e) => setLastWorkingDay(e.target.value)}
              />
            </div>

            <div className="eo-field">
              <label className="eo-label">
                Notes <span className="eo-optional">(optional)</span>
              </label>
              <textarea
                className="eo-textarea"
                rows={3}
                placeholder="Additional context, handover instructions, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="eo-actions">
            <button className="eo-btn-ghost" onClick={() => navigate("/employees")}>
              Cancel
            </button>
            <button className="eo-btn-primary" onClick={handleNext}>
              Next: Asset Checklist <FaArrowRight />
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 1: Asset Checklist ===== */}
      {step === 1 && (
        <div className="eo-card">
          <div className="eo-card-header">
            <FaBoxOpen className="eo-card-icon blue" />
            <span>Assets Assigned to {employee.name}</span>
            <span className="eo-card-badge">{assets.length} asset{assets.length !== 1 ? "s" : ""}</span>
          </div>

          {assetsLoading ? (
            <div className="eo-loading">
              <div className="eo-spinner" /> Loading assigned assets…
            </div>
          ) : assets.length === 0 ? (
            <div className="eo-empty">
              <FaClipboardList className="eo-empty-icon" />
              <p>No assets currently assigned to this employee.</p>
              <p className="eo-empty-sub">You can proceed directly to offboarding.</p>
            </div>
          ) : (
            <>
              <div className="eo-checklist-toolbar">
                <label className="eo-check-all">
                  <input
                    type="checkbox"
                    checked={selectedAssetIds.size === assets.length}
                    onChange={toggleAll}
                  />
                  <span>
                    {selectedAssetIds.size === assets.length ? "Deselect All" : "Select All"}
                  </span>
                </label>
                <span className="eo-selected-count">
                  {selectedAssetIds.size} of {assets.length} selected for return
                </span>
              </div>

              <div className="eo-asset-list">
                {assets.map((asset) => (
                  <label
                    key={asset.id}
                    className={`eo-asset-row ${selectedAssetIds.has(asset.id) ? "selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssetIds.has(asset.id)}
                      onChange={() => toggleAsset(asset.id)}
                    />
                    <div className="eo-asset-icon-wrap">
                      <FaLaptop />
                    </div>
                    <div className="eo-asset-info">
                      <div className="eo-asset-id">{asset.assetId}</div>
                      <div className="eo-asset-name">{asset.name}</div>
                    </div>
                    <div className="eo-asset-meta">
                      {asset.category && <span className="eo-meta-tag">{asset.category}</span>}
                      {asset.condition && (
                        <span className={`eo-meta-tag ${asset.condition === "Good" ? "green" : asset.condition === "Needs Repair" ? "orange" : ""}`}>
                          {asset.condition}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}

          <div className="eo-actions">
            <button className="eo-btn-ghost" onClick={() => setStep(0)}>
              <FaArrowLeft /> Back
            </button>
            <button className="eo-btn-primary" onClick={handleNext}>
              Review &amp; Confirm <FaArrowRight />
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 2: Review & Confirm ===== */}
      {step === 2 && (
        <div className="eo-card">
          <div className="eo-card-header">
            <FaClipboardList className="eo-card-icon green" />
            <span>Review &amp; Confirm Offboarding</span>
          </div>

          {/* Summary */}
          <div className="eo-review-grid">
            <div className="eo-review-block">
              <div className="eo-review-label">Employee</div>
              <div className="eo-review-value">{employee.name}</div>
            </div>
            <div className="eo-review-block">
              <div className="eo-review-label">Department</div>
              <div className="eo-review-value">{employee.department || "—"}</div>
            </div>
            <div className="eo-review-block">
              <div className="eo-review-label">Reason</div>
              <div className="eo-review-value">{departureReason}</div>
            </div>
            <div className="eo-review-block">
              <div className="eo-review-label">Last Working Day</div>
              <div className="eo-review-value">
                {lastWorkingDay
                  ? new Date(lastWorkingDay + "T00:00:00").toLocaleDateString("en-GB", {
                      day: "2-digit", month: "long", year: "numeric"
                    })
                  : "—"}
              </div>
            </div>
          </div>

          {notes && (
            <div className="eo-review-notes">
              <span className="eo-review-label">Notes</span>
              <p>{notes}</p>
            </div>
          )}

          {/* Assets being returned */}
          <div className="eo-review-section">
            <div className="eo-review-section-title">
              <FaBoxOpen />
              {selectedAssets.length > 0
                ? `${selectedAssets.length} Asset${selectedAssets.length !== 1 ? "s" : ""} will be returned to inventory`
                : "No assets selected for return"}
            </div>
            {selectedAssets.length > 0 && (
              <div className="eo-review-asset-list">
                {selectedAssets.map((a) => (
                  <div key={a.id} className="eo-review-asset-row">
                    <span className="eo-review-asset-id">{a.assetId}</span>
                    <span className="eo-review-asset-name">{a.name}</span>
                    {a.category && <span className="eo-meta-tag">{a.category}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warning banner */}
          <div className="eo-warning-banner">
            <FaExclamationTriangle className="eo-warning-icon" />
            <div>
              <strong>This action cannot be undone.</strong> The employee's status will be set
              to <strong>Inactive</strong> and all selected assets will be marked
              as <strong>Available</strong>. Return notification emails will be sent automatically.
            </div>
          </div>

          <div className="eo-actions">
            <button className="eo-btn-ghost" onClick={() => setStep(1)} disabled={submitting}>
              <FaArrowLeft /> Back
            </button>
            <button
              className="eo-btn-danger"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <><span className="eo-spinner" /> Processing…</>
              ) : (
                <><FaUserMinus /> Confirm Offboarding</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
