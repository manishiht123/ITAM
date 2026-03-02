import { useState, useEffect, useCallback } from "react";
import {
  FaDownload, FaSync, FaShieldAlt,
  FaExclamationTriangle, FaTimesCircle, FaClock, FaCheckCircle
} from "react-icons/fa";
import api from "../services/api";
import { useEntity } from "../context/EntityContext";
import { useToast } from "../context/ToastContext";
import "./WarrantyAlerts.css";

const THRESHOLD_OPTIONS = [7, 30, 60, 90, 180, 365];

const URGENCY_META = {
  expired:  { cls: "wa-urgency-expired",  label: "Expired"    },
  critical: { cls: "wa-urgency-critical", label: "Critical"   },
  warning:  { cls: "wa-urgency-warning",  label: "Warning"    },
  soon:     { cls: "wa-urgency-soon",     label: "Upcoming"   },
};

const DAYS_CLS = {
  expired:  "wa-days-expired",
  critical: "wa-days-critical",
  warning:  "wa-days-warning",
  soon:     "wa-days-soon",
};

function UrgencyBadge({ urgency }) {
  const meta = URGENCY_META[urgency];
  if (!meta) return null;
  return <span className={`wa-badge ${meta.cls}`}>{meta.label}</span>;
}

function DaysCell({ row }) {
  const cls = DAYS_CLS[row.urgency] || "";
  if (row.warrantyExpired) {
    return <span className={`wa-days-cell ${cls}`}>Expired {Math.abs(row.daysUntilExpiry)}d ago</span>;
  }
  return <span className={`wa-days-cell ${cls}`}>{row.daysUntilExpiry}d remaining</span>;
}

export default function WarrantyAlerts() {
  const { entity } = useEntity();
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [threshold, setThreshold] = useState(90);
  const [search, setSearch] = useState("");
  const [filterUrgency, setFilterUrgency] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [sortCol, setSortCol] = useState("daysUntilExpiry");
  const [sortDir, setSortDir] = useState("asc");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getWarrantyAlerts(entity, threshold);
      setRows(data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load warranty alerts");
    } finally {
      setLoading(false);
    }
  }, [entity, threshold]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await api.exportWarrantyAlerts(entity, threshold);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `warranty-alerts-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const expired  = rows.filter((r) => r.urgency === "expired").length;
  const critical = rows.filter((r) => r.urgency === "critical").length;
  const warning  = rows.filter((r) => r.urgency === "warning").length;
  const soon     = rows.filter((r) => r.urgency === "soon").length;

  // ── Filter options ─────────────────────────────────────────────────────────
  const categories = [...new Set(rows.map((r) => r.category).filter(Boolean))].sort();
  const depts      = [...new Set(rows.map((r) => r.department).filter(Boolean))].sort();

  // ── Filter + Sort ─────────────────────────────────────────────────────────
  const filtered = rows
    .filter((r) => {
      const q = search.toLowerCase();
      if (q && !`${r.assetId} ${r.name} ${r.makeModel} ${r.serialNumber} ${r.department} ${r.vendorName}`.toLowerCase().includes(q)) return false;
      if (filterUrgency  && r.urgency    !== filterUrgency)   return false;
      if (filterCategory && r.category   !== filterCategory)  return false;
      if (filterDept     && r.department !== filterDept)      return false;
      return true;
    })
    .sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (va == null) va = "";
      if (vb == null) vb = "";
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  };
  const sortIcon = (col) => sortCol === col ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  const rowClass = (r) => {
    if (r.urgency === "expired")  return "wa-row-expired";
    if (r.urgency === "critical") return "wa-row-critical";
    return "";
  };

  return (
    <div className="wa-page">
      {/* ── Header ── */}
      <div className="wa-header">
        <div>
          <h1 className="wa-title">
            <FaShieldAlt className="wa-title-icon" />
            Warranty Alerts
          </h1>
          <p className="wa-subtitle">
            Assets with warranties expiring within the selected threshold
          </p>
        </div>
        <div className="wa-header-actions">
          <button className="wa-btn wa-btn-ghost" onClick={load} disabled={loading}>
            <FaSync className={loading ? "wa-spin" : ""} /> Refresh
          </button>
          <button className="wa-btn wa-btn-primary" onClick={handleExport} disabled={exporting}>
            <FaDownload /> {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      {/* ── Threshold pills ── */}
      <div className="wa-threshold-bar">
        <span className="wa-threshold-label">Show assets expiring within:</span>
        <div className="wa-threshold-pills">
          {THRESHOLD_OPTIONS.map((d) => (
            <button
              key={d}
              className={`wa-pill ${threshold === d ? "wa-pill-active" : ""}`}
              onClick={() => setThreshold(d)}
            >
              {d >= 365 ? "1 year" : `${d} days`}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="wa-kpi-row">
        <div className="wa-kpi-card">
          <div className="wa-kpi-icon wa-kpi-grey"><FaShieldAlt /></div>
          <div className="wa-kpi-body">
            <span className="wa-kpi-label">Total Alerts</span>
            <span className="wa-kpi-value">{rows.length}</span>
            <span className="wa-kpi-sub">within {threshold} days</span>
          </div>
        </div>
        <div className="wa-kpi-card">
          <div className="wa-kpi-icon wa-kpi-red"><FaTimesCircle /></div>
          <div className="wa-kpi-body">
            <span className="wa-kpi-label">Expired</span>
            <span className="wa-kpi-value">{expired}</span>
            <span className="wa-kpi-sub">warranty lapsed</span>
          </div>
        </div>
        <div className="wa-kpi-card">
          <div className="wa-kpi-icon wa-kpi-orange"><FaExclamationTriangle /></div>
          <div className="wa-kpi-body">
            <span className="wa-kpi-label">Critical</span>
            <span className="wa-kpi-value">{critical}</span>
            <span className="wa-kpi-sub">expiring ≤ 7 days</span>
          </div>
        </div>
        <div className="wa-kpi-card">
          <div className="wa-kpi-icon wa-kpi-yellow"><FaClock /></div>
          <div className="wa-kpi-body">
            <span className="wa-kpi-label">Warning</span>
            <span className="wa-kpi-value">{warning}</span>
            <span className="wa-kpi-sub">expiring ≤ 30 days</span>
          </div>
        </div>
        <div className="wa-kpi-card">
          <div className="wa-kpi-icon wa-kpi-blue"><FaCheckCircle /></div>
          <div className="wa-kpi-body">
            <span className="wa-kpi-label">Upcoming</span>
            <span className="wa-kpi-value">{soon}</span>
            <span className="wa-kpi-sub">expiring ≤ 90 days</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="wa-toolbar">
        <input
          className="wa-search"
          placeholder="Search by ID, name, serial, vendor, department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="wa-filter" value={filterUrgency} onChange={(e) => setFilterUrgency(e.target.value)}>
          <option value="">All Urgencies</option>
          <option value="expired">Expired</option>
          <option value="critical">Critical (≤7d)</option>
          <option value="warning">Warning (≤30d)</option>
          <option value="soon">Upcoming (≤90d)</option>
        </select>
        <select className="wa-filter" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="wa-filter" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
          <option value="">All Departments</option>
          {depts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <span className="wa-count">{filtered.length} assets</span>
      </div>

      {/* ── Table ── */}
      <div className="wa-table-wrap">
        {loading ? (
          <div className="wa-loading">Loading warranty data…</div>
        ) : (
          <table className="wa-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("assetId")}        className="wa-th-sort">Asset ID{sortIcon("assetId")}</th>
                <th onClick={() => handleSort("name")}           className="wa-th-sort">Name{sortIcon("name")}</th>
                <th onClick={() => handleSort("category")}       className="wa-th-sort">Category{sortIcon("category")}</th>
                <th onClick={() => handleSort("department")}     className="wa-th-sort">Department{sortIcon("department")}</th>
                <th onClick={() => handleSort("location")}       className="wa-th-sort">Location{sortIcon("location")}</th>
                <th onClick={() => handleSort("status")}         className="wa-th-sort">Status{sortIcon("status")}</th>
                <th>Make / Model</th>
                <th>Serial No.</th>
                <th>Vendor</th>
                <th onClick={() => handleSort("warrantyExpireDate")} className="wa-th-sort">Expiry Date{sortIcon("warrantyExpireDate")}</th>
                <th onClick={() => handleSort("daysUntilExpiry")}    className="wa-th-sort">Days{sortIcon("daysUntilExpiry")}</th>
                <th onClick={() => handleSort("urgency")}            className="wa-th-sort">Urgency{sortIcon("urgency")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="wa-empty">
                    {rows.length === 0
                      ? `No assets with warranties expiring within ${threshold} days.`
                      : "No assets match your current filters."}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={`${r._entity || ""}-${r.assetId}`} className={rowClass(r)}>
                    <td className="wa-id">{r.assetId}</td>
                    <td className="wa-name">{r.name || "—"}</td>
                    <td><span className="wa-badge wa-badge-cat">{r.category || "—"}</span></td>
                    <td>{r.department || "—"}</td>
                    <td>{r.location || "—"}</td>
                    <td>{r.status || "—"}</td>
                    <td style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>{r.makeModel || "—"}</td>
                    <td style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>{r.serialNumber || "—"}</td>
                    <td style={{ fontSize: "var(--text-xs)" }}>{r.vendorName || "—"}</td>
                    <td>{r.warrantyExpireDate || "—"}</td>
                    <td><DaysCell row={r} /></td>
                    <td><UrgencyBadge urgency={r.urgency} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <p className="wa-note">
        * Urgency levels: <strong>Expired</strong> — warranty has lapsed; <strong>Critical</strong> — expiring within 7 days;
        <strong> Warning</strong> — expiring within 30 days; <strong>Upcoming</strong> — expiring within 90 days.
        Daily email alerts are sent to configured recipients (Settings → System Preferences).
      </p>
    </div>
  );
}
