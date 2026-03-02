import { useMemo, useState, useEffect } from "react";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui";
import "./Profile.css";

export default function Profile() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("authUser") || "{}");
    } catch (err) {
      return {};
    }
  }, []);

  // 2FA status
  const [twoFAStatus, setTwoFAStatus]       = useState(null);
  const [twoFALoading, setTwoFALoading]     = useState(true);
  const [twoFAResetting, setTwoFAResetting] = useState(false);

  useEffect(() => {
    api.get2FAStatus()
      .then((data) => setTwoFAStatus(data))
      .catch(() => setTwoFAStatus(null))
      .finally(() => setTwoFALoading(false));
  }, []);

  const handleReset2FA = async () => {
    if (!window.confirm("Reset 2FA for this account? The user will need to re-configure it on next login.")) return;
    setTwoFAResetting(true);
    try {
      await api.disable2FA(storedUser.id);
      toast.success("2FA has been reset. The user will set it up again on next login.");
      setTwoFAStatus({ twoFactorEnabled: false, twoFactorMethod: null });
    } catch (err) {
      toast.error(err.message || "Failed to reset 2FA.");
    } finally {
      setTwoFAResetting(false);
    }
  };

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: storedUser?.name?.split(" ")[0] || "",
    lastName: storedUser?.name?.split(" ").slice(1).join(" ") || "",
    title: storedUser?.title || "",
    phone: storedUser?.phone || "",
    email: storedUser?.email || "",
    confirmEmail: storedUser?.email || "",
    timezone: "Asia/Kolkata",
    dateFormat: "MM/dd/yyyy",
    timeFormat: "12-hour short - 09:58 PM"
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSaveProfile = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.confirmEmail) {
      toast.warning("Please complete required fields.");
      return;
    }
    if (form.email !== form.confirmEmail) {
      toast.warning("Email and Confirm Email do not match.");
      return;
    }
    const name = `${form.firstName} ${form.lastName}`.trim();
    setSaving(true);
    try {
      const updated = await api.updateProfile({
        name,
        email: form.email,
        phone: form.phone,
        title: form.title
      });
      const updatedUser = {
        ...storedUser,
        name: updated.name || name,
        email: updated.email || form.email,
        phone: updated.phone || form.phone,
        title: updated.title || form.title
      };
      localStorage.setItem("authUser", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("authUserUpdated"));
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>My Profile</h1>
      </div>

      <section className="profile-card">
        <div className="section-title">User Info.</div>
        <div className="profile-grid">
          <div className="form-group">
            <label>Firstname *</label>
            <input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Lastname *</label>
            <input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Title</label>
            <input value={form.title} onChange={(e) => update("title", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Confirm Email *</label>
            <input value={form.confirmEmail} onChange={(e) => update("confirmEmail", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="profile-card">
        <div className="section-title">Localization</div>
        <p className="section-subtitle">
          Adjust profile settings like timezone, date, and time format.
        </p>
        <div className="profile-grid two-col">
          <div className="form-group">
            <label>Timezone</label>
            <select value={form.timezone} onChange={(e) => update("timezone", e.target.value)}>
              <option>(GMT +5:30) Chennai, Kolkata, Mumbai, New Delhi</option>
              <option>(GMT -5:00) New York</option>
              <option>(GMT 0:00) London</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date Display format</label>
            <select value={form.dateFormat} onChange={(e) => update("dateFormat", e.target.value)}>
              <option>MM/dd/yyyy</option>
              <option>dd/MM/yyyy</option>
              <option>yyyy-MM-dd</option>
            </select>
          </div>
          <div className="form-group">
            <label>Time format</label>
            <select value={form.timeFormat} onChange={(e) => update("timeFormat", e.target.value)}>
              <option>12-hour short - 09:58 PM</option>
              <option>24-hour - 21:58</option>
            </select>
          </div>
        </div>
      </section>

      <section className="profile-card">
        <div className="section-title">User Photo</div>
        <p className="section-subtitle">Upload a photo to set yourself apart.</p>
        <div className="photo-drop">Click to upload image</div>
        <div className="photo-note">Only (JPG, GIF, PNG) are allowed</div>
        <div className="profile-actions">
          <Button variant="primary" onClick={handleSaveProfile} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.reload()}
          >
            Cancel
          </Button>
        </div>
      </section>

      {/* ── Two-Factor Authentication ── */}
      <section className="profile-card">
        <div className="section-title">Two-Factor Authentication</div>
        <p className="section-subtitle">
          2FA is mandatory for all accounts. Your verification method is shown below.
        </p>
        {twoFALoading ? (
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>Loading 2FA status…</p>
        ) : (
          <div className="profile-2fa-row">
            <div className="profile-2fa-status">
              {twoFAStatus?.twoFactorEnabled ? (
                <span className="profile-2fa-badge profile-2fa-badge-on">
                  Enabled — {twoFAStatus.twoFactorMethod === "totp" ? "Authenticator App" : "Email OTP"}
                </span>
              ) : (
                <span className="profile-2fa-badge profile-2fa-badge-off">Not configured</span>
              )}
            </div>
            {isAdmin && twoFAStatus?.twoFactorEnabled && (
              <Button
                variant="secondary"
                onClick={handleReset2FA}
                disabled={twoFAResetting}
                style={{ fontSize: "var(--text-xs)", padding: "4px 12px" }}
              >
                {twoFAResetting ? "Resetting…" : "Reset 2FA"}
              </Button>
            )}
          </div>
        )}
        <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "var(--space-sm)" }}>
          * Users cannot disable their own 2FA. Admins can reset it to allow re-configuration.
        </p>
      </section>
    </div>
  );
}
