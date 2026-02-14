import { useEffect, useState } from "react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Button, LoadingOverlay } from "../../components/ui";
import "./PasswordPolicy.css";

export default function PasswordPolicy() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState({
    minLength: 10,
    requireUpper: true,
    requireLower: true,
    requireNumber: true,
    requireSpecial: true,
    expiryDays: 90,
    reuseLimit: 5,
    lockoutAttempts: 5
  });

  useEffect(() => {
    const load = async () => {
      try {
        const prefs = await api.getSystemPreferences();
        setPolicy((prev) => ({
          ...prev,
          minLength: prefs.passwordMinLength ?? prev.minLength,
          requireUpper: prefs.passwordRequireUpper ?? prev.requireUpper,
          requireLower: prefs.passwordRequireLower ?? prev.requireLower,
          requireNumber: prefs.passwordRequireNumber ?? prev.requireNumber,
          requireSpecial: prefs.passwordRequireSpecial ?? prev.requireSpecial,
          expiryDays: prefs.passwordExpiryDays ?? prev.expiryDays,
          reuseLimit: prefs.passwordReuseLimit ?? prev.reuseLimit,
          lockoutAttempts: prefs.passwordLockoutAttempts ?? prev.lockoutAttempts
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
        passwordMinLength: policy.minLength,
        passwordRequireUpper: policy.requireUpper,
        passwordRequireLower: policy.requireLower,
        passwordRequireNumber: policy.requireNumber,
        passwordRequireSpecial: policy.requireSpecial,
        passwordExpiryDays: policy.expiryDays,
        passwordReuseLimit: policy.reuseLimit,
        passwordLockoutAttempts: policy.lockoutAttempts
      });
      toast.success("Password policy saved.");
    } catch (err) {
      toast.error(err.message || "Failed to save password policy.");
    }
  };

  if (loading) {
    return (
      <div className="password-page">
        <LoadingOverlay visible message="Loading password policy..." />
      </div>
    );
  }

  return (
    <div className="password-page">
      <div className="password-header">
        <div>
          <h1>Password Policy</h1>
          <p>Define credential complexity, rotation, and lockout controls.</p>
        </div>
        <div className="actions">
          <Button variant="primary" onClick={handleSave}>
            Save Policy
          </Button>
        </div>
      </div>

      <div className="password-grid">
        <div className="card">
          <div className="card-title">Complexity Rules</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Minimum Length</label>
              <input
                type="number"
                min="6"
                value={policy.minLength}
                onChange={(e) =>
                  setPolicy((prev) => ({ ...prev, minLength: Number(e.target.value) }))
                }
              />
            </div>
            <div className="form-group">
              <label>Password Expiry (days)</label>
              <input
                type="number"
                min="0"
                value={policy.expiryDays}
                onChange={(e) =>
                  setPolicy((prev) => ({ ...prev, expiryDays: Number(e.target.value) }))
                }
              />
            </div>
            <div className="form-group">
              <label>Password Reuse Limit</label>
              <input
                type="number"
                min="0"
                value={policy.reuseLimit}
                onChange={(e) =>
                  setPolicy((prev) => ({ ...prev, reuseLimit: Number(e.target.value) }))
                }
              />
            </div>
            <div className="form-group">
              <label>Lockout Attempts</label>
              <input
                type="number"
                min="1"
                value={policy.lockoutAttempts}
                onChange={(e) =>
                  setPolicy((prev) => ({ ...prev, lockoutAttempts: Number(e.target.value) }))
                }
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Required Character Sets</div>
          <div className="form-grid">
            <label className="toggle-row">
              <span>Require Uppercase Letters</span>
              <input
                type="checkbox"
                checked={policy.requireUpper}
                onChange={() => setPolicy((prev) => ({ ...prev, requireUpper: !prev.requireUpper }))}
              />
            </label>
            <label className="toggle-row">
              <span>Require Lowercase Letters</span>
              <input
                type="checkbox"
                checked={policy.requireLower}
                onChange={() => setPolicy((prev) => ({ ...prev, requireLower: !prev.requireLower }))}
              />
            </label>
            <label className="toggle-row">
              <span>Require Numbers</span>
              <input
                type="checkbox"
                checked={policy.requireNumber}
                onChange={() => setPolicy((prev) => ({ ...prev, requireNumber: !prev.requireNumber }))}
              />
            </label>
            <label className="toggle-row">
              <span>Require Special Characters</span>
              <input
                type="checkbox"
                checked={policy.requireSpecial}
                onChange={() => setPolicy((prev) => ({ ...prev, requireSpecial: !prev.requireSpecial }))}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
