import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaClipboardCheck, FaPlus, FaSync, FaPlay, FaEye,
  FaTrash, FaCheckCircle, FaClock, FaExclamationTriangle
} from "react-icons/fa";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import "./PhysicalAudit.css";

const STATUS_META = {
  Draft:       { cls: "pa-status-draft",    label: "Draft",       Icon: FaClock },
  "In Progress": { cls: "pa-status-active", label: "In Progress", Icon: FaPlay },
  Completed:   { cls: "pa-status-done",     label: "Completed",   Icon: FaCheckCircle },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { cls: "pa-status-draft", label: status, Icon: FaClock };
  return (
    <span className={`pa-badge ${meta.cls}`}>
      <meta.Icon className="pa-badge-icon" /> {meta.label}
    </span>
  );
}

function ProgressBar({ found, conditionChanged, notFound, total }) {
  if (!total) return <span className="pa-progress-none">No assets</span>;
  const scanned = found + conditionChanged + notFound;
  const pct = Math.round((scanned / total) * 100);
  return (
    <div className="pa-progress-wrap">
      <div className="pa-progress-bar">
        <div className="pa-progress-found"    style={{ width: `${Math.round((found / total) * 100)}%` }} />
        <div className="pa-progress-changed"  style={{ width: `${Math.round((conditionChanged / total) * 100)}%` }} />
        <div className="pa-progress-missing"  style={{ width: `${Math.round((notFound / total) * 100)}%` }} />
      </div>
      <span className="pa-progress-label">{scanned}/{total} ({pct}%)</span>
    </div>
  );
}

function NewAuditModal({ entities, onClose, onCreate }) {
  const [form, setForm] = useState({
    sessionName: "",
    entityCode: entities.length === 1 ? entities[0].code : "",
    location: "",
    department: "",
    auditDate: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.sessionName || !form.entityCode || !form.auditDate) {
      toast.warning("Session name, entity, and date are required.");
      return;
    }
    setSaving(true);
    try {
      const result = await api.createAudit(form);
      toast.success(`Audit created with ${result.totalExpected} asset(s).`);
      onCreate(result.auditId);
    } catch (err) {
      toast.error(err.message || "Failed to create audit.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pa-modal-overlay">
      <div className="pa-modal">
        <div className="pa-modal-header">
          <h2><FaClipboardCheck className="pa-modal-icon" /> New Physical Audit</h2>
          <button className="pa-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="pa-modal-body">
          <div className="pa-form-row">
            <div className="pa-field">
              <label className="pa-label">Session Name <span className="pa-req">*</span></label>
              <input className="pa-input" placeholder="e.g. Q1 2026 Full Audit"
                value={form.sessionName} onChange={e => set("sessionName", e.target.value)} required />
            </div>
            <div className="pa-field">
              <label className="pa-label">Entity <span className="pa-req">*</span></label>
              <select className="pa-input" value={form.entityCode}
                onChange={e => set("entityCode", e.target.value)} required>
                <option value="">— Select Entity —</option>
                {entities.map(e => (
                  <option key={e.code} value={e.code}>{e.code} — {e.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="pa-form-row">
            <div className="pa-field">
              <label className="pa-label">Filter by Location <span className="pa-hint">(optional)</span></label>
              <input className="pa-input" placeholder="Leave blank for all locations"
                value={form.location} onChange={e => set("location", e.target.value)} />
            </div>
            <div className="pa-field">
              <label className="pa-label">Filter by Department <span className="pa-hint">(optional)</span></label>
              <input className="pa-input" placeholder="Leave blank for all departments"
                value={form.department} onChange={e => set("department", e.target.value)} />
            </div>
          </div>
          <div className="pa-form-row">
            <div className="pa-field">
              <label className="pa-label">Audit Date <span className="pa-req">*</span></label>
              <input type="date" className="pa-input" value={form.auditDate}
                onChange={e => set("auditDate", e.target.value)} required />
            </div>
            <div className="pa-field">
              <label className="pa-label">Notes</label>
              <input className="pa-input" placeholder="Optional remarks"
                value={form.notes} onChange={e => set("notes", e.target.value)} />
            </div>
          </div>
          <div className="pa-modal-footer">
            <button type="button" className="pa-btn pa-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="pa-btn pa-btn-primary" disabled={saving}>
              {saving ? "Creating…" : <><FaPlus style={{ marginRight: 6 }} />Create Audit</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PhysicalAudit() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAdmin, hasRole } = useAuth();
  const isManager = isAdmin || hasRole("manager");

  const [audits, setAudits] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [auditData, entityData] = await Promise.all([
        api.getAudits(),
        api.getEntities(),
      ]);
      setAudits(auditData || []);
      setEntities(entityData || []);
    } catch (err) {
      toast.error(err.message || "Failed to load audits.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreated = (auditId) => {
    setShowModal(false);
    navigate(`/assets/audit/${auditId}`);
  };

  const handleDelete = async (audit) => {
    if (!window.confirm(`Delete audit "${audit.sessionName}"? This cannot be undone.`)) return;
    try {
      await api.deleteAudit(audit.id);
      toast.success("Audit deleted.");
      load();
    } catch (err) {
      toast.error(err.message || "Delete failed.");
    }
  };

  const filtered = audits.filter(a => {
    const q = search.toLowerCase();
    if (q && !`${a.sessionName} ${a.entityCode} ${a.location} ${a.department}`.toLowerCase().includes(q)) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    return true;
  });

  // KPI stats
  const total     = audits.length;
  const active    = audits.filter(a => a.status === "In Progress").length;
  const completed = audits.filter(a => a.status === "Completed").length;
  const drafts    = audits.filter(a => a.status === "Draft").length;

  function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <div className="pa-page">
      {/* Header */}
      <div className="pa-header">
        <div>
          <h1 className="pa-title">
            <FaClipboardCheck className="pa-title-icon" />
            Physical Audit
          </h1>
          <p className="pa-subtitle">Verify physical presence and condition of assets</p>
        </div>
        <div className="pa-header-actions">
          <button className="pa-btn pa-btn-ghost" onClick={load} disabled={loading}>
            <FaSync className={loading ? "pa-spin" : ""} /> Refresh
          </button>
          {isManager && (
            <button className="pa-btn pa-btn-primary" onClick={() => setShowModal(true)}>
              <FaPlus style={{ marginRight: 6 }} /> New Audit
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="pa-kpi-row">
        <div className="pa-kpi-card">
          <div className="pa-kpi-icon pa-kpi-blue"><FaClipboardCheck /></div>
          <div className="pa-kpi-body">
            <span className="pa-kpi-label">Total Audits</span>
            <span className="pa-kpi-value">{total}</span>
          </div>
        </div>
        <div className="pa-kpi-card">
          <div className="pa-kpi-icon pa-kpi-yellow"><FaPlay /></div>
          <div className="pa-kpi-body">
            <span className="pa-kpi-label">In Progress</span>
            <span className="pa-kpi-value">{active}</span>
          </div>
        </div>
        <div className="pa-kpi-card">
          <div className="pa-kpi-icon pa-kpi-green"><FaCheckCircle /></div>
          <div className="pa-kpi-body">
            <span className="pa-kpi-label">Completed</span>
            <span className="pa-kpi-value">{completed}</span>
          </div>
        </div>
        <div className="pa-kpi-card">
          <div className="pa-kpi-icon pa-kpi-gray"><FaClock /></div>
          <div className="pa-kpi-body">
            <span className="pa-kpi-label">Drafts</span>
            <span className="pa-kpi-value">{drafts}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="pa-toolbar">
        <input className="pa-search" placeholder="Search by name, entity, location…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="pa-filter" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <span className="pa-count">{filtered.length} audit{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="pa-table-wrap">
        {loading ? (
          <div className="pa-loading">Loading audits…</div>
        ) : filtered.length === 0 ? (
          <div className="pa-empty">
            <FaClipboardCheck className="pa-empty-icon" />
            <p>{audits.length === 0 ? "No audit sessions yet. Create one to get started." : "No audits match your filters."}</p>
          </div>
        ) : (
          <table className="pa-table">
            <thead>
              <tr>
                <th>Session Name</th>
                <th>Entity</th>
                <th>Audit Date</th>
                <th>Location / Dept</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td className="pa-name">{a.sessionName}</td>
                  <td><span className="pa-entity-chip">{a.entityCode}</span></td>
                  <td style={{ fontSize: "var(--text-xs)", whiteSpace: "nowrap" }}>{formatDate(a.auditDate)}</td>
                  <td style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
                    {[a.location, a.department].filter(Boolean).join(" / ") || "All"}
                  </td>
                  <td>
                    <ProgressBar
                      found={a.totalFound}
                      conditionChanged={a.totalConditionChanged}
                      notFound={a.totalNotFound}
                      total={a.totalExpected}
                    />
                  </td>
                  <td><StatusBadge status={a.status} /></td>
                  <td style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>{a.createdBy || "—"}</td>
                  <td>
                    <div className="pa-row-actions">
                      <button className="pa-action-btn pa-action-view"
                        title={a.status === "Completed" ? "View Report" : "Continue Audit"}
                        onClick={() => navigate(`/assets/audit/${a.id}`)}>
                        {a.status === "Completed" ? <FaEye /> : <FaPlay />}
                      </button>
                      {a.status !== "Completed" && isManager && (
                        <button className="pa-action-btn pa-action-delete"
                          title="Delete audit" onClick={() => handleDelete(a)}>
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <NewAuditModal entities={entities} onClose={() => setShowModal(false)} onCreate={handleCreated} />
      )}
    </div>
  );
}
