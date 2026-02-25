import { useState, useEffect } from "react";
import api from "../services/api";
import "./ChangePassword.css";
import { Button } from "../components/ui";
import { useToast } from "../context/ToastContext";
import { FiEye, FiEyeOff, FiCheck, FiX } from "react-icons/fi";

// Default policy — overridden by API on mount
const DEFAULT_POLICY = {
  minLength: 12,
  maxLength: 128,
  requireUpper: true,
  requireLower: true,
  requireNumber: true,
  requireSpecial: true,
};

function buildRules(policy) {
  return [
    { id: "len",     label: `At least ${policy.minLength} characters`,     test: (p) => p.length >= policy.minLength },
    { id: "upper",   label: "One uppercase letter (A-Z)",                   test: (p) => /[A-Z]/.test(p),           skip: !policy.requireUpper },
    { id: "lower",   label: "One lowercase letter (a-z)",                   test: (p) => /[a-z]/.test(p),           skip: !policy.requireLower },
    { id: "number",  label: "One number (0-9)",                             test: (p) => /[0-9]/.test(p),           skip: !policy.requireNumber },
    { id: "special", label: "One special character (!@#$…)",               test: (p) => /[!@#$%^&*()\-_=+[\]{};':",.<>/?\\|`~]/.test(p), skip: !policy.requireSpecial },
  ].filter((r) => !r.skip);
}

function getStrength(password, rules) {
  if (!password) return 0;
  const passed = rules.filter((r) => r.test(password)).length;
  const ratio = passed / rules.length;
  if (ratio < 0.4) return 1; // Weak
  if (ratio < 0.7) return 2; // Fair
  if (ratio < 1.0) return 3; // Good
  // Bonus: longer passwords are Stronger
  return password.length >= 16 ? 5 : 4;  // Strong / Very Strong
}

const STRENGTH_LABEL = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
const STRENGTH_COLOR = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

export default function ChangePassword() {
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [policy, setPolicy] = useState(DEFAULT_POLICY);
  const [rules, setRules] = useState(() => buildRules(DEFAULT_POLICY));

  useEffect(() => {
    api.getSystemPreferences().then((prefs) => {
      const p = {
        minLength:      prefs.passwordMinLength      ?? DEFAULT_POLICY.minLength,
        maxLength:      prefs.passwordMaxLength       ?? DEFAULT_POLICY.maxLength,
        requireUpper:   prefs.passwordRequireUpper    ?? DEFAULT_POLICY.requireUpper,
        requireLower:   prefs.passwordRequireLower    ?? DEFAULT_POLICY.requireLower,
        requireNumber:  prefs.passwordRequireNumber   ?? DEFAULT_POLICY.requireNumber,
        requireSpecial: prefs.passwordRequireSpecial  ?? DEFAULT_POLICY.requireSpecial,
      };
      setPolicy(p);
      setRules(buildRules(p));
    }).catch(() => {});
  }, []);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const toggleShow = (key) => setShow((prev) => ({ ...prev, [key]: !prev[key] }));

  const strength = getStrength(form.newPassword, rules);
  const allRulesPassed = rules.every((r) => r.test(form.newPassword));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      toast.warning("Please fill all fields.");
      return;
    }
    if (!allRulesPassed) {
      toast.warning("New password does not meet the security requirements.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.warning("New password and confirm password do not match.");
      return;
    }
    if (form.newPassword === form.currentPassword) {
      toast.warning("New password must be different from the current password.");
      return;
    }
    const storedUser = JSON.parse(localStorage.getItem("authUser") || "{}");
    if (!storedUser?.email || !storedUser?.id) {
      toast.error("User session not found. Please log in again.");
      return;
    }
    try {
      const loginResult = await api.login({ email: storedUser.email, password: form.currentPassword });
      if (loginResult?.token) localStorage.setItem("authToken", loginResult.token);
      await api.updateUser(storedUser.id, { password: form.newPassword });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password updated successfully.");
    } catch (err) {
      toast.error(err.message || "Password update failed.");
    }
  };

  return (
    <div className="change-password-page">
      <div className="change-password-header">
        <h1>Change Password</h1>
        <p>Update your account password. Must meet the security requirements below.</p>
      </div>

      <form className="change-password-card" onSubmit={handleSubmit}>

        {/* Current password */}
        <div className="form-group">
          <label>Current Password</label>
          <div className="pw-input-wrap">
            <input
              type={show.current ? "text" : "password"}
              value={form.currentPassword}
              onChange={(e) => update("currentPassword", e.target.value)}
              placeholder="Enter current password"
            />
            <button type="button" className="pw-eye" onClick={() => toggleShow("current")} tabIndex={-1}>
              {show.current ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
        </div>

        {/* New password */}
        <div className="form-group">
          <label>New Password</label>
          <div className="pw-input-wrap">
            <input
              type={show.new ? "text" : "password"}
              value={form.newPassword}
              onChange={(e) => update("newPassword", e.target.value)}
              placeholder={`Min ${policy.minLength} characters`}
              maxLength={policy.maxLength}
            />
            <button type="button" className="pw-eye" onClick={() => toggleShow("new")} tabIndex={-1}>
              {show.new ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>

          {/* Strength meter */}
          {form.newPassword && (
            <>
              <div className="pw-strength-bar">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div
                    key={lvl}
                    className="pw-strength-seg"
                    style={{ background: lvl <= strength ? STRENGTH_COLOR[strength] : "var(--border)" }}
                  />
                ))}
              </div>
              <span className="pw-strength-label" style={{ color: STRENGTH_COLOR[strength] }}>
                {STRENGTH_LABEL[strength]}
              </span>
            </>
          )}
        </div>

        {/* Requirements checklist — shown as soon as user starts typing */}
        {form.newPassword && (
          <div className="pw-checklist">
            <div className="pw-checklist-title">Password Requirements</div>
            {rules.map((rule) => {
              const ok = rule.test(form.newPassword);
              return (
                <div key={rule.id} className={`pw-check-row ${ok ? "ok" : "fail"}`}>
                  {ok ? <FiCheck size={13} /> : <FiX size={13} />}
                  <span>{rule.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Confirm password */}
        <div className="form-group">
          <label>Confirm New Password</label>
          <div className="pw-input-wrap">
            <input
              type={show.confirm ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              placeholder="Re-enter new password"
            />
            <button type="button" className="pw-eye" onClick={() => toggleShow("confirm")} tabIndex={-1}>
              {show.confirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
          {form.confirmPassword && form.newPassword !== form.confirmPassword && (
            <span className="pw-mismatch">Passwords do not match</span>
          )}
        </div>

        <div className="change-password-actions">
          <Button variant="primary" type="submit">Save Password</Button>
          <Button
            variant="secondary"
            type="button"
            onClick={() => setForm({ currentPassword: "", newPassword: "", confirmPassword: "" })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
