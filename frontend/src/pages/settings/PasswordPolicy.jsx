import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Button, LoadingOverlay } from "../../components/ui";
import "./PasswordPolicy.css";

const COMPLIANCE_BADGES = ["NIST SP 800-63B", "ISO 27001 A.9.4", "PCI-DSS 8.3", "SOC 2 CC6.1"];

export default function PasswordPolicy() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState({
    minLength: 12,
    maxLength: 128,
    requireUpper: true,
    requireLower: true,
    requireNumber: true,
    requireSpecial: true,
    expiryDays: 90,
    reuseLimit: 12,
    lockoutAttempts: 5,
    lockoutDurationMins: 15,
  });

  // Domain restriction state
  const [domains, setDomains] = useState([]);   // ["company.com", "subsidiary.org"]
  const [domainInput, setDomainInput] = useState("");
  const [domainError, setDomainError] = useState("");
  const domainInputRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const prefs = await api.getSystemPreferences();
        setPolicy((prev) => ({
          ...prev,
          minLength:           prefs.passwordMinLength            ?? prev.minLength,
          maxLength:           prefs.passwordMaxLength             ?? prev.maxLength,
          requireUpper:        prefs.passwordRequireUpper          ?? prev.requireUpper,
          requireLower:        prefs.passwordRequireLower          ?? prev.requireLower,
          requireNumber:       prefs.passwordRequireNumber         ?? prev.requireNumber,
          requireSpecial:      prefs.passwordRequireSpecial        ?? prev.requireSpecial,
          expiryDays:          prefs.passwordExpiryDays            ?? prev.expiryDays,
          reuseLimit:          prefs.passwordReuseLimit            ?? prev.reuseLimit,
          lockoutAttempts:     prefs.passwordLockoutAttempts       ?? prev.lockoutAttempts,
          lockoutDurationMins: prefs.passwordLockoutDurationMins   ?? prev.lockoutDurationMins,
        }));
        // Load allowed domains
        const raw = prefs.allowedLoginDomains ?? "";
        setDomains(raw ? raw.split(",").map((d) => d.trim()).filter(Boolean) : []);
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const set = (key, value) => setPolicy((prev) => ({ ...prev, [key]: value }));

  // Domain helpers
  const addDomain = () => {
    const raw = domainInput.trim().toLowerCase().replace(/^@/, "");
    if (!raw) return;
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(raw)) {
      setDomainError("Enter a valid domain (e.g. company.com)");
      return;
    }
    if (domains.includes(raw)) {
      setDomainError("Domain already added");
      return;
    }
    setDomains((prev) => [...prev, raw]);
    setDomainInput("");
    setDomainError("");
    domainInputRef.current?.focus();
  };

  const removeDomain = (d) => setDomains((prev) => prev.filter((x) => x !== d));

  const handleDomainKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addDomain(); }
    if (e.key === "Backspace" && !domainInput && domains.length > 0) {
      setDomains((prev) => prev.slice(0, -1));
    }
  };

  const handleSave = async () => {
    if (policy.minLength < 8) { toast.warning("Minimum length cannot be less than 8 (compliance requirement)."); return; }
    if (policy.minLength > policy.maxLength) { toast.warning("Minimum length cannot exceed maximum length."); return; }
    if (policy.lockoutAttempts < 3) { toast.warning("Lockout attempts must be at least 3."); return; }
    try {
      await api.updateSystemPreferences({
        passwordMinLength:           policy.minLength,
        passwordMaxLength:           policy.maxLength,
        passwordRequireUpper:        policy.requireUpper,
        passwordRequireLower:        policy.requireLower,
        passwordRequireNumber:       policy.requireNumber,
        passwordRequireSpecial:      policy.requireSpecial,
        passwordExpiryDays:          policy.expiryDays,
        passwordReuseLimit:          policy.reuseLimit,
        passwordLockoutAttempts:     policy.lockoutAttempts,
        passwordLockoutDurationMins: policy.lockoutDurationMins,
        allowedLoginDomains:         domains.join(","),
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
          <div className="pp-compliance-badges">
            {COMPLIANCE_BADGES.map((b) => (
              <span key={b} className="pp-badge">{b}</span>
            ))}
          </div>
        </div>
        <div className="actions">
          <Button variant="primary" onClick={handleSave}>Save Policy</Button>
        </div>
      </div>

      <div className="password-grid">

        {/* ── Complexity ── */}
        <div className="card">
          <div className="card-title">Complexity Rules</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Minimum Length <span className="pp-hint">NIST: ≥12</span></label>
              <input type="number" min="8" max={policy.maxLength}
                value={policy.minLength}
                onChange={(e) => set("minLength", Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Maximum Length <span className="pp-hint">NIST: 128</span></label>
              <input type="number" min={policy.minLength} max="256"
                value={policy.maxLength}
                onChange={(e) => set("maxLength", Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Password Expiry (days) <span className="pp-hint">ISO: 90</span></label>
              <input type="number" min="0"
                value={policy.expiryDays}
                onChange={(e) => set("expiryDays", Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Password Reuse Limit <span className="pp-hint">PCI-DSS: ≥12</span></label>
              <input type="number" min="0"
                value={policy.reuseLimit}
                onChange={(e) => set("reuseLimit", Number(e.target.value))} />
            </div>
          </div>
        </div>

        {/* ── Lockout ── */}
        <div className="card">
          <div className="card-title">Account Lockout</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Failed Attempts Before Lockout <span className="pp-hint">PCI-DSS: ≤6</span></label>
              <input type="number" min="3" max="10"
                value={policy.lockoutAttempts}
                onChange={(e) => set("lockoutAttempts", Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Lockout Duration (minutes) <span className="pp-hint">ISO: ≥15</span></label>
              <input type="number" min="1"
                value={policy.lockoutDurationMins}
                onChange={(e) => set("lockoutDurationMins", Number(e.target.value))} />
            </div>
          </div>
          <p className="pp-info">
            After the specified failed attempts the account is automatically locked for the configured duration. Each lockout event is recorded in the audit trail.
          </p>
        </div>

        {/* ── Character Sets ── */}
        <div className="card">
          <div className="card-title">Required Character Sets</div>
          <div className="form-grid">
            {[
              { key: "requireUpper",   label: "Uppercase Letters (A-Z)" },
              { key: "requireLower",   label: "Lowercase Letters (a-z)" },
              { key: "requireNumber",  label: "Numbers (0-9)" },
              { key: "requireSpecial", label: "Special Characters (!@#$…)" },
            ].map(({ key, label }) => (
              <label key={key} className="toggle-row">
                <span>{label}</span>
                <input type="checkbox" checked={policy[key]}
                  onChange={() => set(key, !policy[key])} />
              </label>
            ))}
          </div>
        </div>

        {/* ── Domain Restrictions ── */}
        <div className="card pp-domain-card">
          <div className="card-title">Domain Restrictions</div>
          <p className="pp-info" style={{ marginTop: 0, marginBottom: 16 }}>
            Restrict logins to specific email domains. Leave empty to allow all domains.
            Works for both email/password and Google sign-in.
          </p>
          <div
            className={`pp-domain-input-box${domainError ? " pp-domain-input-box--error" : ""}`}
            onClick={() => domainInputRef.current?.focus()}
          >
            {domains.map((d) => (
              <span key={d} className="pp-domain-chip">
                {d}
                <button
                  type="button"
                  className="pp-domain-chip-remove"
                  onClick={(e) => { e.stopPropagation(); removeDomain(d); }}
                  aria-label={`Remove ${d}`}
                >×</button>
              </span>
            ))}
            <input
              ref={domainInputRef}
              className="pp-domain-text-input"
              value={domainInput}
              onChange={(e) => { setDomainInput(e.target.value); setDomainError(""); }}
              onKeyDown={handleDomainKeyDown}
              onBlur={addDomain}
              placeholder={domains.length === 0 ? "e.g. company.com — press Enter or comma to add" : "Add domain…"}
            />
          </div>
          {domainError && <p className="pp-domain-error">{domainError}</p>}
          <p className="pp-domain-hint">
            {domains.length === 0
              ? "All email domains are currently permitted."
              : `Only users with @${domains.join(", @")} addresses can log in.`}
          </p>
        </div>

        {/* ── Live compliance summary ── */}
        <div className="card pp-summary-card">
          <div className="card-title">Compliance Summary</div>
          <div className="pp-summary-grid">
            {[
              { label: "Min Length",       value: `${policy.minLength} chars`,          ok: policy.minLength >= 12 },
              { label: "Max Length",       value: `${policy.maxLength} chars`,          ok: policy.maxLength >= 64 },
              { label: "Uppercase",        value: policy.requireUpper   ? "Required" : "Optional", ok: policy.requireUpper },
              { label: "Lowercase",        value: policy.requireLower   ? "Required" : "Optional", ok: policy.requireLower },
              { label: "Numbers",          value: policy.requireNumber  ? "Required" : "Optional", ok: policy.requireNumber },
              { label: "Special Chars",    value: policy.requireSpecial ? "Required" : "Optional", ok: policy.requireSpecial },
              { label: "Expiry",           value: policy.expiryDays === 0 ? "Never" : `${policy.expiryDays} days`, ok: policy.expiryDays > 0 && policy.expiryDays <= 90 },
              { label: "Reuse Prevention", value: `Last ${policy.reuseLimit}`,           ok: policy.reuseLimit >= 12 },
              { label: "Lockout After",    value: `${policy.lockoutAttempts} attempts`,  ok: policy.lockoutAttempts <= 6 },
              { label: "Lockout Duration", value: `${policy.lockoutDurationMins} min`,   ok: policy.lockoutDurationMins >= 15 },
            ].map(({ label, value, ok }) => (
              <div key={label} className="pp-summary-row">
                <span className="pp-summary-label">{label}</span>
                <span className="pp-summary-value">{value}</span>
                <span className={`pp-summary-status ${ok ? "ok" : "warn"}`}>{ok ? "✓" : "⚠"}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
