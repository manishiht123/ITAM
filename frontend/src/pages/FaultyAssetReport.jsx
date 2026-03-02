import { useState, useEffect, useCallback } from "react";
import {
  FaDownload, FaSync, FaExclamationTriangle,
  FaTools, FaBoxOpen, FaBuilding, FaSkull
} from "react-icons/fa";
import api from "../services/api";
import { useEntity } from "../context/EntityContext";
import { useToast } from "../context/ToastContext";
import "./FaultyAssetReport.css";

const STATUS_META = {
  "Under Repair":   { cls: "far-status-repair",   label: "Under Repair"   },
  "Theft/Missing":  { cls: "far-status-theft",    label: "Theft/Missing"  },
  "Not Submitted":  { cls: "far-status-notsub",   label: "Not Submitted"  },
};

const COND_META = {
  "Needs Repair": { cls: "far-cond-needsrepair", label: "Needs Repair" },
  "Fair":         { cls: "far-cond-fair",         label: "Fair"         },
};

function StatusBadge({ value, type }) {
  const meta = type === "status" ? STATUS_META[value] : COND_META[value];
  if (!meta) return <span className="far-badge far-badge-default">{value || "—"}</span>;
  return <span className={`far-badge ${meta.cls}`}>{meta.label}</span>;
}

export default function FaultyAssetReport() {
  const { entity } = useEntity();
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCondition, setFilterCondition] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [sortCol, setSortCol] = useState("department");
  const [sortDir, setSortDir] = useState("asc");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getFaultyAssetsReport(entity);
      setRows(data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load faulty asset report");
    } finally {
      setLoading(false);
    }
  }, [entity]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await api.exportFaultyAssetsReport(entity);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `faulty-assets-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const underRepair   = rows.filter((r) => r.status === "Under Repair").length;
  const needsRepair   = rows.filter((r) => r.condition === "Needs Repair").length;
  const fairCond      = rows.filter((r) => r.condition === "Fair" && r.status !== "Under Repair").length;
  const theftMissing  = rows.filter((r) => r.status === "Theft/Missing").length;
  const warrantyExpiredCount = rows.filter((r) => r.warrantyExpired === true).length;

  // Most affected department
  const deptCount = {};
  rows.forEach((r) => { const d = r.department || "Unassigned"; deptCount[d] = (deptCount[d] || 0) + 1; });
  const topDept = Object.entries(deptCount).sort((a, b) => b[1] - a[1])[0];

  // ── Unique filter options ─────────────────────────────────────────────────
  const statuses   = [...new Set(rows.map((r) => r.status).filter(Boolean))].sort();
  const conditions = [...new Set(rows.map((r) => r.condition).filter(Boolean))].sort();
  const categories = [...new Set(rows.map((r) => r.category).filter(Boolean))].sort();
  const depts      = [...new Set(rows.map((r) => r.department).filter(Boolean))].sort();

  // ── Filter + Sort ─────────────────────────────────────────────────────────
  const filtered = rows
    .filter((r) => {
      const q = search.toLowerCase();
      if (q && !`${r.assetId} ${r.name} ${r.makeModel} ${r.serialNumber} ${r.department} ${r.comments}`.toLowerCase().includes(q)) return false;
      if (filterStatus    && r.status    !== filterStatus)    return false;
      if (filterCondition && r.condition !== filterCondition) return false;
      if (filterCategory  && r.category  !== filterCategory)  return false;
      if (filterDept      && r.department !== filterDept)     return false;
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

  // ── Department breakdown for summary panel ────────────────────────────────
  const deptBreakdown = Object.entries(deptCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="far-page">
      {/* ── Header ── */}
      <div className="far-header">
        <div>
          <h1 className="far-title">
            <FaExclamationTriangle className="far-title-icon" />
            Faulty Asset Report
          </h1>
          <p className="far-subtitle">
            Assets under repair, needing repair, in fair condition, or reported lost/stolen
          </p>
        </div>
        <div className="far-header-actions">
          <button className="far-btn far-btn-ghost" onClick={load} disabled={loading}>
            <FaSync className={loading ? "far-spin" : ""} /> Refresh
          </button>
          <button className="far-btn far-btn-primary" onClick={handleExport} disabled={exporting}>
            <FaDownload /> {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="far-kpi-row">
        <div className="far-kpi-card">
          <div className="far-kpi-icon far-kpi-red"><FaExclamationTriangle /></div>
          <div className="far-kpi-body">
            <span className="far-kpi-label">Total Faulty</span>
            <span className="far-kpi-value">{rows.length}</span>
            <span className="far-kpi-sub">assets flagged</span>
          </div>
        </div>
        <div className="far-kpi-card">
          <div className="far-kpi-icon far-kpi-orange"><FaTools /></div>
          <div className="far-kpi-body">
            <span className="far-kpi-label">Under Repair</span>
            <span className="far-kpi-value">{underRepair}</span>
            <span className="far-kpi-sub">in service queue</span>
          </div>
        </div>
        <div className="far-kpi-card">
          <div className="far-kpi-icon far-kpi-yellow"><FaBoxOpen /></div>
          <div className="far-kpi-body">
            <span className="far-kpi-label">Needs Repair</span>
            <span className="far-kpi-value">{needsRepair}</span>
            <span className="far-kpi-sub">condition flagged</span>
          </div>
        </div>
        <div className="far-kpi-card">
          <div className="far-kpi-icon far-kpi-grey"><FaBoxOpen /></div>
          <div className="far-kpi-body">
            <span className="far-kpi-label">Fair Condition</span>
            <span className="far-kpi-value">{fairCond}</span>
            <span className="far-kpi-sub">borderline assets</span>
          </div>
        </div>
        <div className="far-kpi-card">
          <div className="far-kpi-icon far-kpi-dark"><FaSkull /></div>
          <div className="far-kpi-body">
            <span className="far-kpi-label">Theft / Missing</span>
            <span className="far-kpi-value">{theftMissing}</span>
            <span className="far-kpi-sub">reported lost/stolen</span>
          </div>
        </div>
        <div className="far-kpi-card">
          <div className="far-kpi-icon far-kpi-blue"><FaBuilding /></div>
          <div className="far-kpi-body">
            <span className="far-kpi-label">Most Affected Dept</span>
            <span className="far-kpi-value far-kpi-dept">{topDept ? topDept[0] : "—"}</span>
            {topDept && <span className="far-kpi-sub">{topDept[1]} assets</span>}
          </div>
        </div>
      </div>

      {/* ── Two-column layout: toolbar+table | dept summary ── */}
      <div className="far-body">
        <div className="far-main">
          {/* Toolbar */}
          <div className="far-toolbar">
            <input
              className="far-search"
              placeholder="Search by ID, name, serial, department…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="far-filter" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="far-filter" value={filterCondition} onChange={(e) => setFilterCondition(e.target.value)}>
              <option value="">All Conditions</option>
              {conditions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="far-filter" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="far-filter" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
              <option value="">All Departments</option>
              {depts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <span className="far-count">{filtered.length} assets</span>
          </div>

          {/* Table */}
          <div className="far-table-wrap">
            {loading ? (
              <div className="far-loading">Loading faulty asset data…</div>
            ) : (
              <table className="far-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("assetId")}    className="far-th-sort">Asset ID{sortIcon("assetId")}</th>
                    <th onClick={() => handleSort("name")}       className="far-th-sort">Name{sortIcon("name")}</th>
                    <th onClick={() => handleSort("category")}   className="far-th-sort">Category{sortIcon("category")}</th>
                    <th onClick={() => handleSort("department")} className="far-th-sort">Department{sortIcon("department")}</th>
                    <th onClick={() => handleSort("location")}   className="far-th-sort">Location{sortIcon("location")}</th>
                    <th onClick={() => handleSort("status")}     className="far-th-sort">Status{sortIcon("status")}</th>
                    <th onClick={() => handleSort("condition")}  className="far-th-sort">Condition{sortIcon("condition")}</th>
                    <th>Make / Model</th>
                    <th>Serial No.</th>
                    <th onClick={() => handleSort("warrantyExpireDate")} className="far-th-sort">Warranty Expiry{sortIcon("warrantyExpireDate")}</th>
                    <th>Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="far-empty">
                        {rows.length === 0
                          ? "No faulty assets found. All assets are in good shape!"
                          : "No assets match your current filters."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => (
                      <tr key={r.assetId} className={r.status === "Theft/Missing" ? "far-row-theft" : ""}>
                        <td className="far-id">{r.assetId}</td>
                        <td className="far-name">{r.name || "—"}</td>
                        <td><span className="far-badge far-badge-cat">{r.category || "—"}</span></td>
                        <td>{r.department || "—"}</td>
                        <td>{r.location || "—"}</td>
                        <td><StatusBadge value={r.status} type="status" /></td>
                        <td><StatusBadge value={r.condition} type="condition" /></td>
                        <td className="far-model">{r.makeModel || "—"}</td>
                        <td className="far-serial">{r.serialNumber || "—"}</td>
                        <td>
                          {r.warrantyExpireDate
                            ? <span className={r.warrantyExpired ? "far-warranty-exp" : "far-warranty-ok"}>
                                {r.warrantyExpireDate}
                                {r.warrantyExpired && <span className="far-warranty-tag">Expired</span>}
                              </span>
                            : "—"}
                        </td>
                        <td className="far-comments">{r.comments || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Side panel: dept breakdown ── */}
        <aside className="far-side">
          <div className="far-side-card">
            <h3 className="far-side-title">By Department</h3>
            {deptBreakdown.length === 0 ? (
              <p className="far-side-empty">No data</p>
            ) : (
              <ul className="far-dept-list">
                {deptBreakdown.map(([dept, count]) => {
                  const pct = rows.length > 0 ? Math.round((count / rows.length) * 100) : 0;
                  return (
                    <li key={dept} className="far-dept-item">
                      <div className="far-dept-row">
                        <span className="far-dept-name">{dept}</span>
                        <span className="far-dept-count">{count}</span>
                      </div>
                      <div className="far-dept-bar-wrap">
                        <div className="far-dept-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="far-side-card far-side-card-mt">
            <h3 className="far-side-title">By Status</h3>
            <ul className="far-stat-list">
              {[
                { label: "Under Repair",  count: underRepair,  cls: "far-dot-repair" },
                { label: "Needs Repair",  count: needsRepair,  cls: "far-dot-needs"  },
                { label: "Fair Condition",count: fairCond,     cls: "far-dot-fair"   },
                { label: "Theft/Missing", count: theftMissing, cls: "far-dot-theft"  },
                { label: "Warranty Expired", count: warrantyExpiredCount, cls: "far-dot-warranty" },
              ].map(({ label, count, cls }) => (
                <li key={label} className="far-stat-item">
                  <span className={`far-dot ${cls}`} />
                  <span className="far-stat-label">{label}</span>
                  <span className="far-stat-count">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <p className="far-note">
        * Faulty assets include those with status "Under Repair", "Theft/Missing", or "Not Submitted",
        and assets in "Needs Repair" or "Fair" condition.
        Update asset status or condition in the Assets page to remove them from this report.
      </p>
    </div>
  );
}
