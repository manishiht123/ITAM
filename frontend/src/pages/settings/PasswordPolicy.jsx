import { useState } from "react";
import "./PasswordPolicy.css";

export default function PasswordPolicy() {
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

  return (
    <div className="password-page">
      <div className="password-header">
        <div>
          <h1>Password Policy</h1>
          <p>Define credential complexity, rotation, and lockout controls.</p>
        </div>
        <div className="actions">
          <button
            className="asset-action-btn primary"
            onClick={() => {
              localStorage.setItem("passwordPolicy", JSON.stringify(policy));
              alert("Password policy saved.");
            }}
          >
            Save Policy
          </button>
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
