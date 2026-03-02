import { useEffect, useState, useMemo, useCallback } from "react";
import { useEntity } from "../context/EntityContext";
import { useToast } from "../context/ToastContext";
import { PageLayout, Card, Spinner } from "../components/ui";
import {
  FaBuilding, FaMapMarkerAlt, FaDownload, FaSearch,
  FaBoxes, FaCheckCircle, FaTools, FaArrowUp, FaArrowDown, FaMinus
} from "react-icons/fa";
import GenericDoughnutPie from "../components/charts/GenericDoughnutPie";
import api from "../services/api";
import "./DeptLocationReport.css";

// ── palette for chart colours ─────────────────────────────────────────────────
const PALETTE = [
  "#3b82f6","#22c55e","#f59e0b","#a78bfa","#f43f5e",
  "#14b8a6","#f97316","#6366f1","#84cc16","#ec4899",
  "#0891b2","#d97706"
];

const STATUS_COLORS = {
  inUse:       "#3b82f6",
  available:   "#22c55e",
  underRepair: "#f97316",
  retired:     "#ef4444",
  other:       "#94a3b8",
};

// ── helpers ───────────────────────────────────────────────────────────────────
const pct = (num, total) => total > 0 ? Math.round((num / total) * 100) : 0;

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

// ── component ─────────────────────────────────────────────────────────────────
export default function DeptLocationReport() {
  const { entity } = useEntity();
  const toast = useToast();

  const [tab, setTab]           = useState("department"); // "department" | "location"
  const [deptData, setDeptData] = useState([]);
  const [locData,  setLocData]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search,   setSearch]   = useState("");
  const [sortKey,  setSortKey]  = useState("total");
  const [sortDir,  setSortDir]  = useState("desc");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dept, loc] = await Promise.all([
        api.getReportByDepartment(entity === "ALL" ? null : entity),
        api.getReportByLocation(entity === "ALL" ? null : entity),
      ]);
      setDeptData(Array.isArray(dept) ? dept : []);
      setLocData(Array.isArray(loc)  ? loc  : []);
    } catch (err) {
      toast.error(err.message || "Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, [entity]);

  useEffect(() => { load(); }, [load]);

  // active dataset
  const rawRows = tab === "department" ? deptData : locData;

  // search + sort
  const rows = useMemo(() => {
    let list = rawRows;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [rawRows, search, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <FaMinus className="dlr-sort-icon muted" />;
    return sortDir === "asc"
      ? <FaArrowUp  className="dlr-sort-icon active" />
      : <FaArrowDown className="dlr-sort-icon active" />;
  };

  // KPIs
  const kpis = useMemo(() => {
    const totalGroups = rawRows.length;
    const totalAssets = rawRows.reduce((s, r) => s + r.total, 0);
    const totalInUse  = rawRows.reduce((s, r) => s + r.inUse, 0);
    const avgUtil     = totalAssets > 0 ? Math.round((totalInUse / totalAssets) * 100) : 0;
    const topGroup    = rawRows[0]?.name || "—";
    return { totalGroups, totalAssets, avgUtil, topGroup };
  }, [rawRows]);

  // Pie: distribution of total assets across groups (top 10)
  const pieData = useMemo(() =>
    rows.slice(0, 10).map((r) => ({ label: r.name, value: r.total })),
    [rows]
  );
  const pieColors = useMemo(() => {
    const c = {};
    rows.slice(0, 10).forEach((r, i) => { c[r.name] = PALETTE[i % PALETTE.length]; });
    return c;
  }, [rows]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = tab === "department"
        ? await api.exportReportByDepartment(entity === "ALL" ? null : entity)
        : await api.exportReportByLocation(entity === "ALL" ? null : entity);
      const date = new Date().toISOString().split("T")[0];
      downloadBlob(blob, `${tab}-report-${date}.csv`);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageLayout>
      <PageLayout.Header
        title="Department & Location Reports"
        subtitle="Asset distribution and utilisation across departments and locations"
        actions={
          <button className="dlr-export-btn" onClick={handleExport} disabled={exporting || loading}>
            <FaDownload />
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        }
      />

      <PageLayout.Content>

        {/* ── Tab bar ─────────────────────────────────────────────── */}
        <div className="dlr-tabs">
          <button
            className={`dlr-tab${tab === "department" ? " active" : ""}`}
            onClick={() => { setTab("department"); setSearch(""); setSortKey("total"); setSortDir("desc"); }}
          >
            <FaBuilding /> Department Report
          </button>
          <button
            className={`dlr-tab${tab === "location" ? " active" : ""}`}
            onClick={() => { setTab("location"); setSearch(""); setSortKey("total"); setSortDir("desc"); }}
          >
            <FaMapMarkerAlt /> Location Report
          </button>
        </div>

        {loading ? (
          <div className="dlr-loading"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* ── KPI cards ─────────────────────────────────────── */}
            <div className="dlr-kpi-row">
              <div className="dlr-kpi-card dlr-kpi-blue">
                <div className="dlr-kpi-icon"><FaBuilding /></div>
                <div className="dlr-kpi-body">
                  <div className="dlr-kpi-label">
                    Total {tab === "department" ? "Departments" : "Locations"}
                  </div>
                  <div className="dlr-kpi-value">{kpis.totalGroups}</div>
                </div>
              </div>
              <div className="dlr-kpi-card dlr-kpi-indigo">
                <div className="dlr-kpi-icon"><FaBoxes /></div>
                <div className="dlr-kpi-body">
                  <div className="dlr-kpi-label">Total Assets</div>
                  <div className="dlr-kpi-value">{kpis.totalAssets}</div>
                </div>
              </div>
              <div className="dlr-kpi-card dlr-kpi-green">
                <div className="dlr-kpi-icon"><FaCheckCircle /></div>
                <div className="dlr-kpi-body">
                  <div className="dlr-kpi-label">Avg Utilization</div>
                  <div className="dlr-kpi-value">{kpis.avgUtil}%</div>
                </div>
              </div>
              <div className="dlr-kpi-card dlr-kpi-amber">
                <div className="dlr-kpi-icon"><FaTools /></div>
                <div className="dlr-kpi-body">
                  <div className="dlr-kpi-label">Top Group</div>
                  <div className="dlr-kpi-value dlr-kpi-value-sm" title={kpis.topGroup}>{kpis.topGroup}</div>
                </div>
              </div>
            </div>

            {/* ── Charts + Table layout ─────────────────────────── */}
            {rawRows.length > 0 ? (
              <div className="dlr-body-grid">

                {/* Pie chart */}
                <Card className="dlr-chart-card">
                  <Card.Header>
                    <Card.Title>Asset Distribution</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <GenericDoughnutPie
                      data={pieData}
                      colors={pieColors}
                      centerLabel="Assets"
                    />
                  </Card.Body>
                </Card>

                {/* Status breakdown mini-chart */}
                <Card className="dlr-chart-card">
                  <Card.Header>
                    <Card.Title>Overall Status Breakdown</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <div className="dlr-status-bars">
                      {[
                        { key: "inUse",       label: "In Use",       color: STATUS_COLORS.inUse },
                        { key: "available",   label: "Available",    color: STATUS_COLORS.available },
                        { key: "underRepair", label: "Under Repair", color: STATUS_COLORS.underRepair },
                        { key: "retired",     label: "Retired",      color: STATUS_COLORS.retired },
                        { key: "other",       label: "Other",        color: STATUS_COLORS.other },
                      ].map(({ key, label, color }) => {
                        const count = rawRows.reduce((s, r) => s + (r[key] || 0), 0);
                        const p = pct(count, kpis.totalAssets);
                        return (
                          <div key={key} className="dlr-status-row">
                            <div className="dlr-status-meta">
                              <span className="dlr-status-dot" style={{ background: color }} />
                              <span className="dlr-status-label">{label}</span>
                              <span className="dlr-status-count">{count}</span>
                            </div>
                            <div className="dlr-bar-wrap">
                              <div className="dlr-bar-fill" style={{ width: `${p}%`, background: color }} />
                            </div>
                            <span className="dlr-status-pct">{p}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </Card.Body>
                </Card>

              </div>
            ) : null}

            {/* ── Search + Table ────────────────────────────────── */}
            <Card style={{ marginTop: "var(--space-lg)" }}>
              <Card.Header>
                <div className="dlr-table-header">
                  <Card.Title>
                    {tab === "department" ? "Department" : "Location"} Breakdown
                  </Card.Title>
                  <div className="dlr-search-wrap">
                    <FaSearch className="dlr-search-icon" />
                    <input
                      className="dlr-search"
                      placeholder={`Search ${tab}…`}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </Card.Header>
              <Card.Body style={{ padding: 0 }}>
                {rows.length === 0 ? (
                  <div className="dlr-empty">
                    <p>No records found.</p>
                  </div>
                ) : (
                  <div className="dlr-table-wrap">
                    <table className="dlr-table">
                      <thead>
                        <tr>
                          <th className="sortable" onClick={() => toggleSort("name")}>
                            {tab === "department" ? "Department" : "Location"} <SortIcon col="name" />
                          </th>
                          <th className="sortable" onClick={() => toggleSort("total")}>Total <SortIcon col="total" /></th>
                          <th className="sortable" onClick={() => toggleSort("inUse")}>In Use <SortIcon col="inUse" /></th>
                          <th className="sortable" onClick={() => toggleSort("available")}>Available <SortIcon col="available" /></th>
                          <th className="sortable" onClick={() => toggleSort("underRepair")}>Under Repair <SortIcon col="underRepair" /></th>
                          <th className="sortable" onClick={() => toggleSort("retired")}>Retired <SortIcon col="retired" /></th>
                          <th className="sortable" onClick={() => toggleSort("utilization")}>Utilization <SortIcon col="utilization" /></th>
                          <th>Top Category</th>
                          <th>Status Mix</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => {
                          const utilColor =
                            row.utilization >= 80 ? "#22c55e" :
                            row.utilization >= 50 ? "#f59e0b" : "#ef4444";
                          return (
                            <tr key={i}>
                              <td>
                                <div className="dlr-group-name">
                                  <span className="dlr-group-icon" style={{ color: PALETTE[i % PALETTE.length] }}>
                                    {tab === "department" ? <FaBuilding /> : <FaMapMarkerAlt />}
                                  </span>
                                  {row.name}
                                </div>
                              </td>
                              <td className="dlr-num-cell dlr-total">{row.total}</td>
                              <td>
                                <span className="dlr-status-badge" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
                                  {row.inUse}
                                </span>
                              </td>
                              <td>
                                <span className="dlr-status-badge" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
                                  {row.available}
                                </span>
                              </td>
                              <td>
                                <span className="dlr-status-badge" style={{ background: "rgba(249,115,22,0.1)", color: "#f97316" }}>
                                  {row.underRepair}
                                </span>
                              </td>
                              <td>
                                <span className="dlr-status-badge" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                                  {row.retired}
                                </span>
                              </td>
                              <td>
                                <div className="dlr-util-cell">
                                  <div className="dlr-util-bar-wrap">
                                    <div
                                      className="dlr-util-bar"
                                      style={{ width: `${row.utilization}%`, background: utilColor }}
                                    />
                                  </div>
                                  <span className="dlr-util-pct" style={{ color: utilColor }}>
                                    {row.utilization}%
                                  </span>
                                </div>
                              </td>
                              <td>
                                <span className="dlr-category-tag">{row.topCategory}</span>
                              </td>
                              <td>
                                <div className="dlr-mini-stacked">
                                  {row.inUse > 0 && (
                                    <div className="dlr-mini-seg" style={{ flex: row.inUse, background: STATUS_COLORS.inUse }} title={`In Use: ${row.inUse}`} />
                                  )}
                                  {row.available > 0 && (
                                    <div className="dlr-mini-seg" style={{ flex: row.available, background: STATUS_COLORS.available }} title={`Available: ${row.available}`} />
                                  )}
                                  {row.underRepair > 0 && (
                                    <div className="dlr-mini-seg" style={{ flex: row.underRepair, background: STATUS_COLORS.underRepair }} title={`Under Repair: ${row.underRepair}`} />
                                  )}
                                  {row.retired > 0 && (
                                    <div className="dlr-mini-seg" style={{ flex: row.retired, background: STATUS_COLORS.retired }} title={`Retired: ${row.retired}`} />
                                  )}
                                  {row.other > 0 && (
                                    <div className="dlr-mini-seg" style={{ flex: row.other, background: STATUS_COLORS.other }} title={`Other: ${row.other}`} />
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card.Body>
            </Card>

            {rows.length > 0 && (
              <div className="dlr-footer">
                Showing <strong>{rows.length}</strong> of <strong>{rawRows.length}</strong> {tab === "department" ? "departments" : "locations"} · <strong>{kpis.totalAssets}</strong> total assets
              </div>
            )}
          </>
        )}

      </PageLayout.Content>
    </PageLayout>
  );
}
