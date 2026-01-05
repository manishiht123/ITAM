import { useState } from "react";
import "./AssetAllocation.css";
import AllocationHistoryDrawer from "../components/AllocationHistoryDrawer";

export default function AssetAllocation() {
  const [step, setStep] = useState(1);
  const [openHistory, setOpenHistory] = useState(false);

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const allocationHistory = [
    {
      employee: "Rahul Sharma",
      department: "IT",
      allocatedOn: "01 Jan 2023",
      handoverOn: "15 Jun 2024",
      status: "Returned",
    },
    {
      employee: "Ankit Verma",
      department: "IT",
      allocatedOn: "20 Jun 2024",
      handoverOn: null,
      status: "Allocated",
    },
  ];

  return (
    <div className="assets-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1>Asset Allocation</h1>
          <p className="page-subtitle">
            Assign an available asset to an employee
          </p>
        </div>

        <button
          className="btn-secondary"
          onClick={() => setOpenHistory(true)}
        >
          Allocation History
        </button>
      </div>

      {/* DRAWER */}
      <AllocationHistoryDrawer
        open={openHistory}
        onClose={() => setOpenHistory(false)}
        history={allocationHistory}
      />

      {/* STEPPER */}
      <div className="stepper">
        {["Asset", "Employee", "Security", "Software"].map((label, i) => (
          <div
            key={label}
            className={`step ${
              step === i + 1 ? "active" : step > i + 1 ? "done" : ""
            }`}
          >
            <span>{i + 1}</span>
            <p>{label}</p>
          </div>
        ))}
      </div>

      {/* STEP 1 — ASSET */}
      {step === 1 && (
        <div className="form-card accent">
          <h3>Asset Selection</h3>

          <div className="form-grid three">
            <div className="form-group">
              <label>Available Asset</label>
              <select>
                <option>Select Available Asset</option>
                <option>OFB/ITL/0028</option>
                <option>OFB/ITD/0012</option>
              </select>
            </div>

            <div className="form-group readonly">
              <label>Allocation Date</label>
              <input value={today} readOnly />
            </div>

            <div className="form-group readonly">
              <label>Status</label>
              <input value="Allocated" readOnly />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 — EMPLOYEE */}
      {step === 2 && (
        <div className="form-card">
          <h3>Employee Details</h3>

          <div className="form-grid three">
            <div className="form-group">
              <label>Employee</label>
              <select>
                <option>Select Employee</option>
                <option>Rahul Sharma (EMP-101)</option>
                <option>Rohan Kumar (EMP-102)</option>
              </select>
            </div>

            <div className="form-group readonly">
              <label>Email</label>
              <input value="rahul@company.com" readOnly />
            </div>

            <div className="form-group readonly">
              <label>Department</label>
              <input value="IT" readOnly />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 — SECURITY */}
      {step === 3 && (
        <div className="form-card">
          <h3>Security Classification (Auto)</h3>

          <div className="form-grid four">
            <div className="form-group readonly">
              <label>Confidentiality</label>
              <input value="High" readOnly />
            </div>
            <div className="form-group readonly">
              <label>Integrity</label>
              <input value="High" readOnly />
            </div>
            <div className="form-group readonly">
              <label>Availability</label>
              <input value="High" readOnly />
            </div>
            <div className="form-group readonly">
              <label>Sensitivity</label>
              <input value="Critical" readOnly />
            </div>
          </div>
        </div>
      )}

      {/* STEP 4 — SOFTWARE */}
      {step === 4 && (
        <div className="form-card">
          <h3>Software & Licensing</h3>

          <div className="form-grid four">
            <div className="form-group">
              <label>MS Office ID</label>
              <input placeholder="office@company.com" />
            </div>

            <div className="form-group">
              <label>Windows License Key</label>
              <input placeholder="XXXXX-XXXXX" />
            </div>

            <div className="form-group">
              <label>Antivirus Installed</label>
              <select>
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>

            <div className="form-group">
              <label>VPN Access</label>
              <select>
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div className="form-actions">
        {step > 1 && (
          <button className="btn-secondary" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}

        {step < 4 ? (
          <button className="btn-primary" onClick={() => setStep(step + 1)}>
            Next
          </button>
        ) : (
          <button className="btn-primary">
            Allocate Asset
          </button>
        )}
      </div>
    </div>
  );
}

