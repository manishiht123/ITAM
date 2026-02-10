import { useMemo, useState } from "react";
import { useToast } from "../context/ToastContext";
import { Button } from "../components/ui";
import "./Profile.css";

export default function Profile() {
  const toast = useToast();
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("authUser") || "{}");
    } catch (err) {
      return {};
    }
  }, []);

  const [form, setForm] = useState({
    firstName: storedUser?.name?.split(" ")[0] || "",
    lastName: storedUser?.name?.split(" ").slice(1).join(" ") || "",
    title: "",
    phone: "",
    email: storedUser?.email || "",
    confirmEmail: storedUser?.email || "",
    timezone: "Asia/Kolkata",
    dateFormat: "MM/dd/yyyy",
    timeFormat: "12-hour short - 09:58 PM"
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const handleSaveProfile = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.confirmEmail) {
      toast.warning("Please complete required fields.");
      return;
    }
    if (form.email !== form.confirmEmail) {
      toast.warning("Email and Confirm Email do not match.");
      return;
    }
    const name = `${form.firstName} ${form.lastName}`.trim();
    const updatedUser = {
      ...storedUser,
      name,
      email: form.email
    };
    localStorage.setItem("authUser", JSON.stringify(updatedUser));
    window.dispatchEvent(new Event("authUserUpdated"));
    toast.success("Profile updated.");
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
          <Button variant="primary" onClick={handleSaveProfile}>
            Save
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.reload()}
          >
            Cancel
          </Button>
        </div>
      </section>

      {null}
    </div>
  );
}
