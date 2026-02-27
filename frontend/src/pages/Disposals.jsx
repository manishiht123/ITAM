import { useEffect, useState, useMemo } from "react";
import { useEntity } from "../context/EntityContext";
import { PageLayout, Card, Spinner } from "../components/ui";
import {
  FaRecycle, FaSearch, FaDownload, FaBoxOpen,
  FaRupeeSign, FaWrench, FaExclamationTriangle, FaFilter
} from "react-icons/fa";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import GenericDoughnutPie from "../components/charts/GenericDoughnutPie";
import "./Disposals.css";

// ── helpers ─────────────────────────────────────────────────────────────────

const fmtValue = (v) => {
  if (!v || v === "" || v === "0") return "—";
  const n = parseFloat(v);
  return isNaN(n) ? v : `₹${n.toLocaleString("en-IN")}`;
};

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const REASON_COLORS = {
  "End of Life":                     { bg: "rgba(239,68,68,0.1)",   color: "#dc2626" },
  "Physical Damage / Beyond Repair": { bg: "rgba(245,158,11,0.1)",  color: "#d97706" },
  "Technology Upgrade":              { bg: "rgba(37,99,235,0.1)",   color: "#2563eb" },
  "Theft / Loss":                    { bg: "rgba(219,39,119,0.1)",  color: "#db2777" },
  "Surplus / No Longer Needed":      { bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
  "Warranty Expired":                { bg: "rgba(124,58,237,0.1)",  color: "#7c3aed" },
  "Other":                           { bg: "rgba(22,163,74,0.1)",   color: "#16a34a" },
};

const METHOD_COLORS = {
  "Scrap":            { bg: "rgba(239,68,68,0.1)",   color: "#dc2626" },
  "Sell":             { bg: "rgba(22,163,74,0.1)",   color: "#16a34a" },
  "Donate":           { bg: "rgba(37,99,235,0.1)",   color: "#2563eb" },
  "Recycle":          { bg: "rgba(5,150,105,0.1)",   color: "#059669" },
  "Return to Vendor": { bg: "rgba(124,58,237,0.1)",  color: "#7c3aed" },
  "Destroy":          { bg: "rgba(245,158,11,0.1)",  color: "#d97706" },
  "Other":            { bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
};

const DISPOSAL_REASONS = ["End of Life", "Physical Damage / Beyond Repair", "Technology Upgrade", "Theft / Loss", "Surplus / No Longer Needed", "Warranty Expired", "Other"];
const DISPOSAL_METHODS  = ["Scrap", "Sell", "Donate", "Recycle", "Return to Vendor", "Destroy", "Other"];

// ── component ────────────────────────────────────────────────────────────────

export default function Disposals() {
  const { entity } = useEntity();
  const toast = useToast();

  const [disposals, setDisposals]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [filterReason, setFilterReason] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [sortKey, setSortKey]           = useState("disposalDate");
  const [sortDir, setSortDir]           = useState("desc");

  useEffect(() => { loadDisposals(); }, [entity]);

  const loadDisposals = async () => {
    setLoading(true);
    try {
      const entityCode = (!entity || entity === "ALL") ? null : entity;
      const data = await api.getAssetDisposals(entityCode);
      setDisposals(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || "Failed to load disposal records");
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortInd = ({ col }) => (
    sortKey === col
      ? <span className="disp-sort active">{sortDir === "asc" ? "↑" : "↓"}</span>
      : <span className="disp-sort">↕</span>
  );

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const total    = disposals.length;
    const recovery = disposals.reduce((s, d) => {
      const v = parseFloat(d.saleValue || 0);
      return s + (isNaN(v) ? 0 : v);
    }, 0);
    const byMethod = disposals.reduce((acc, d) => {
      const m = d.disposalMethod || "Other";
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {});
    const methodEntries = Object.entries(byMethod).sort((a, b) => b[1] - a[1]);
    const topMethod = methodEntries[0]?.[0] || "—";
    const byReason  = disposals.reduce((acc, d) => {
      const r = d.disposalReason || "Other";
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {});
    const reasonEntries = Object.entries(byReason).sort((a, b) => b[1] - a[1]);
    const topReason = reasonEntries[0]?.[0] || "—";
    return { total, recovery, topMethod, topReason, byMethod: methodEntries, byReason };
  }, [disposals]);

  // ── Pie chart data ────────────────────────────────────────────────────────

  const REASON_HEX = Object.fromEntries(
    Object.entries(REASON_COLORS).map(([k, v]) => [k, v.color])
  );
  const METHOD_HEX = Object.fromEntries(
    Object.entries(METHOD_COLORS).map(([k, v]) => [k, v.color])
  );

  const reasonPieData = useMemo(() =>
    Object.entries(kpis.byReason)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value })),
    [kpis.byReason]
  );

  const methodPieData = useMemo(() =>
    kpis.byMethod.map(([label, value]) => ({ label, value })),
    [kpis.byMethod]
  );

  // ── Filter + Sort ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = disposals;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        (d.assetId      || "").toLowerCase().includes(q) ||
        (d.assetName    || "").toLowerCase().includes(q) ||
        (d.category     || "").toLowerCase().includes(q) ||
        (d.entity       || "").toLowerCase().includes(q) ||
        (d.authorizedBy || "").toLowerCase().includes(q) ||
        (d.performedBy  || "").toLowerCase().includes(q)
      );
    }
    if (filterReason) list = list.filter(d => d.disposalReason === filterReason);
    if (filterMethod) list = list.filter(d => d.disposalMethod === filterMethod);

    return [...list].sort((a, b) => {
      const aV = sortKey === "disposalDate"
        ? new Date(a[sortKey] || 0)
        : String(a[sortKey] || "");
      const bV = sortKey === "disposalDate"
        ? new Date(b[sortKey] || 0)
        : String(b[sortKey] || "");
      if (aV < bV) return sortDir === "asc" ? -1 : 1;
      if (aV > bV) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
  }, [disposals, search, filterReason, filterMethod, sortKey, sortDir]);

  // ── CSV Export ────────────────────────────────────────────────────────────

  const exportCSV = () => {
    const headers = ["Asset ID","Name","Category","Serial Number","Entity","Disposal Reason","Disposal Method","Disposal Date","Sale Value","Purchase Price","Authorized By","Performed By","Notes"];
    const rows = filtered.map(d => [
      d.assetId, d.assetName, d.category, d.serialNumber, d.entity,
      d.disposalReason, d.disposalMethod, d.disposalDate,
      d.saleValue, d.purchasePrice, d.authorizedBy, d.performedBy,
      (d.notes || "").replace(/,/g, ";")
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${c || ""}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `asset-disposals-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = search || filterReason || filterMethod;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <PageLayout>
      <PageLayout.Header
        title="Asset Disposals"
        subtitle="Complete audit trail of all disposed and retired assets"
        actions={
          <button className="disp-export-btn" onClick={exportCSV}>
            <FaDownload /> Export CSV
          </button>
        }
      />

      <PageLayout.Content>

        {/* ── KPI CARDS ─────────────────────────────────────────── */}
        <div className="disp-kpi-row">
          <div className="disp-kpi-card disp-kpi-red">
            <div className="disp-kpi-icon-wrap disp-kpi-icon-red">
              <FaBoxOpen />
            </div>
            <div className="disp-kpi-body">
              <div className="disp-kpi-label">Total Disposed</div>
              <div className="disp-kpi-value">{kpis.total}</div>
              <div className="disp-kpi-sub">All time records</div>
            </div>
          </div>

          <div className="disp-kpi-card disp-kpi-green">
            <div className="disp-kpi-icon-wrap disp-kpi-icon-green">
              <FaRupeeSign />
            </div>
            <div className="disp-kpi-body">
              <div className="disp-kpi-label">Recovery Value</div>
              <div className="disp-kpi-value">
                {kpis.recovery > 0 ? `₹${kpis.recovery.toLocaleString("en-IN")}` : "₹0"}
              </div>
              <div className="disp-kpi-sub">Total from sales</div>
            </div>
          </div>

          <div className="disp-kpi-card disp-kpi-blue">
            <div className="disp-kpi-icon-wrap disp-kpi-icon-blue">
              <FaWrench />
            </div>
            <div className="disp-kpi-body">
              <div className="disp-kpi-label">Top Method</div>
              <div className="disp-kpi-value disp-kpi-value-sm">{kpis.topMethod}</div>
              <div className="disp-kpi-sub">Most used disposal method</div>
            </div>
          </div>

          <div className="disp-kpi-card disp-kpi-amber">
            <div className="disp-kpi-icon-wrap disp-kpi-icon-amber">
              <FaExclamationTriangle />
            </div>
            <div className="disp-kpi-body">
              <div className="disp-kpi-label">Top Reason</div>
              <div className="disp-kpi-value disp-kpi-value-sm">{kpis.topReason}</div>
              <div className="disp-kpi-sub">Most common disposal reason</div>
            </div>
          </div>
        </div>

        {/* ── CHARTS ROW ───────────────────────────────────────── */}
        {disposals.length > 0 && (
          <div className="disp-charts-row">
            <Card>
              <Card.Header>
                <Card.Title>Disposals by Reason</Card.Title>
              </Card.Header>
              <Card.Body>
                <GenericDoughnutPie data={reasonPieData} colors={REASON_HEX} centerLabel="Disposals" />
              </Card.Body>
            </Card>
            <Card>
              <Card.Header>
                <Card.Title>Disposals by Method</Card.Title>
              </Card.Header>
              <Card.Body>
                <GenericDoughnutPie data={methodPieData} colors={METHOD_HEX} centerLabel="Disposals" />
              </Card.Body>
            </Card>
          </div>
        )}

        {/* ── FILTER BAR ───────────────────────────────────────── */}
        <div className="disp-toolbar">
          <div className="disp-search-wrap">
            <FaSearch className="disp-search-icon" />
            <input
              className="disp-search"
              placeholder="Search by Asset ID, Name, Category, Entity…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="disp-filters-group">
            <FaFilter className="disp-filter-icon" />
            <select className="disp-select" value={filterReason} onChange={e => setFilterReason(e.target.value)}>
              <option value="">All Reasons</option>
              {DISPOSAL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select className="disp-select" value={filterMethod} onChange={e => setFilterMethod(e.target.value)}>
              <option value="">All Methods</option>
              {DISPOSAL_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {hasFilters && (
            <button
              className="disp-clear-filters-btn"
              onClick={() => { setSearch(""); setFilterReason(""); setFilterMethod(""); }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* ── TABLE ───────────────────────────────────────────── */}
        <Card>
          <Card.Body style={{ padding: 0 }}>
            {loading ? (
              <div className="disp-center"><Spinner size="md" /></div>
            ) : filtered.length === 0 ? (
              <div className="disp-empty">
                <div className="disp-empty-icon-wrap">
                  <FaRecycle className="disp-empty-icon" />
                </div>
                <p className="disp-empty-title">No disposal records found</p>
                <p className="disp-empty-sub">
                  {hasFilters ? "Try clearing your filters to see all records." : "Retired assets will appear here once processed."}
                </p>
                {hasFilters && (
                  <button className="disp-clear-btn" onClick={() => { setSearch(""); setFilterReason(""); setFilterMethod(""); }}>
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="disp-table-wrap">
                <table className="disp-table">
                  <thead>
                    <tr>
                      <th className="sortable" onClick={() => toggleSort("assetId")}>Asset ID <SortInd col="assetId" /></th>
                      <th className="sortable" onClick={() => toggleSort("assetName")}>Name <SortInd col="assetName" /></th>
                      <th className="sortable" onClick={() => toggleSort("category")}>Category <SortInd col="category" /></th>
                      <th className="sortable" onClick={() => toggleSort("entity")}>Entity <SortInd col="entity" /></th>
                      <th className="sortable" onClick={() => toggleSort("disposalReason")}>Reason <SortInd col="disposalReason" /></th>
                      <th className="sortable" onClick={() => toggleSort("disposalMethod")}>Method <SortInd col="disposalMethod" /></th>
                      <th className="sortable" onClick={() => toggleSort("disposalDate")}>Date <SortInd col="disposalDate" /></th>
                      <th>Sale Value</th>
                      <th>Purchase Price</th>
                      <th>Authorized By</th>
                      <th>Performed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d, i) => {
                      const rs = REASON_COLORS[d.disposalReason] || REASON_COLORS["Other"];
                      const ms = METHOD_COLORS[d.disposalMethod] || METHOD_COLORS["Other"];
                      const saleNum = parseFloat(d.saleValue || 0);
                      return (
                        <tr key={d.id || i}>
                          <td>
                            <span className="disp-asset-id">{d.assetId || "—"}</span>
                          </td>
                          <td className="disp-name-cell">{d.assetName || "—"}</td>
                          <td>
                            {d.category
                              ? <span className="disp-category-tag">{d.category}</span>
                              : "—"}
                          </td>
                          <td>
                            {d.entity
                              ? <span className="disp-entity-badge">{d.entity}</span>
                              : "—"}
                          </td>
                          <td>
                            <span className="disp-pill" style={{ background: rs.bg, color: rs.color }}>
                              {d.disposalReason || "—"}
                            </span>
                          </td>
                          <td>
                            <span className="disp-pill" style={{ background: ms.bg, color: ms.color }}>
                              {d.disposalMethod || "—"}
                            </span>
                          </td>
                          <td className="disp-date-cell">{fmtDate(d.disposalDate)}</td>
                          <td className="disp-num-cell" style={{ color: saleNum > 0 ? "#16a34a" : undefined, fontWeight: saleNum > 0 ? 700 : undefined }}>
                            {fmtValue(d.saleValue)}
                          </td>
                          <td className="disp-num-cell disp-muted">{fmtValue(d.purchasePrice)}</td>
                          <td className="disp-muted">{d.authorizedBy || "—"}</td>
                          <td className="disp-muted">{d.performedBy || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Body>
        </Card>

        {!loading && filtered.length > 0 && (
          <div className="disp-footer-count">
            Showing <strong>{filtered.length}</strong> of <strong>{disposals.length}</strong> disposal records
          </div>
        )}

      </PageLayout.Content>
    </PageLayout>
  );
}
