import { useState, useEffect, useCallback } from "react";
import { FaDownload, FaSync, FaChartLine, FaRupeeSign, FaBoxOpen, FaExclamationTriangle } from "react-icons/fa";
import api from "../services/api";
import { useEntity } from "../context/EntityContext";
import { useToast } from "../context/ToastContext";
import "./DepreciationReport.css";

const fmt = (n) =>
  n == null ? "—" : "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const pct = (n) => (n == null ? "—" : n + "%");

function BookValueBar({ depreciationPct }) {
  const remaining = Math.max(0, 100 - (depreciationPct || 0));
  return (
    <div className="dep-bar-wrap">
      <div
        className="dep-bar-fill"
        style={{ width: `${remaining}%`, background: remaining > 50 ? "var(--success)" : remaining > 20 ? "var(--warning)" : "var(--danger)" }}
      />
    </div>
  );
}

export default function DepreciationReport() {
  const { entity } = useEntity();
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortCol, setSortCol] = useState("depreciationPct");
  const [sortDir, setSortDir] = useState("desc");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getDepreciationReport(entity);
      setRows(data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load depreciation report");
    } finally {
      setLoading(false);
    }
  }, [entity]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await api.exportDepreciationReport(entity);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `depreciation-report-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const assetsWithCost = rows.filter((r) => r.cost > 0);
  const totalCost = assetsWithCost.reduce((s, r) => s + (r.cost || 0), 0);
  const totalBookValue = assetsWithCost.reduce((s, r) => s + (r.bookValue || 0), 0);
  const totalDepreciated = totalCost - totalBookValue;
  const fullyDepreciated = assetsWithCost.filter((r) => r.depreciationPct >= 100).length;
  const overallPct = totalCost > 0 ? Math.round((totalDepreciated / totalCost) * 100) : 0;

  // ── Unique filter options ─────────────────────────────────────────────────
  const methods    = [...new Set(rows.map((r) => r.method).filter(Boolean))];
  const categories = [...new Set(rows.map((r) => r.category).filter(Boolean))].sort();
  const statuses   = [...new Set(rows.map((r) => r.status).filter(Boolean))].sort();

  // ── Filter + Sort ─────────────────────────────────────────────────────────
  const filtered = rows
    .filter((r) => {
      const q = search.toLowerCase();
      if (q && !`${r.assetId} ${r.name} ${r.category} ${r.department}`.toLowerCase().includes(q)) return false;
      if (filterMethod   && r.method   !== filterMethod)   return false;
      if (filterCategory && r.category !== filterCategory) return false;
      if (filterStatus   && r.status   !== filterStatus)   return false;
      return true;
    })
    .sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (va == null) va = -Infinity;
      if (vb == null) vb = -Infinity;
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("desc"); }
  };
  const sortIcon = (col) => sortCol === col ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  return (
    <div className="dep-page">
      {/* ── Header ── */}
      <div className="dep-header">
        <div>
          <h1 className="dep-title">
            <FaChartLine className="dep-title-icon" />
            Depreciation Report
          </h1>
          <p className="dep-subtitle">Book value and depreciation status of all capitalized assets</p>
        </div>
        <div className="dep-header-actions">
          <button className="dep-btn dep-btn-ghost" onClick={load} disabled={loading}>
            <FaSync className={loading ? "dep-spin" : ""} /> Refresh
          </button>
          <button className="dep-btn dep-btn-primary" onClick={handleExport} disabled={exporting}>
            <FaDownload /> {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="dep-kpi-row">
        <div className="dep-kpi-card">
          <div className="dep-kpi-icon dep-kpi-blue"><FaRupeeSign /></div>
          <div className="dep-kpi-body">
            <span className="dep-kpi-label">Total Asset Cost</span>
            <span className="dep-kpi-value">{fmt(totalCost)}</span>
          </div>
        </div>
        <div className="dep-kpi-card">
          <div className="dep-kpi-icon dep-kpi-green"><FaRupeeSign /></div>
          <div className="dep-kpi-body">
            <span className="dep-kpi-label">Net Book Value</span>
            <span className="dep-kpi-value">{fmt(totalBookValue)}</span>
          </div>
        </div>
        <div className="dep-kpi-card">
          <div className="dep-kpi-icon dep-kpi-orange"><FaRupeeSign /></div>
          <div className="dep-kpi-body">
            <span className="dep-kpi-label">Total Depreciated</span>
            <span className="dep-kpi-value">{fmt(totalDepreciated)}</span>
            <span className="dep-kpi-sub">{overallPct}% of total cost</span>
          </div>
        </div>
        <div className="dep-kpi-card">
          <div className="dep-kpi-icon dep-kpi-red"><FaExclamationTriangle /></div>
          <div className="dep-kpi-body">
            <span className="dep-kpi-label">Fully Depreciated</span>
            <span className="dep-kpi-value">{fullyDepreciated}</span>
            <span className="dep-kpi-sub">assets at salvage value</span>
          </div>
        </div>
        <div className="dep-kpi-card">
          <div className="dep-kpi-icon dep-kpi-teal"><FaBoxOpen /></div>
          <div className="dep-kpi-body">
            <span className="dep-kpi-label">Assets Tracked</span>
            <span className="dep-kpi-value">{assetsWithCost.length}</span>
            <span className="dep-kpi-sub">with cost data</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="dep-toolbar">
        <input
          className="dep-search"
          placeholder="Search by ID, name, category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="dep-filter" value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)}>
          <option value="">All Methods</option>
          {methods.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="dep-filter" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="dep-filter" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="dep-count">{filtered.length} assets</span>
      </div>

      {/* ── Table ── */}
      <div className="dep-table-wrap">
        {loading ? (
          <div className="dep-loading">Loading depreciation data…</div>
        ) : (
          <table className="dep-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("assetId")}   className="dep-th-sort">Asset ID{sortIcon("assetId")}</th>
                <th onClick={() => handleSort("name")}      className="dep-th-sort">Name{sortIcon("name")}</th>
                <th onClick={() => handleSort("category")}  className="dep-th-sort">Category{sortIcon("category")}</th>
                <th onClick={() => handleSort("department")}className="dep-th-sort">Dept{sortIcon("department")}</th>
                <th onClick={() => handleSort("status")}    className="dep-th-sort">Status{sortIcon("status")}</th>
                <th onClick={() => handleSort("purchaseDate")} className="dep-th-sort">Purchase{sortIcon("purchaseDate")}</th>
                <th onClick={() => handleSort("cost")}      className="dep-th-sort dep-th-num">Cost{sortIcon("cost")}</th>
                <th>Method</th>
                <th onClick={() => handleSort("usefulLifeMonths")} className="dep-th-sort dep-th-num">Life (Mo){sortIcon("usefulLifeMonths")}</th>
                <th onClick={() => handleSort("monthsElapsed")} className="dep-th-sort dep-th-num">Elapsed{sortIcon("monthsElapsed")}</th>
                <th onClick={() => handleSort("salvageValue")} className="dep-th-sort dep-th-num">Salvage{sortIcon("salvageValue")}</th>
                <th onClick={() => handleSort("bookValue")} className="dep-th-sort dep-th-num">Book Value{sortIcon("bookValue")}</th>
                <th onClick={() => handleSort("depreciationPct")} className="dep-th-sort dep-th-num">Dep %{sortIcon("depreciationPct")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={13} className="dep-empty">No assets found matching your filters.</td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.assetId} className={r.depreciationPct >= 100 ? "dep-row-fully" : ""}>
                    <td className="dep-id">{r.assetId}</td>
                    <td className="dep-name">{r.name || "—"}</td>
                    <td><span className="dep-badge dep-badge-cat">{r.category || "—"}</span></td>
                    <td>{r.department || "—"}</td>
                    <td>
                      <span className={`dep-badge dep-status-${(r.status || "").toLowerCase().replace(/[/ ]/g, "-")}`}>
                        {r.status || "—"}
                      </span>
                    </td>
                    <td>{r.purchaseDate || "—"}</td>
                    <td className="dep-num">{fmt(r.cost)}</td>
                    <td><span className="dep-badge dep-badge-method">{r.method}</span></td>
                    <td className="dep-num">{r.usefulLifeMonths ?? "—"}</td>
                    <td className="dep-num">{r.monthsElapsed ?? "—"}</td>
                    <td className="dep-num">{fmt(r.salvageValue)}</td>
                    <td className="dep-num dep-book">{fmt(r.bookValue)}</td>
                    <td className="dep-pct-cell">
                      <div className="dep-pct-wrap">
                        <BookValueBar depreciationPct={r.depreciationPct} />
                        <span className={`dep-pct${r.depreciationPct >= 100 ? " dep-pct-full" : ""}`}>
                          {pct(r.depreciationPct)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <p className="dep-note">
        * Assets without purchase cost or purchase date are excluded from financial calculations.
        Global depreciation settings (method, useful life, salvage %) can be configured under Settings → System Preferences.
        Per-asset overrides can be set in Add / Edit Asset.
      </p>
    </div>
  );
}
