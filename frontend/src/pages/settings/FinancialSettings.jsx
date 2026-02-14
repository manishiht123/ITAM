import { useEffect, useState } from "react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Button, LoadingOverlay } from "../../components/ui";
import "./FinancialSettings.css";

export default function FinancialSettings() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    fiscalYearStart: "April",
    currency: "INR",
    depreciationMethod: "Straight Line",
    defaultUsefulLife: 36,
    salvageValuePercent: 5,
    capexThreshold: 50000
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
          capexThreshold: prefs.capexThreshold ?? prev.capexThreshold
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
    try {
      await api.updateSystemPreferences({
        fiscalYearStart: settings.fiscalYearStart,
        depreciationMethod: settings.depreciationMethod,
        defaultUsefulLife: settings.defaultUsefulLife,
        salvageValuePercent: settings.salvageValuePercent,
        capexThreshold: settings.capexThreshold
      });
      toast.success("Financial settings saved.");
    } catch (err) {
      toast.error(err.message || "Failed to save financial settings.");
    }
  };

  if (loading) {
    return (
      <div className="finance-page">
        <LoadingOverlay visible message="Loading financial settings..." />
      </div>
    );
  }

  return (
    <div className="finance-page">
      <div className="finance-header">
        <div>
          <h1>Financial Settings</h1>
          <p>Configure depreciation, capitalization, and reporting preferences.</p>
        </div>
        <div className="actions">
          <Button variant="primary" onClick={handleSave}>
            Save Settings
          </Button>
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
              <input type="text" value="INR" disabled />
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
      </div>
    </div>
  );
}
