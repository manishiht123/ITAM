import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import { useEntity } from "../../context/EntityContext";
import { useToast } from "../../context/ToastContext";
import { Button, Badge, ConfirmDialog, LoadingOverlay } from "../../components/ui";
import {
  FaPlus, FaTimes, FaEdit, FaTrash, FaPlay, FaCheckCircle,
  FaExclamationTriangle, FaClock, FaCalendarAlt, FaEnvelope,
  FaChartBar, FaBoxes, FaShieldAlt, FaUsers, FaToggleOn, FaToggleOff
} from "react-icons/fa";
import "./ReportSchedule.css";

const REPORT_TYPES = [
  { value: "assets",      label: "Asset Inventory",    icon: <FaBoxes />,    color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  { value: "licenses",    label: "License Compliance", icon: <FaShieldAlt />, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  { value: "assignments", label: "Assignment Report",  icon: <FaUsers />,    color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  }
];

const FREQUENCIES = [
  { value: "daily",     label: "Daily",     desc: "Every day at the specified time" },
  { value: "weekly",    label: "Weekly",    desc: "Once a week on your chosen day" },
  { value: "monthly",   label: "Monthly",   desc: "Once a month on a specific date" },
  { value: "quarterly", label: "Quarterly", desc: "Q1/Q2/Q3/Q4 on a specific date" }
];

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const EMPTY_FORM = {
  name: "",
  reportType: "assets",
  entityCode: "",
  frequency: "weekly",
  time: "08:00",
  dayOfWeek: 1,
  dayOfMonth: 1,
  recipients: "",
  enabled: true
};

const formatNextRun = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  const now = new Date();
  const diffMs = d - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHrs  = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  let relative = "";
  if (diffMins < 0)   relative = "Overdue";
  else if (diffMins < 60) relative = `in ${diffMins}m`;
  else if (diffHrs < 24)  relative = `in ${diffHrs}h`;
  else if (diffDays === 0) relative = "Today";
  else if (diffDays === 1) relative = "Tomorrow";
  else relative = `in ${diffDays}d`;
  return `${date} ${time} (${relative})`;
};

const getScheduleLabel = (s) => {
  const time = s.time || "08:00";
  switch (s.frequency) {
    case "daily":     return `Every day at ${time}`;
    case "weekly":    return `Every ${DAY_NAMES[s.dayOfWeek ?? 1]} at ${time}`;
    case "monthly":   return `${s.dayOfMonth ?? 1}${ordinal(s.dayOfMonth ?? 1)} of every month at ${time}`;
    case "quarterly": return `Quarterly, ${s.dayOfMonth ?? 1}${ordinal(s.dayOfMonth ?? 1)} day at ${time}`;
    default: return s.frequency;
  }
};

const ordinal = (n) => {
  const s = ["th","st","nd","rd"];
  const v = n % 100;
  return s[(v-20)%10] || s[v] || s[0];
};

export default function ReportSchedule() {
  const { entity } = useEntity();
  const toast = useToast();
  const [schedules, setSchedules] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [runningId, setRunningId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: "" });
  const [formError, setFormError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [schedulesData, entitiesData] = await Promise.all([
        api.getReportSchedules(),
        api.getEntities().catch(() => [])
      ]);
      setSchedules(schedulesData || []);
      setEntities(entitiesData || []);
    } catch (err) {
      toast.error("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, entityCode: entity !== "ALL" ? entity : "" });
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditingId(s.id);
    setForm({
      name: s.name || "",
      reportType: s.reportType || "assets",
      entityCode: s.entityCode || "",
      frequency: s.frequency || "weekly",
      time: s.time || "08:00",
      dayOfWeek: s.dayOfWeek ?? 1,
      dayOfMonth: s.dayOfMonth ?? 1,
      recipients: Array.isArray(s.recipients) ? s.recipients.join(", ") : (s.recipients || ""),
      enabled: s.enabled !== false
    });
    setFormError("");
    setShowModal(true);
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Schedule name is required.";
    const emails = form.recipients.split(",").map(e => e.trim()).filter(Boolean);
    if (!emails.length) return "At least one recipient email is required.";
    const invalid = emails.find(e => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (invalid) return `Invalid email: ${invalid}`;
    return "";
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) { setFormError(err); return; }
    setFormError("");
    setSaving(true);
    try {
      const recipients = form.recipients.split(",").map(e => e.trim()).filter(Boolean);
      const payload = {
        name: form.name.trim(),
        reportType: form.reportType,
        entityCode: form.entityCode || null,
        frequency: form.frequency,
        time: form.time,
        dayOfWeek: form.frequency === "weekly" ? Number(form.dayOfWeek) : null,
        dayOfMonth: ["monthly","quarterly"].includes(form.frequency) ? Number(form.dayOfMonth) : null,
        recipients,
        enabled: form.enabled
      };
      if (editingId) {
        await api.updateReportSchedule(editingId, payload);
        toast.success("Schedule updated successfully");
      } else {
        await api.createReportSchedule(payload);
        toast.success("Schedule created successfully");
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      setFormError(err.message || "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (s) => {
    setTogglingId(s.id);
    try {
      const recipients = Array.isArray(s.recipients) ? s.recipients : [];
      await api.updateReportSchedule(s.id, { ...s, recipients, enabled: !s.enabled });
      setSchedules(prev => prev.map(x => x.id === s.id ? { ...x, enabled: !x.enabled } : x));
      toast.success(`Schedule ${!s.enabled ? "enabled" : "disabled"}`);
    } catch (err) {
      toast.error(err.message || "Failed to toggle schedule");
    } finally {
      setTogglingId(null);
    }
  };

  const handleRunNow = async (s) => {
    setRunningId(s.id);
    try {
      await api.runReportScheduleNow(s.id);
      toast.success(`Report "${s.name}" sent successfully!`);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to run report");
    } finally {
      setRunningId(null);
    }
  };

  const handleDelete = (s) => {
    setDeleteConfirm({ open: true, id: s.id, name: s.name });
  };

  const confirmDelete = async () => {
    const { id } = deleteConfirm;
    setDeleteConfirm({ open: false, id: null, name: "" });
    try {
      await api.deleteReportSchedule(id);
      toast.success("Schedule deleted");
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      toast.error(err.message || "Failed to delete schedule");
    }
  };

  const activeCount   = schedules.filter(s => s.enabled).length;
  const failedCount   = schedules.filter(s => s.lastStatus === "failed").length;
  const successCount  = schedules.filter(s => s.lastStatus === "success").length;

  if (loading) return <LoadingOverlay visible message="Loading schedules..." />;

  return (
    <div className="rsch-page">
      {/* ===== HEADER ===== */}
      <div className="rsch-header">
        <div>
          <h1><FaCalendarAlt className="rsch-title-icon" /> Report Scheduling</h1>
          <p>Automate report delivery to your team via email on a recurring schedule.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <FaPlus style={{ marginRight: 6 }} /> New Schedule
        </Button>
      </div>

      {/* ===== STATS ROW ===== */}
      <div className="rsch-stats">
        <div className="rsch-stat">
          <span className="rsch-stat-value">{schedules.length}</span>
          <span className="rsch-stat-label">Total Schedules</span>
        </div>
        <div className="rsch-stat rsch-stat-success">
          <span className="rsch-stat-value">{activeCount}</span>
          <span className="rsch-stat-label">Active</span>
        </div>
        <div className="rsch-stat rsch-stat-success">
          <FaCheckCircle className="rsch-stat-icon" />
          <span className="rsch-stat-value">{successCount}</span>
          <span className="rsch-stat-label">Last Run OK</span>
        </div>
        <div className="rsch-stat rsch-stat-danger">
          <FaExclamationTriangle className="rsch-stat-icon" />
          <span className="rsch-stat-value">{failedCount}</span>
          <span className="rsch-stat-label">Failed</span>
        </div>
      </div>

      {/* ===== SCHEDULES LIST ===== */}
      {schedules.length === 0 ? (
        <div className="rsch-empty">
          <FaCalendarAlt className="rsch-empty-icon" />
          <h3>No schedules yet</h3>
          <p>Create your first automated report schedule to get started.</p>
          <Button variant="primary" onClick={openCreate}>
            <FaPlus style={{ marginRight: 6 }} /> Create Schedule
          </Button>
        </div>
      ) : (
        <div className="rsch-table-wrap">
          <table className="rsch-table">
            <thead>
              <tr>
                <th>Schedule</th>
                <th>Type</th>
                <th>Entity</th>
                <th>Frequency</th>
                <th>Recipients</th>
                <th>Next Run</th>
                <th>Last Run</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map(s => {
                const rt = REPORT_TYPES.find(r => r.value === s.reportType) || REPORT_TYPES[0];
                const recip = Array.isArray(s.recipients) ? s.recipients : [];
                return (
                  <tr key={s.id} className={!s.enabled ? "rsch-row-disabled" : ""}>
                    <td>
                      <div className="rsch-name">
                        <span className="rsch-name-text">{s.name}</span>
                        {!s.enabled && <Badge variant="neutral">Paused</Badge>}
                      </div>
                    </td>
                    <td>
                      <span className="rsch-type-chip" style={{ color: rt.color, background: rt.bg }}>
                        {rt.icon} {rt.label}
                      </span>
                    </td>
                    <td>
                      <span className="rsch-entity">
                        {s.entityCode || "All Entities"}
                      </span>
                    </td>
                    <td>
                      <span className="rsch-freq">
                        <FaClock style={{ opacity: 0.6, marginRight: 5 }} />
                        {getScheduleLabel(s)}
                      </span>
                    </td>
                    <td>
                      <div className="rsch-recipients">
                        <FaEnvelope style={{ opacity: 0.5, marginRight: 5, flexShrink: 0 }} />
                        <span title={recip.join(", ")}>
                          {recip.length === 0
                            ? <em style={{ color: "var(--text-secondary)" }}>None</em>
                            : recip.length === 1
                              ? recip[0]
                              : `${recip[0]} +${recip.length - 1} more`
                          }
                        </span>
                      </div>
                    </td>
                    <td className="rsch-nextrun">
                      {s.enabled ? formatNextRun(s.nextRun) : <span style={{ color: "var(--text-secondary)" }}>—</span>}
                    </td>
                    <td className="rsch-lastrun">
                      {s.lastRun
                        ? new Date(s.lastRun).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                        : <span style={{ color: "var(--text-secondary)" }}>Never</span>
                      }
                    </td>
                    <td>
                      {!s.lastStatus
                        ? <Badge variant="neutral">Pending</Badge>
                        : s.lastStatus === "success"
                          ? <Badge variant="success"><FaCheckCircle style={{ marginRight: 4 }} />Delivered</Badge>
                          : <Badge variant="danger" title={s.lastError}><FaExclamationTriangle style={{ marginRight: 4 }} />Failed</Badge>
                      }
                    </td>
                    <td>
                      <div className="rsch-actions">
                        {/* Toggle */}
                        <button
                          className={`rsch-toggle-btn ${s.enabled ? "on" : "off"}`}
                          title={s.enabled ? "Disable schedule" : "Enable schedule"}
                          disabled={togglingId === s.id}
                          onClick={() => handleToggle(s)}
                        >
                          {s.enabled ? <FaToggleOn /> : <FaToggleOff />}
                        </button>
                        {/* Run Now */}
                        <button
                          className="rsch-icon-btn run"
                          title="Run now (send immediately)"
                          disabled={runningId === s.id}
                          onClick={() => handleRunNow(s)}
                        >
                          {runningId === s.id ? <span className="rsch-spinner" /> : <FaPlay />}
                        </button>
                        {/* Edit */}
                        <button
                          className="rsch-icon-btn edit"
                          title="Edit schedule"
                          onClick={() => openEdit(s)}
                        >
                          <FaEdit />
                        </button>
                        {/* Delete */}
                        <button
                          className="rsch-icon-btn delete"
                          title="Delete schedule"
                          onClick={() => handleDelete(s)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== CREATE / EDIT MODAL ===== */}
      {showModal && (
        <div className="rsch-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="rsch-modal">
            {/* Header */}
            <div className="rsch-modal-header">
              <div>
                <h2>{editingId ? "Edit Schedule" : "New Report Schedule"}</h2>
                <p>{editingId ? "Update the schedule configuration below." : "Set up automated report delivery to your team."}</p>
              </div>
              <button className="rsch-modal-close" onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>

            <form onSubmit={handleSave} className="rsch-modal-body">
              {formError && (
                <div className="rsch-form-error">
                  <FaExclamationTriangle /> {formError}
                </div>
              )}

              {/* Name */}
              <div className="rsch-field">
                <label>Schedule Name <span className="rsch-required">*</span></label>
                <input
                  className="rsch-input"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Weekly Asset Report for IT Team"
                  required
                />
              </div>

              {/* Report Type */}
              <div className="rsch-field">
                <label>Report Type <span className="rsch-required">*</span></label>
                <div className="rsch-type-grid">
                  {REPORT_TYPES.map(rt => (
                    <button
                      key={rt.value}
                      type="button"
                      className={`rsch-type-btn ${form.reportType === rt.value ? "active" : ""}`}
                      onClick={() => setForm(p => ({ ...p, reportType: rt.value }))}
                    >
                      <span className="rsch-type-icon" style={{ color: rt.color, background: rt.bg }}>{rt.icon}</span>
                      <span>{rt.label}</span>
                      {form.reportType === rt.value && <FaCheckCircle className="rsch-check" style={{ color: rt.color }} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Entity + Frequency Row */}
              <div className="rsch-row">
                <div className="rsch-field">
                  <label>Entity</label>
                  <select
                    className="rsch-input"
                    value={form.entityCode}
                    onChange={e => setForm(p => ({ ...p, entityCode: e.target.value }))}
                  >
                    <option value="">All Entities</option>
                    {entities.map(e => (
                      <option key={e.code} value={e.code}>{e.code} — {e.name}</option>
                    ))}
                  </select>
                </div>
                <div className="rsch-field">
                  <label>Frequency <span className="rsch-required">*</span></label>
                  <select
                    className="rsch-input"
                    value={form.frequency}
                    onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}
                  >
                    {FREQUENCIES.map(f => (
                      <option key={f.value} value={f.value}>{f.label} — {f.desc}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Time + Day Row */}
              <div className="rsch-row">
                <div className="rsch-field">
                  <label>Send Time <span className="rsch-required">*</span></label>
                  <input
                    type="time"
                    className="rsch-input"
                    value={form.time}
                    onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                    required
                  />
                </div>
                {form.frequency === "weekly" && (
                  <div className="rsch-field">
                    <label>Day of Week</label>
                    <select
                      className="rsch-input"
                      value={form.dayOfWeek}
                      onChange={e => setForm(p => ({ ...p, dayOfWeek: Number(e.target.value) }))}
                    >
                      {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                  </div>
                )}
                {(form.frequency === "monthly" || form.frequency === "quarterly") && (
                  <div className="rsch-field">
                    <label>Day of Month</label>
                    <select
                      className="rsch-input"
                      value={form.dayOfMonth}
                      onChange={e => setForm(p => ({ ...p, dayOfMonth: Number(e.target.value) }))}
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>{d}{ordinal(d)}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Recipients */}
              <div className="rsch-field">
                <label>
                  <FaEnvelope style={{ marginRight: 6, opacity: 0.7 }} />
                  Recipients <span className="rsch-required">*</span>
                </label>
                <input
                  className="rsch-input"
                  value={form.recipients}
                  onChange={e => setForm(p => ({ ...p, recipients: e.target.value }))}
                  placeholder="manager@company.com, it-team@company.com"
                />
                <span className="rsch-field-hint">Separate multiple email addresses with commas.</span>
              </div>

              {/* Enable Toggle */}
              <div className="rsch-field rsch-enable-row">
                <div>
                  <label>Enable Schedule</label>
                  <p className="rsch-field-hint">Disabled schedules will not run automatically.</p>
                </div>
                <button
                  type="button"
                  className={`rsch-toggle-switch ${form.enabled ? "on" : "off"}`}
                  onClick={() => setForm(p => ({ ...p, enabled: !p.enabled }))}
                >
                  <span className="rsch-toggle-thumb" />
                </button>
              </div>

              {/* Info Box */}
              <div className="rsch-info-box">
                <FaChartBar style={{ color: "var(--primary)", flexShrink: 0 }} />
                <div>
                  <strong>How it works:</strong> The report will be generated with live data and
                  sent as a CSV attachment to all recipients via your configured SMTP server.
                  Make sure SMTP is configured in <em>Settings → Notifications</em>.
                </div>
              </div>

              {/* Footer */}
              <div className="rsch-modal-footer">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Update Schedule" : "Create Schedule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRM ===== */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Schedule"
        message={`Are you sure you want to delete "${deleteConfirm.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: null, name: "" })}
      />
    </div>
  );
}
