import { useEffect, useState, useCallback } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import api from "../../services/api";
import { Button } from "../../components/ui";
import "./SystemPreferences.css";

// Capitalise first letter so it matches the select option values ("Light" / "Dark")
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function SystemPreferences() {
  const { theme: currentTheme, setTheme } = useTheme();
  const toast = useToast();
  const [prefs, setPrefs] = useState({
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    // Initialise from the live ThemeContext value so navigating here never flips the theme
    theme: capitalize(currentTheme === "system" ? "light" : currentTheme),
    language: "English",
    autoBackupEnabled: false,
    backupFrequency: "daily",
    backupTime: "02:00",
    backupRetentionDays: 30,
    backupType: "both",
    backupLocation: "./backups"
  });
  const [backups, setBackups] = useState([]);
  const [backingUp, setBackingUp] = useState(false);

  const loadBackups = useCallback(async () => {
    try {
      const data = await api.getBackups();
      setBackups(Array.isArray(data) ? data : []);
    } catch {
      // backups list not critical
    }
  }, []);

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
          autoBackupEnabled: serverPrefs.autoBackupEnabled ?? prev.autoBackupEnabled,
          backupFrequency: serverPrefs.backupFrequency ?? prev.backupFrequency,
          backupTime: serverPrefs.backupTime ?? prev.backupTime,
          backupRetentionDays: serverPrefs.backupRetentionDays ?? prev.backupRetentionDays,
          backupType: serverPrefs.backupType ?? prev.backupType,
          backupLocation: serverPrefs.backupLocation ?? prev.backupLocation
        }));
      } catch (err) {
        console.error("Failed to load system preferences", err);
      }
    };
    loadServerPrefs();
    loadBackups();
  }, [loadBackups]);

  const handleSave = async () => {
    localStorage.setItem("systemPreferences", JSON.stringify(prefs));
    try {
      await api.updateSystemPreferences({
        autoBackupEnabled: prefs.autoBackupEnabled,
        backupFrequency: prefs.backupFrequency,
        backupTime: prefs.backupTime,
        backupRetentionDays: prefs.backupRetentionDays,
        backupType: prefs.backupType,
        backupLocation: prefs.backupLocation
      });
      toast.success("Preferences saved.");
    } catch (err) {
      toast.error(err.message || "Failed to save preferences.");
    }
  };

  const handleBackupNow = async () => {
    setBackingUp(true);
    try {
      const result = await api.runBackup({
        backupType: prefs.backupType,
        backupLocation: prefs.backupLocation
      });
      toast.success(result.message || "Backup completed successfully!");
      loadBackups();
    } catch (err) {
      toast.error(err.message || "Backup failed.");
    } finally {
      setBackingUp(false);
    }
  };

  const handleDeleteBackup = async (filename) => {
    try {
      await api.deleteBackup(filename);
      toast.success("Backup deleted.");
      loadBackups();
    } catch (err) {
      toast.error(err.message || "Failed to delete backup.");
    }
  };

  const formatSize = (size, type) => {
    if (type === "csv") return `${size} tables`;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="system-page">
      <div className="system-header">
        <div>
          <h1>System Preferences</h1>
          <p>Global preferences for localization and backups.</p>
        </div>
        <div className="actions">
          <Button variant="primary" onClick={handleSave}>
            Save Preferences
          </Button>
        </div>
      </div>

      <div className="system-grid">
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
              </select>
            </div>
            <div className="form-group">
              <label>Theme</label>
              <select
                value={prefs.theme}
                onChange={(e) => {
                  const val = e.target.value;
                  setPrefs((prev) => ({ ...prev, theme: val }));
                  setTheme(val.toLowerCase());
                }}
              >
                <option>Light</option>
                <option>Dark</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Backup Configuration</div>
          <label className="toggle-row" style={{ marginBottom: 14 }}>
            <span>Enable Auto Backups</span>
            <input
              type="checkbox"
              checked={prefs.autoBackupEnabled}
              onChange={() => setPrefs((prev) => ({ ...prev, autoBackupEnabled: !prev.autoBackupEnabled }))}
            />
          </label>

          <div className="form-grid two-col">
            <div className="form-group">
              <label>Backup Type</label>
              <select
                value={prefs.backupType}
                onChange={(e) => setPrefs((prev) => ({ ...prev, backupType: e.target.value }))}
              >
                <option value="database">Database (MySQL Dump)</option>
                <option value="csv">CSV Export (All Tables)</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="form-group">
              <label>Backup Location</label>
              <input
                type="text"
                value={prefs.backupLocation}
                onChange={(e) => setPrefs((prev) => ({ ...prev, backupLocation: e.target.value }))}
                placeholder="./backups"
              />
            </div>
          </div>

          {prefs.autoBackupEnabled && (
            <div className="form-grid three-col" style={{ marginTop: 14 }}>
              <div className="form-group">
                <label>Frequency</label>
                <select
                  value={prefs.backupFrequency}
                  onChange={(e) => setPrefs((prev) => ({ ...prev, backupFrequency: e.target.value }))}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="form-group">
                <label>Backup Time</label>
                <input
                  type="time"
                  value={prefs.backupTime}
                  onChange={(e) => setPrefs((prev) => ({ ...prev, backupTime: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Retention (days)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={prefs.backupRetentionDays}
                  onChange={(e) => setPrefs((prev) => ({
                    ...prev,
                    backupRetentionDays: Number(e.target.value || 1)
                  }))}
                />
              </div>
            </div>
          )}

          <div className="backup-actions">
            <Button
              variant="secondary"
              onClick={handleBackupNow}
              disabled={backingUp}
            >
              {backingUp ? "Backing up..." : "Backup Now"}
            </Button>
            <p className="card-hint" style={{ margin: 0 }}>
              {prefs.backupType === "both"
                ? "Creates a MySQL database dump and CSV export of all tables."
                : prefs.backupType === "database"
                  ? "Creates a MySQL database dump (.sql file)."
                  : "Exports all tables as CSV files."}
            </p>
          </div>
        </div>

        {backups.length > 0 && (
          <div className="card">
            <div className="card-title">Backup History</div>
            <table className="backup-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => (
                  <tr key={b.filename}>
                    <td>{b.filename}</td>
                    <td>
                      <span className={`backup-type-badge ${b.type}`}>
                        {b.type === "database" ? "SQL Dump" : "CSV Export"}
                      </span>
                    </td>
                    <td>{formatSize(b.size, b.type)}</td>
                    <td>{new Date(b.created).toLocaleString()}</td>
                    <td>
                      <button
                        className="action-link danger"
                        onClick={() => handleDeleteBackup(b.filename)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
