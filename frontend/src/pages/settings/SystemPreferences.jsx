import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/ui";
import "./SystemPreferences.css";

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function SystemPreferences() {
  const { theme: currentTheme, setTheme } = useTheme();
  const toast = useToast();
  const [prefs, setPrefs] = useState({
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    theme: capitalize(currentTheme === "system" ? "light" : currentTheme),
    language: "English",
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
  }, []);

  const handleSave = () => {
    localStorage.setItem("systemPreferences", JSON.stringify(prefs));
    toast.success("Preferences saved.");
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

      </div>
    </div>
  );
}
