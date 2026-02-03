import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import api from "../../services/api";
import "./SystemPreferences.css";

export default function SystemPreferences() {
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState({
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    theme: "Light",
    language: "English",
    autoBackups: true,
    analytics: true,
    maintenanceMode: false,
    maxAssetsPerEmployee: 2,
    allocationWarningMessage: "This employee already has 1 asset allocated. Do you want to allow a second asset?"
  });

  useEffect(() => {
    const stored = localStorage.getItem("systemPreferences");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPrefs((prev) => ({ ...prev, ...parsed }));
      } catch (err) {
        console.error("Failed to parse system preferences", err);
      }
    }
    const loadServerPrefs = async () => {
      try {
        const serverPrefs = await api.getSystemPreferences();
        setPrefs((prev) => ({
          ...prev,
          maxAssetsPerEmployee: serverPrefs.maxAssetsPerEmployee ?? prev.maxAssetsPerEmployee,
          allocationWarningMessage: serverPrefs.allocationWarningMessage ?? prev.allocationWarningMessage
        }));
      } catch (err) {
        console.error("Failed to load system preferences", err);
      }
    };
    loadServerPrefs();
  }, []);

  useEffect(() => {
    const prefTheme = prefs.theme.toLowerCase();
    if (prefTheme === "light" || prefTheme === "dark" || prefTheme === "system") {
      setTheme(prefTheme);
    }
  }, [prefs.theme, setTheme]);

  return (
    <div className="system-page">
      <div className="system-header">
        <div>
          <h1>System Preferences</h1>
          <p>Global preferences for localization, backups, and operational controls.</p>
        </div>
        <div className="actions">
          <button
            className="asset-action-btn primary"
            onClick={async () => {
              localStorage.setItem("systemPreferences", JSON.stringify(prefs));
              try {
                await api.updateSystemPreferences({
                  maxAssetsPerEmployee: prefs.maxAssetsPerEmployee,
                  allocationWarningMessage: prefs.allocationWarningMessage
                });
                alert("Preferences saved.");
              } catch (err) {
                alert(err.message || "Failed to save preferences.");
              }
            }}
          >
            Save Preferences
          </button>
        </div>
      </div>

      <div className="system-grid">
        <div className="card">
          <div className="card-title">Asset Allocation Limits</div>
          <div className="form-grid two-col">
            <div className="form-group">
              <label>Max Assets Per Employee</label>
              <input
                type="number"
                min="1"
                value={prefs.maxAssetsPerEmployee}
                onChange={(e) => setPrefs((prev) => ({
                  ...prev,
                  maxAssetsPerEmployee: Number(e.target.value || 1)
                }))}
              />
            </div>
            <div className="form-group">
              <label>Allocation Warning Message</label>
              <textarea
                rows={3}
                value={prefs.allocationWarningMessage}
                onChange={(e) => setPrefs((prev) => ({
                  ...prev,
                  allocationWarningMessage: e.target.value
                }))}
              />
            </div>
          </div>
          <p className="card-hint">
            Applies to all entities. A warning is shown when assigning the second asset.
          </p>
        </div>

        <div className="card">
          <div className="card-title">Localization</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Timezone</label>
              <select
                value={prefs.timezone}
                onChange={(e) => setPrefs((prev) => ({ ...prev, timezone: e.target.value }))}
              >
                <option>Asia/Kolkata</option>
                <option>America/New_York</option>
                <option>Europe/London</option>
                <option>Asia/Dubai</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date Format</label>
              <select
                value={prefs.dateFormat}
                onChange={(e) => setPrefs((prev) => ({ ...prev, dateFormat: e.target.value }))}
              >
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
            <div className="form-group">
              <label>Language</label>
              <select
                value={prefs.language}
                onChange={(e) => setPrefs((prev) => ({ ...prev, language: e.target.value }))}
              >
                <option>English</option>
                <option>Hindi</option>
                <option>Arabic</option>
                <option>Spanish</option>
              </select>
            </div>
            <div className="form-group">
              <label>Theme</label>
              <select
                value={prefs.theme}
                onChange={(e) => setPrefs((prev) => ({ ...prev, theme: e.target.value }))}
              >
                <option>Light</option>
                <option>Dark</option>
                <option>System</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Operational Controls</div>
          <div className="toggles">
            <label className="toggle-row">
              <span>Enable Auto Backups</span>
              <input
                type="checkbox"
                checked={prefs.autoBackups}
                onChange={() => setPrefs((prev) => ({ ...prev, autoBackups: !prev.autoBackups }))}
              />
            </label>
            <label className="toggle-row">
              <span>Usage Analytics</span>
              <input
                type="checkbox"
                checked={prefs.analytics}
                onChange={() => setPrefs((prev) => ({ ...prev, analytics: !prev.analytics }))}
              />
            </label>
            <label className="toggle-row">
              <span>Maintenance Mode</span>
              <input
                type="checkbox"
                checked={prefs.maintenanceMode}
                onChange={() => setPrefs((prev) => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
