import { useState } from "react";
import "./FinancialSettings.css";

export default function FinancialSettings() {
  const [settings, setSettings] = useState({
    fiscalYearStart: "April",
    currency: "INR",
    depreciationMethod: "Straight Line",
    defaultUsefulLife: 36,
    salvageValuePercent: 5,
    capexThreshold: 50000
  });

  return (
    <div className="finance-page">
      <div className="finance-header">
        <div>
          <h1>Financial Settings</h1>
          <p>Configure depreciation, capitalization, and reporting preferences.</p>
        </div>
        <div className="actions">
          <button
            className="asset-action-btn primary"
            onClick={() => {
              localStorage.setItem("financialSettings", JSON.stringify(settings));
              alert("Financial settings saved.");
            }}
          >
            Save Settings
          </button>
        </div>
      </div>

      <div className="finance-grid">
        <div className="card">
          <div className="card-title">Depreciation Policy</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Fiscal Year Start</label>
              <select
                value={settings.fiscalYearStart}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, fiscalYearStart: e.target.value }))
                }
              >
                <option>January</option>
                <option>April</option>
                <option>July</option>
                <option>October</option>
              </select>
            </div>
            <div className="form-group">
              <label>Currency</label>
              <select
                value={settings.currency}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, currency: e.target.value }))
                }
              >
                <option>INR</option>
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
              </select>
            </div>
            <div className="form-group">
              <label>Depreciation Method</label>
              <select
                value={settings.depreciationMethod}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, depreciationMethod: e.target.value }))
                }
              >
                <option>Straight Line</option>
                <option>Declining Balance</option>
                <option>Units of Production</option>
              </select>
            </div>
            <div className="form-group">
              <label>Default Useful Life (months)</label>
              <input
                type="number"
                min="6"
                value={settings.defaultUsefulLife}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, defaultUsefulLife: Number(e.target.value) }))
                }
              />
            </div>
            <div className="form-group">
              <label>Salvage Value (%)</label>
              <input
                type="number"
                min="0"
                value={settings.salvageValuePercent}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, salvageValuePercent: Number(e.target.value) }))
                }
              />
            </div>
            <div className="form-group">
              <label>Capex Threshold</label>
              <input
                type="number"
                min="0"
                value={settings.capexThreshold}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, capexThreshold: Number(e.target.value) }))
                }
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Budget Snapshot</div>
          <div className="metrics-grid">
            <div className="metric">
              <span>Total Asset Capex (YTD)</span>
              <strong>₹ 4.8 Cr</strong>
            </div>
            <div className="metric">
              <span>Planned Refresh Budget</span>
              <strong>₹ 1.2 Cr</strong>
            </div>
            <div className="metric">
              <span>Variance</span>
              <strong>+6%</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
