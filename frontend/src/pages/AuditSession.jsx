import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaClipboardCheck, FaArrowLeft, FaCheck, FaTimes, FaExclamationTriangle,
  FaDownload, FaSync, FaFlag, FaClock, FaSearch
} from "react-icons/fa";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import "./AuditSession.css";

const SCAN_META = {
  Pending:            { cls: "as-scan-pending",   label: "Pending",           icon: FaClock },
  Found:              { cls: "as-scan-found",      label: "Found",             icon: FaCheck },
  "Not Found":        { cls: "as-scan-missing",    label: "Not Found",         icon: FaTimes },
  "Condition Changed":{ cls: "as-scan-condition",  label: "Condition Changed", icon: FaExclamationTriangle },
};

function ScanBadge({ status }) {
  const m = SCAN_META[status] || SCAN_META.Pending;
  const Icon = m.icon;
  return <span className={`as-scan-badge ${m.cls}`}><Icon className="as-scan-icon" /> {m.label}</span>;
}

function AuditProgress({ audit }) {
  const { totalExpected: total, totalFound: found, totalNotFound: notFound, totalConditionChanged: changed } = audit;
  const scanned = found + notFound + changed;
  const pending = total - scanned;
  const pct = total ? Math.round((scanned / total) * 100) : 0;

  return (
    <div className="as-progress-section">
      <div className="as-progress-header">
        <span className="as-progress-title">Scan Progress</span>
        <span className="as-progress-pct">{pct}% complete</span>
      </div>
      <div className="as-progress-bar">
        <div className="as-pb-found"    style={{ width: `${total ? (found / total) * 100 : 0}%` }} title={`Found: ${found}`} />
        <div className="as-pb-changed"  style={{ width: `${total ? (changed / total) * 100 : 0}%` }} title={`Condition Changed: ${changed}`} />
        <div className="as-pb-missing"  style={{ width: `${total ? (notFound / total) * 100 : 0}%` }} title={`Not Found: ${notFound}`} />
      </div>
      <div className="as-progress-legend">
        <span className="as-leg-item as-leg-found"><span className="as-leg-dot" />Found: {found}</span>
        <span className="as-leg-item as-leg-changed"><span className="as-leg-dot" />Changed: {changed}</span>
        <span className="as-leg-item as-leg-missing"><span className="as-leg-dot" />Not Found: {notFound}</span>
        <span className="as-leg-item as-leg-pending"><span className="as-leg-dot" />Pending: {pending}</span>
      </div>
    </div>
  );
}

function ScanRow({ item, onScan, disabled }) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(item.notes || "");
  const [condition, setCondition] = useState(item.actualCondition || "");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const scan = async (status) => {
    setBusy(true);
    try {
      await onScan(item.id, { scanStatus: status, notes: notes || null, actualCondition: condition || null });
      if (status === "Condition Changed") setShowNotes(true);
    } catch (err) {
      toast.error(err.message || "Scan failed.");
    } finally {
      setBusy(false);
    }
  };

  const saveNotes = async () => {
    setBusy(true);
    try {
      await onScan(item.id, { scanStatus: item.scanStatus, notes, actualCondition: condition });
      setShowNotes(false);
    } catch (err) {
      toast.error(err.message || "Failed to save notes.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <tr className={`as-row as-row-${item.scanStatus.toLowerCase().replace(/\s/g, "-")}`}>
        <td className="as-asset-id">{item.assetId}</td>
        <td className="as-asset-name">{item.assetName || "—"}</td>
        <td style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>{item.category || "—"}</td>
        <td style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>{item.serialNumber || "—"}</td>
        <td style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
          {[item.location, item.department].filter(Boolean).join(" / ") || "—"}
        </td>
        <td style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>{item.employeeId || "—"}</td>
        <td style={{ fontSize: "var(--text-xs)" }}>{item.expectedStatus || "—"}</td>
        <td><ScanBadge status={item.scanStatus} /></td>
        <td>
          {!disabled && (
            <div className="as-scan-actions">
              <button
                className={`as-scan-btn as-btn-found ${item.scanStatus === "Found" ? "active" : ""}`}
                onClick={() => scan("Found")} disabled={busy} title="Mark as Found">
                <FaCheck />
              </button>
              <button
                className={`as-scan-btn as-btn-missing ${item.scanStatus === "Not Found" ? "active" : ""}`}
                onClick={() => scan("Not Found")} disabled={busy} title="Mark as Not Found">
                <FaTimes />
              </button>
              <button
                className={`as-scan-btn as-btn-condition ${item.scanStatus === "Condition Changed" ? "active" : ""}`}
                onClick={() => { scan("Condition Changed"); setShowNotes(true); }} disabled={busy}
                title="Condition Changed">
                <FaExclamationTriangle />
              </button>
              <button className="as-scan-btn as-btn-notes" onClick={() => setShowNotes(v => !v)}
                title="Add notes">
                <FaFlag />
              </button>
            </div>
          )}
          {disabled && <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
            {item.scannedBy ? `By ${item.scannedBy}` : "—"}
          </span>}
        </td>
      </tr>
      {showNotes && (
        <tr className="as-notes-row">
          <td colSpan={9}>
            <div className="as-notes-panel">
              <div className="as-notes-grid">
                <div className="as-notes-field">
                  <label className="as-notes-label">Actual Condition</label>
                  <select className="as-notes-input" value={condition}
                    onChange={e => setCondition(e.target.value)}>
                    <option value="">— Select —</option>
                    <option>Good</option>
                    <option>Fair</option>
                    <option>Needs Repair</option>
                    <option>Damaged</option>
                    <option>Obsolete</option>
                  </select>
                </div>
                <div className="as-notes-field" style={{ flex: 2 }}>
                  <label className="as-notes-label">Notes</label>
                  <input className="as-notes-input" placeholder="Additional remarks…"
                    value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              </div>
              <div className="as-notes-actions">
                <button className="as-notes-save" onClick={saveNotes} disabled={busy}>
                  {busy ? "Saving…" : "Save"}
                </button>
                <button className="as-notes-cancel" onClick={() => setShowNotes(false)}>Cancel</button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AuditSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [audit, setAudit] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterScan, setFilterScan] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.getAudit(id);
      setAudit(data);
      setItems(data.items || []);
    } catch (err) {
      toast.error(err.message || "Failed to load audit.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleScan = useCallback(async (itemId, scanData) => {
    const result = await api.scanAuditItem(id, itemId, scanData);
    // Update local state immediately for responsiveness
    setItems(prev => prev.map(it => it.id === itemId ? { ...it, ...result.item } : it));
    setAudit(prev => prev ? {
      ...prev,
      totalFound:            result.totals.found,
      totalNotFound:         result.totals.notFound,
      totalConditionChanged: result.totals.conditionChanged,
      status: prev.status === "Draft" ? "In Progress" : prev.status,
    } : prev);
  }, [id]);

  const handleComplete = async () => {
    if (!window.confirm("Mark this audit as complete? No further changes will be allowed.")) return;
    setCompleting(true);
    try {
      await api.completeAudit(id);
      toast.success("Audit completed successfully.");
      load();
    } catch (err) {
      toast.error(err.message || "Failed to complete audit.");
    } finally {
      setCompleting(false);
    }
  };

  const handleExport = () => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";
    const url = api.exportAuditUrl(id);
    // Open with auth header via fetch+blob
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `Audit_${audit?.sessionName?.replace(/\s+/g, "_") || id}.csv`;
        a.click();
      })
      .catch(() => toast.error("Export failed."));
  };

  const filtered = useMemo(() => items.filter(it => {
    const q = search.toLowerCase();
    if (q && !`${it.assetId} ${it.assetName} ${it.serialNumber} ${it.location} ${it.department} ${it.employeeId}`.toLowerCase().includes(q)) return false;
    if (filterScan && it.scanStatus !== filterScan) return false;
    return true;
  }), [items, search, filterScan]);

  const isCompleted = audit?.status === "Completed";
  const canComplete = audit && audit.status !== "Completed" &&
    (audit.totalFound + audit.totalNotFound + audit.totalConditionChanged) > 0;

  function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  if (loading) {
    return (
      <div className="as-page">
        <div className="as-loading">Loading audit session…</div>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="as-page">
        <div className="as-loading">Audit not found.</div>
      </div>
    );
  }

  return (
    <div className="as-page">
      {/* Breadcrumb */}
      <button className="as-back" onClick={() => navigate("/assets/audit")}>
        <FaArrowLeft /> Back to Audits
      </button>

      {/* Header */}
      <div className="as-header">
        <div className="as-header-info">
          <h1 className="as-title">
            <FaClipboardCheck className="as-title-icon" />
            {audit.sessionName}
          </h1>
          <div className="as-meta-row">
            <span className="as-meta-chip">{audit.entityCode}</span>
            <span className="as-meta-item">Date: {formatDate(audit.auditDate)}</span>
            {audit.location  && <span className="as-meta-item">Location: {audit.location}</span>}
            {audit.department && <span className="as-meta-item">Dept: {audit.department}</span>}
            <span className={`as-status-badge as-status-${audit.status.toLowerCase().replace(/\s/g, "-")}`}>
              {audit.status}
            </span>
          </div>
          {audit.notes && <p className="as-notes-text">{audit.notes}</p>}
        </div>
        <div className="as-header-actions">
          <button className="as-btn as-btn-ghost" onClick={load}><FaSync /></button>
          <button className="as-btn as-btn-ghost" onClick={handleExport}>
            <FaDownload style={{ marginRight: 6 }} /> Export
          </button>
          {!isCompleted && (
            <button className="as-btn as-btn-complete" onClick={handleComplete}
              disabled={completing || !canComplete}
              title={!canComplete ? "Scan at least one asset before completing" : ""}>
              {completing ? "Completing…" : <><FaCheck style={{ marginRight: 6 }} />Complete Audit</>}
            </button>
          )}
          {isCompleted && (
            <span className="as-completed-badge">
              <FaCheck style={{ marginRight: 4 }} /> Completed {formatDate(audit.completedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Progress */}
      <AuditProgress audit={audit} />

      {/* Toolbar */}
      <div className="as-toolbar">
        <div className="as-search-wrap">
          <FaSearch className="as-search-icon" />
          <input className="as-search" placeholder="Search asset ID, name, serial, location…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="as-filter" value={filterScan} onChange={e => setFilterScan(e.target.value)}>
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Found">Found</option>
          <option value="Not Found">Not Found</option>
          <option value="Condition Changed">Condition Changed</option>
        </select>
        <span className="as-count">{filtered.length} / {items.length} assets</span>
      </div>

      {/* Table */}
      <div className="as-table-wrap">
        {filtered.length === 0 ? (
          <div className="as-empty">No assets match your filters.</div>
        ) : (
          <table className="as-table">
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Serial No.</th>
                <th>Location / Dept</th>
                <th>Employee</th>
                <th>Status</th>
                <th>Scan Result</th>
                <th>{isCompleted ? "Scanned By" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <ScanRow
                  key={item.id}
                  item={item}
                  onScan={handleScan}
                  disabled={isCompleted}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
