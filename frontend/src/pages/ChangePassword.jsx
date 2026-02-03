import { useState } from "react";
import api from "../services/api";
import "./ChangePassword.css";

export default function ChangePassword() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      alert("Please fill all fields.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }
    const storedUser = JSON.parse(localStorage.getItem("authUser") || "{}");
    if (!storedUser?.email || !storedUser?.id) {
      alert("User session not found. Please log in again.");
      return;
    }
    try {
      const loginResult = await api.login({
        email: storedUser.email,
        password: form.currentPassword
      });
      if (loginResult?.token) {
        localStorage.setItem("authToken", loginResult.token);
      }
      await api.updateUser(storedUser.id, { password: form.newPassword });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      alert("Password updated.");
    } catch (err) {
      alert(err.message || "Password update failed.");
    }
  };

  return (
    <div className="change-password-page">
      <div className="change-password-header">
        <h1>Change Password</h1>
        <p>Update your account password.</p>
      </div>

      <form className="change-password-card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Current Password</label>
          <input
            type="password"
            value={form.currentPassword}
            onChange={(e) => update("currentPassword", e.target.value)}
            placeholder="Enter current password"
          />
        </div>
        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            value={form.newPassword}
            onChange={(e) => update("newPassword", e.target.value)}
            placeholder="Enter new password"
          />
        </div>
        <div className="form-group">
          <label>Confirm New Password</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            placeholder="Re-enter new password"
          />
        </div>

        <div className="change-password-actions">
          <button className="asset-action-btn primary" type="submit">
            Save Password
          </button>
          <button
            className="asset-action-btn secondary"
            type="button"
            onClick={() =>
              setForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
            }
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
