import { useEffect, useMemo, useState } from "react";
import {
  FaCalculator, FaChartLine, FaInfoCircle, FaRupeeSign,
  FaCalendarAlt, FaShieldAlt, FaCog
} from "react-icons/fa";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Button, LoadingOverlay } from "../../components/ui";
import "./FinancialSettings.css";

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const METHOD_INFO = {
  "Straight Line": "Equal depreciation each year. Total cost (minus salvage) ÷ useful life.",
  "Declining Balance": "Accelerated method — higher depreciation in early years. Rate applied to remaining book value.",
  "Units of Production": "Depreciation based on actual asset usage. Requires usage tracking per asset."
};

function fmt(n) {
  return Number(n).toLocaleString("en-IN");
}

function computeDepSchedule(cost, method, lifeMonths, salvagePct) {
  const lifeYears = lifeMonths / 12;
  const salvage = cost * (salvagePct / 100);
  const depBase = cost - salvage;
  const rows = [];

  if (method === "Straight Line") {
    const annualDep = depBase / lifeYears;
    let bookValue = cost;
    for (let yr = 1; yr <= Math.min(Math.ceil(lifeYears), 8); yr++) {
      const dep = yr <= lifeYears ? annualDep : 0;
      bookValue = Math.max(bookValue - dep, salvage);
      rows.push({ year: yr, depreciation: dep, bookValue });
    }
  } else if (method === "Declining Balance") {
    const rate = 2 / lifeYears; // double declining
    let bookValue = cost;
    for (let yr = 1; yr <= Math.min(Math.ceil(lifeYears), 8); yr++) {
      const dep = Math.min(bookValue * rate, bookValue - salvage);
      bookValue = Math.max(bookValue - dep, salvage);
      rows.push({ year: yr, depreciation: dep, bookValue });
    }
  } else {
    // Units of Production – show flat equal for preview purposes
    const annualDep = depBase / lifeYears;
    let bookValue = cost;
    for (let yr = 1; yr <= Math.min(Math.ceil(lifeYears), 8); yr++) {
      const dep = yr <= lifeYears ? annualDep : 0;
      bookValue = Math.max(bookValue - dep, salvage);
      rows.push({ year: yr, depreciation: dep, bookValue });
    }
  }
  return rows;
}

export default function FinancialSettings() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calcCost, setCalcCost] = useState(100000);
  const [showCalc, setShowCalc] = useState(false);

  const [settings, setSettings] = useState({
    fiscalYearStart: "April",
    currency: "INR",
    depreciationMethod: "Straight Line",
    defaultUsefulLife: 36,
    salvageValuePercent: 5,
    capexThreshold: 50000,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const prefs = await api.getSystemPreferences();
        setSettings((prev) => ({
          ...prev,
          fiscalYearStart: prefs.fiscalYearStart || prev.fiscalYearStart,
          depreciationMethod: prefs.depreciationMethod || prev.depreciationMethod,
          defaultUsefulLife: prefs.defaultUsefulLife ?? prev.defaultUsefulLife,
          salvageValuePercent: prefs.salvageValuePercent ?? prev.salvageValuePercent,
          capexThreshold: prefs.capexThreshold ?? prev.capexThreshold,
        }));
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateSystemPreferences({
        fiscalYearStart: settings.fiscalYearStart,
        depreciationMethod: settings.depreciationMethod,
        defaultUsefulLife: settings.defaultUsefulLife,
        salvageValuePercent: settings.salvageValuePercent,
        capexThreshold: settings.capexThreshold,
      });
      toast.success("Financial settings saved successfully.");
    } catch (err) {
      toast.error(err.message || "Failed to save financial settings.");
    } finally {
      setSaving(false);
    }
  };

  // --- Computed KPIs ---
  const lifeYears = settings.defaultUsefulLife / 12;
  const salvage = settings.salvageValuePercent / 100;

  const annualDepRate = useMemo(() => {
    if (settings.depreciationMethod === "Straight Line") {
      return (((1 - salvage) / lifeYears) * 100).toFixed(1);
    } else if (settings.depreciationMethod === "Declining Balance") {
      return ((2 / lifeYears) * 100).toFixed(1);
    }
    return "Variable";
  }, [settings.depreciationMethod, lifeYears, salvage]);

  const year1DepOn1L = useMemo(() => {
    const cost = 100000;
    const salvageVal = cost * salvage;
    if (settings.depreciationMethod === "Straight Line") {
      return Math.round((cost - salvageVal) / lifeYears);
    } else if (settings.depreciationMethod === "Declining Balance") {
      return Math.round(cost * (2 / lifeYears));
    }
    return Math.round((cost - salvageVal) / lifeYears);
  }, [settings.depreciationMethod, lifeYears, salvage]);

  const fiscalYearEnd = useMemo(() => {
    const idx = MONTHS.indexOf(settings.fiscalYearStart);
    return MONTHS[(idx + 11) % 12];
  }, [settings.fiscalYearStart]);

  // Depreciation schedule for calculator
  const depSchedule = useMemo(() => {
    if (!showCalc || calcCost <= 0) return [];
    return computeDepSchedule(calcCost, settings.depreciationMethod, settings.defaultUsefulLife, settings.salvageValuePercent);
  }, [showCalc, calcCost, settings.depreciationMethod, settings.defaultUsefulLife, settings.salvageValuePercent]);

  if (loading) {
    return (
      <div className="finance-page">
        <LoadingOverlay visible message="Loading financial settings..." />
      </div>
    );
  }

  return (
    <div className="finance-page">
      {/* HEADER */}
      <div className="finance-header">
        <div>
          <h1>Financial Settings</h1>
          <p>Configure depreciation methods, capitalisation thresholds, and fiscal reporting preferences.</p>
        </div>
        <div className="actions">
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </Button>
        </div>
      </div>

      {/* KPI SUMMARY STRIP */}
      <div className="finance-kpi-strip">
        <div className="fin-kpi-card">
          <div className="fin-kpi-icon" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
            <FaChartLine />
          </div>
          <div className="fin-kpi-body">
            <span className="fin-kpi-label">Annual Dep. Rate</span>
            <strong className="fin-kpi-value">
              {annualDepRate}{typeof annualDepRate === "string" && annualDepRate !== "Variable" ? "%" : annualDepRate === "Variable" ? "" : "%"}
            </strong>
            <span className="fin-kpi-sub">{settings.depreciationMethod}</span>
          </div>
        </div>

        <div className="fin-kpi-card">
          <div className="fin-kpi-icon" style={{ background: "#e8f5e9", color: "#2e7d32" }}>
            <FaRupeeSign />
          </div>
          <div className="fin-kpi-body">
            <span className="fin-kpi-label">CapEx Threshold</span>
            <strong className="fin-kpi-value">₹{fmt(settings.capexThreshold)}</strong>
            <span className="fin-kpi-sub">Assets above this are capitalised</span>
          </div>
        </div>

        <div className="fin-kpi-card">
          <div className="fin-kpi-icon" style={{ background: "#fff3e0", color: "#e65100" }}>
            <FaCalculator />
          </div>
          <div className="fin-kpi-body">
            <span className="fin-kpi-label">Est. Year 1 Dep. (per ₹1L)</span>
            <strong className="fin-kpi-value">₹{fmt(year1DepOn1L)}</strong>
            <span className="fin-kpi-sub">{settings.salvageValuePercent}% salvage · {lifeYears.toFixed(1)} yr life</span>
          </div>
        </div>

        <div className="fin-kpi-card">
          <div className="fin-kpi-icon" style={{ background: "#ede7f6", color: "#6a1b9a" }}>
            <FaCalendarAlt />
          </div>
          <div className="fin-kpi-body">
            <span className="fin-kpi-label">Fiscal Year</span>
            <strong className="fin-kpi-value" style={{ fontSize: "16px" }}>{settings.fiscalYearStart} – {fiscalYearEnd}</strong>
            <span className="fin-kpi-sub">{settings.currency} · Indian Format</span>
          </div>
        </div>
      </div>

      <div className="finance-sections">

        {/* ─── SECTION 1: Fiscal & Currency ─── */}
        <div className="card fin-section">
          <div className="fin-section-header">
            <FaCalendarAlt className="fin-section-icon" />
            <div>
              <div className="card-title">Fiscal & Currency Settings</div>
              <div className="fin-section-desc">Define the reporting year boundaries and functional currency.</div>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Fiscal Year Start Month</label>
              <select
                value={settings.fiscalYearStart}
                onChange={(e) => setSettings((p) => ({ ...p, fiscalYearStart: e.target.value }))}
              >
                {MONTHS.map((m) => <option key={m}>{m}</option>)}
              </select>
              <span className="form-hint">Fiscal year runs {settings.fiscalYearStart} – {fiscalYearEnd}</span>
            </div>
            <div className="form-group">
              <label>Functional Currency</label>
              <input type="text" value="INR – Indian Rupee (₹)" disabled />
              <span className="form-hint">Currency is fixed to INR for this organisation</span>
            </div>
            <div className="form-group">
              <label>Number Format</label>
              <input type="text" value="Indian (e.g. 1,00,000)" disabled />
              <span className="form-hint">Lakh/crore grouping applied across all reports</span>
            </div>
          </div>
        </div>

        {/* ─── SECTION 2: Depreciation Policy ─── */}
        <div className="card fin-section">
          <div className="fin-section-header">
            <FaChartLine className="fin-section-icon" />
            <div>
              <div className="card-title">Depreciation Policy</div>
              <div className="fin-section-desc">Control how asset value reduces over its useful life.</div>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Depreciation Method</label>
              <select
                value={settings.depreciationMethod}
                onChange={(e) => setSettings((p) => ({ ...p, depreciationMethod: e.target.value }))}
              >
                <option>Straight Line</option>
                <option>Declining Balance</option>
                <option>Units of Production</option>
              </select>
            </div>
            <div className="form-group">
              <label>Default Useful Life (months)</label>
              <input
                type="number" min="6" max="240"
                value={settings.defaultUsefulLife}
                onChange={(e) => setSettings((p) => ({ ...p, defaultUsefulLife: Number(e.target.value) }))}
              />
              <span className="form-hint">{lifeYears.toFixed(1)} years · applied when not set per asset</span>
            </div>
            <div className="form-group">
              <label>Salvage Value (%)</label>
              <div className="input-with-suffix">
                <input
                  type="number" min="0" max="50"
                  value={settings.salvageValuePercent}
                  onChange={(e) => setSettings((p) => ({ ...p, salvageValuePercent: Number(e.target.value) }))}
                />
                <span className="input-suffix">%</span>
              </div>
              <span className="form-hint">Residual value retained after full depreciation</span>
            </div>
          </div>

          {/* Method info callout */}
          <div className="fin-method-callout">
            <FaInfoCircle className="fin-callout-icon" />
            <span>{METHOD_INFO[settings.depreciationMethod]}</span>
          </div>
        </div>

        {/* ─── SECTION 3: Capitalisation Policy ─── */}
        <div className="card fin-section">
          <div className="fin-section-header">
            <FaShieldAlt className="fin-section-icon" />
            <div>
              <div className="card-title">Capitalisation Policy</div>
              <div className="fin-section-desc">Set thresholds that determine CapEx vs OpEx treatment of purchases.</div>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>CapEx Threshold (₹)</label>
              <div className="input-with-prefix">
                <span className="input-prefix">₹</span>
                <input
                  type="number" min="0"
                  value={settings.capexThreshold}
                  onChange={(e) => setSettings((p) => ({ ...p, capexThreshold: Number(e.target.value) }))}
                />
              </div>
              <span className="form-hint">Purchases ≥ ₹{fmt(settings.capexThreshold)} are capitalised as fixed assets</span>
            </div>
            <div className="form-group">
              <label>OpEx Treatment</label>
              <input type="text" value={`Below ₹${fmt(settings.capexThreshold)}`} disabled />
              <span className="form-hint">Purchases below threshold are expensed immediately</span>
            </div>
            <div className="form-group">
              <label>Depreciation Basis</label>
              <input type="text" value="Purchase Price" disabled />
              <span className="form-hint">Gross cost used as depreciation base for all assets</span>
            </div>
          </div>

          {/* CapEx visual indicator */}
          <div className="fin-capex-band">
            <div className="fin-capex-label">
              <span className="fin-opex-tag">OpEx</span>
              <span>₹0 → ₹{fmt(settings.capexThreshold - 1)}</span>
            </div>
            <div className="fin-capex-divider" />
            <div className="fin-capex-label">
              <span className="fin-capex-tag">CapEx</span>
              <span>₹{fmt(settings.capexThreshold)} and above</span>
            </div>
          </div>
        </div>

        {/* ─── SECTION 4: Depreciation Calculator ─── */}
        <div className="card fin-section">
          <div className="fin-section-header">
            <FaCalculator className="fin-section-icon" />
            <div>
              <div className="card-title">Depreciation Calculator</div>
              <div className="fin-section-desc">Preview the depreciation schedule for any asset cost using your current policy.</div>
            </div>
            <button
              className="fin-calc-toggle"
              onClick={() => setShowCalc((s) => !s)}
            >
              {showCalc ? "Hide" : "Open Calculator"}
            </button>
          </div>

          {showCalc && (
            <div className="fin-calc-body">
              <div className="fin-calc-input-row">
                <div className="form-group" style={{ maxWidth: 260 }}>
                  <label>Asset Purchase Cost (₹)</label>
                  <div className="input-with-prefix">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number" min="0"
                      value={calcCost}
                      onChange={(e) => setCalcCost(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="fin-calc-summary">
                  <div className="fin-calc-badge">
                    <span>Method</span><strong>{settings.depreciationMethod}</strong>
                  </div>
                  <div className="fin-calc-badge">
                    <span>Life</span><strong>{lifeYears.toFixed(1)} yrs</strong>
                  </div>
                  <div className="fin-calc-badge">
                    <span>Salvage</span><strong>{settings.salvageValuePercent}%  (₹{fmt(Math.round(calcCost * salvage))})</strong>
                  </div>
                </div>
              </div>

              {depSchedule.length > 0 && (
                <div className="fin-calc-table-wrap">
                  <table className="fin-calc-table">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Annual Depreciation</th>
                        <th>Book Value (EOY)</th>
                        <th>% Written Off</th>
                      </tr>
                    </thead>
                    <tbody>
                      {depSchedule.map((row) => {
                        const pctWritten = (((calcCost - row.bookValue) / calcCost) * 100).toFixed(1);
                        const barWidth = Math.min(pctWritten, 100);
                        return (
                          <tr key={row.year}>
                            <td className="fin-calc-yr">Year {row.year}</td>
                            <td>₹{fmt(Math.round(row.depreciation))}</td>
                            <td>₹{fmt(Math.round(row.bookValue))}</td>
                            <td>
                              <div className="fin-dep-bar-wrap">
                                <div className="fin-dep-bar" style={{ width: `${barWidth}%` }} />
                                <span>{pctWritten}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* BOTTOM SAVE */}
      <div className="fin-bottom-actions">
        <div className="fin-last-saved-note">
          <FaCog style={{ opacity: 0.5, marginRight: 6 }} />
          Settings apply to all newly created asset records. Existing assets retain their individual values.
        </div>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
