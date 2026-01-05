import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Assets.css";

/* ================= MOCK DATA ================= */

const ASSETS = [
  { tag: "AST-1001", name: "Dell Latitude 5420", category: "Laptop", status: "In Use", assignedTo: "Rahul Sharma", entity: "OFB", location: "Gurgaon" },
  { tag: "AST-1002", name: "HP ProDesk", category: "Desktop", status: "Available", assignedTo: "-", entity: "Oxyzo", location: "Delhi" },
  { tag: "AST-1003", name: "MacBook Pro", category: "Laptop", status: "In Use", assignedTo: "Ankit Verma", entity: "Oxyzo", location: "Gurgaon" },
  { tag: "AST-1004", name: "Lenovo ThinkPad", category: "Laptop", status: "Under Repair", assignedTo: "-", entity: "OFB", location: "Mumbai" },
  { tag: "AST-1005", name: "Dell OptiPlex", category: "Desktop", status: "In Use", assignedTo: "Amit Singh", entity: "OFB", location: "Delhi" },
  { tag: "AST-1006", name: "HP EliteBook", category: "Laptop", status: "Available", assignedTo: "-", entity: "Oxyzo", location: "Mumbai" },
];

const ENTITY_COLORS = {
  OFB: "#9333EA",
  Oxyzo: "#22C55E",
};

const STATUS_COLORS = {
  "In Use": "#2563EB",
  "Available": "#16A34A",
  "Under Repair": "#F97316",
  "Retired": "#6B7280",
};

/* ================= COMPONENT ================= */

export default function Assets() {
  const navigate = useNavigate();
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("tag");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [tooltip, setTooltip] = useState(null);

  /* ================= KPI ================= */

  const kpis = useMemo(() => ({
    total: ASSETS.length,
    inUse: ASSETS.filter(a => a.status === "In Use").length,
    available: ASSETS.filter(a => a.status === "Available").length,
    repair: ASSETS.filter(a => a.status === "Under Repair").length,
    retired: ASSETS.filter(a => a.status === "Retired").length,
  }), []);

  /* ================= COUNTS ================= */

  const entityCounts = useMemo(() => {
    const map = {};
    ASSETS.forEach(a => (map[a.entity] = (map[a.entity] || 0) + 1));
    return map;
  }, []);

  const statusCounts = useMemo(() => {
    const map = {};
    ASSETS.forEach(a => (map[a.status] = (map[a.status] || 0) + 1));
    return map;
  }, []);

  /* ================= FILTER ================= */

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ASSETS.filter(a =>
      (!selectedEntity || a.entity === selectedEntity) &&
      (a.tag.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.assignedTo.toLowerCase().includes(q))
    );
  }, [search, selectedEntity]);

  /* ================= SORT ================= */

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const x = a[sortKey]?.toString().toLowerCase();
      const y = b[sortKey]?.toString().toLowerCase();
      return sortDir === "asc" ? x.localeCompare(y) : y.localeCompare(x);
    });
  }, [filtered, sortKey, sortDir]);

  /* ================= PAGINATION ================= */

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageData = sorted.slice(start, end);

  useEffect(() => setPage(1), [search, selectedEntity, pageSize]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  /* ================= PIE MATH ================= */

  const RADIUS = 70;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  let offset = 0;
  const pieSlices = Object.entries(entityCounts).map(([entity, count]) => {
    const value = (count / kpis.total) * CIRCUMFERENCE;
    const slice = {
      entity,
      count,
      dashArray: `${value} ${CIRCUMFERENCE - value}`,
      dashOffset: offset,
    };
    offset -= value;
    return slice;
  });

  return (
    <div className="assets-page">

 {/* PAGE HEADER */}
<div className="assets-header">
  <div>
    <h1>Assets</h1>
    <p className="assets-subtitle">Centralized inventory across entities</p>
  </div>

  <div className="asset-actions">
    <button className="asset-action-btn primary" onClick={() => navigate("/assets/add")}>+ Add Asset</button>
    <button className="asset-action-btn primary" onClick={() => navigate("/assets/allocate")}>Allocate</button>
    <button className="asset-action-btn primary" onClick={() => {alert("Import clicked");}}>Import</button>
    <button className="asset-action-btn primary" onClick={() => {alert("Export clicked");}}>Export</button>
  </div>
</div>


      {/* KPI */}
      <div className="asset-kpis">
        <Kpi label="Total Assets" value={kpis.total} />
        <Kpi label="In Use" value={kpis.inUse} />
        <Kpi label="Available" value={kpis.available} />
        <Kpi label="Under Repair" value={kpis.repair} />
        <Kpi label="Retired" value={kpis.retired} />
      </div>

      {/* CHARTS */}
      <div className="charts-row">

        {/* ENTITY PIE */}
        <div className="chart-card">
          <h3>Assets by Entity</h3>

          <div className="donut-wrapper">
            <svg viewBox="0 0 200 200" className="donut">
              <defs>
                <filter id="donutShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow
                    dx="0"
                    dy="4"
                    stdDeviation="4"
                    floodColor="#000"
                    floodOpacity="0.22"
                  />
                </filter>
              </defs>

              {pieSlices.map(s => (
                <circle
                  key={s.entity}
                  r={RADIUS}
                  cx="100"
                  cy="100"
                  fill="transparent"
                  stroke={ENTITY_COLORS[s.entity]}
                  strokeWidth="22"
                  strokeDasharray={s.dashArray}
                  strokeDashoffset={s.dashOffset}
                  filter="url(#donutShadow)"
                  className={`donut-slice ${selectedEntity === s.entity ? "active" : ""}`}
                  onMouseMove={(e) => {
                    const percent = ((s.count / kpis.total) * 100).toFixed(1);
                    setTooltip({
                      x: e.clientX,
                      y: e.clientY,
                      text: `${s.entity}: ${s.count} assets (${percent}%)`,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={() =>
                    setSelectedEntity(prev => prev === s.entity ? null : s.entity)
                  }
                />
              ))}

              {/* Inner highlight ring for depth */}
              <circle
                r={RADIUS - 13}
                cx="100"
                cy="100"
                fill="transparent"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="2"
              />
            </svg>

            <div className="donut-center">
              <strong>{kpis.total}</strong>
              <span>Total</span>
            </div>

            {tooltip && (
              <div
                className="chart-tooltip"
                style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
              >
                {tooltip.text}
              </div>
            )}
          </div>

          <div className="legend">
            {Object.entries(entityCounts).map(([e, c]) => (
              <div
                key={e}
                className={`legend-item ${selectedEntity === e ? "active" : ""}`}
                onClick={() => setSelectedEntity(prev => prev === e ? null : e)}
              >
                <span style={{ background: ENTITY_COLORS[e] }} />
                {e} ({c})
              </div>
            ))}
          </div>
        </div>

        {/* STATUS BARS */}
        <div className="chart-card">
          <h3>Assets by Status</h3>
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="status-row">
              <span>{status}</span>
              <div className="status-bar">
                <div
                  className="fill"
                  style={{
                    width: `${(count / kpis.total) * 100}%`,
                    background: STATUS_COLORS[status],
                  }}
                />
              </div>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* FILTERS */}
      <div className="asset-filters">
        <input
          placeholder="Search assets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select value={pageSize} onChange={e => setPageSize(+e.target.value)}>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
          <option value={500}>500 / page</option>
        </select>

        {selectedEntity && (
          <button onClick={() => setSelectedEntity(null)}>
            Clear Entity Filter
          </button>
        )}
      </div>

      {/* TABLE */}
      <div className="asset-table-wrapper">
        <table>
          <thead>
            <tr>
              {["tag","name","category","status","assignedTo","entity","location"].map(col => (
                <th key={col} onClick={() => toggleSort(col)}>
                  {col.toUpperCase()}
                  {sortKey === col && (sortDir === "asc" ? " ▲" : " ▼")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map(a => (
              <tr key={a.tag}>
                <td>{a.tag}</td>
                <td>{a.name}</td>
                <td>{a.category}</td>
		<td>{a.status}</td>
                <td>{a.assignedTo}</td>
                <td>{a.entity}</td>
                <td>{a.location}</td>
		<td>{a.status === "In Use" ? (<button className="row-action-btn warning" onClick={() => navigate(`/assets/handover?assetId=${a.tag}`)}>Handover</button>) :
                     a.status === "Available" ? (<button className="row-action-btn" onClick={() => navigate(`/assets/allocate?assetId=${a.tag}`)}>Allocate</button>) : (
                     <span className="disabled-action">—</span>)}</td>
              </tr>
            ))}

          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="pagination">
        <span>
          Showing {start + 1}–{Math.min(end, sorted.length)} of {sorted.length}
        </span>
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>◀</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>▶</button>
      </div>

    </div>
  );
}

/* ================= KPI ================= */

function Kpi({ label, value }) {
  return (
    <div className="kpi-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

