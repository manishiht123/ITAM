import { useEffect, useState, useMemo } from "react";
import { FaTimes, FaBoxOpen, FaUser, FaCalendarAlt, FaDownload, FaSearch } from "react-icons/fa";
import "./AllocationHistoryDrawer.css";

const STATUS_META = {
  Active:   { label: "Active",   cls: "ahd-s-active" },
  Returned: { label: "Returned", cls: "ahd-s-returned" },
  Retired:  { label: "Retired",  cls: "ahd-s-retired" },
};

function exportCsv(rows) {
  const headers = [
    "Asset ID", "Asset Name", "Category", "Entity",
    "Employee", "Employee ID", "Department",
    "Allocated On", "Returned On", "Duration", "Status"
  ];
  const lines = rows.map(r =>
    [
      r.assetId, r.assetName, r.category, r.entity,
      r.employee, r.employeeId, r.department,
      r.allocatedOn, r.returnedOn, r.duration, r.status
    ].map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `allocation_history_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AllocationHistoryDrawer({ open, onClose, history = [] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Reset filters when drawer opens
  useEffect(() => {
    if (open) { setSearch(""); setStatusFilter("All"); }
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return history.filter(r => {
      const matchStatus = statusFilter === "All" || r.status === statusFilter;
      const matchSearch = !q || [r.assetId, r.assetName, r.employee, r.employeeId, r.department, r.entity]
        .some(v => String(v ?? "").toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [history, search, statusFilter]);

  // Summary KPIs
  const total    = history.length;
  const active   = history.filter(r => r.status === "Active").length;
  const returned = history.filter(r => r.status === "Returned").length;
  const retired  = history.filter(r => r.status === "Retired").length;

  if (!open) return null;

  return (
    <>
      <div className="ahd-overlay" onClick={onClose} aria-hidden="true" />

      <aside className="ahd-drawer" role="dialog" aria-modal="true" aria-label="Allocation History">

        {/* ── HEADER ── */}
        <div className="ahd-header">
          <div className="ahd-header-left">
            <div className="ahd-header-icon"><FaCalendarAlt /></div>
            <div>
              <div className="ahd-header-title">Allocation History</div>
              <div className="ahd-header-sub">Full custodian chain · Compliance record</div>
            </div>
          </div>
          <div className="ahd-header-actions">
            <button
              className="ahd-export-btn"
              title="Export CSV"
              onClick={() => exportCsv(filtered)}
            >
              <FaDownload /> Export
            </button>
            <button className="ahd-close-btn" onClick={onClose} aria-label="Close">
              <FaTimes />
            </button>
          </div>
        </div>

        {/* ── KPI STRIP ── */}
        <div className="ahd-kpi-strip">
          <div className="ahd-kpi">
            <span className="ahd-kpi-val">{total}</span>
            <span className="ahd-kpi-label">Total Records</span>
          </div>
          <div className="ahd-kpi ahd-kpi-active">
            <span className="ahd-kpi-val">{active}</span>
            <span className="ahd-kpi-label">Currently Active</span>
          </div>
          <div className="ahd-kpi ahd-kpi-returned">
            <span className="ahd-kpi-val">{returned}</span>
            <span className="ahd-kpi-label">Returned</span>
          </div>
          <div className="ahd-kpi ahd-kpi-retired">
            <span className="ahd-kpi-val">{retired}</span>
            <span className="ahd-kpi-label">Retired</span>
          </div>
        </div>

        {/* ── FILTERS ── */}
        <div className="ahd-filters">
          <div className="ahd-search-wrap">
            <FaSearch className="ahd-search-icon" />
            <input
              className="ahd-search"
              type="text"
              placeholder="Search asset, employee, department…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="ahd-status-tabs">
            {["All", "Active", "Returned", "Retired"].map(s => (
              <button
                key={s}
                className={`ahd-tab${statusFilter === s ? " active" : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
                <span className="ahd-tab-count">
                  {s === "All" ? total
                    : s === "Active" ? active
                    : s === "Returned" ? returned
                    : retired}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="ahd-body">
          {filtered.length === 0 ? (
            <div className="ahd-empty">
              <FaBoxOpen className="ahd-empty-icon" />
              <p>No records found</p>
              <span>Try adjusting your search or filter</span>
            </div>
          ) : (
            <div className="ahd-table-wrap">
              <table className="ahd-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Asset ID</th>
                    <th>Asset Name</th>
                    <th>Category</th>
                    <th>Entity</th>
                    <th>Employee</th>
                    <th>Emp ID</th>
                    <th>Department</th>
                    <th>Allocated On</th>
                    <th>Returned On</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, idx) => {
                    const sm = STATUS_META[r.status] || STATUS_META.Active;
                    return (
                      <tr key={idx} className={r.status === "Active" ? "ahd-row-active" : ""}>
                        <td className="ahd-idx">{idx + 1}</td>
                        <td className="ahd-asset-id">{r.assetId}</td>
                        <td className="ahd-asset-name">{r.assetName}</td>
                        <td>{r.category}</td>
                        <td><span className="ahd-entity-tag">{r.entity}</span></td>
                        <td className="ahd-emp-name">{r.employee}</td>
                        <td className="ahd-emp-id">{r.employeeId}</td>
                        <td>{r.department}</td>
                        <td className="ahd-date">{r.allocatedOn}</td>
                        <td className="ahd-date">{r.returnedOn}</td>
                        <td className="ahd-duration">{r.duration}</td>
                        <td>
                          <span className={`ahd-status ${sm.cls}`}>{sm.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="ahd-footer">
          <span className="ahd-footer-note">
            Showing {filtered.length} of {total} records · Auto-generated from asset ledger
          </span>
          <button className="ahd-close-footer-btn" onClick={onClose}>Close</button>
        </div>
      </aside>
    </>
  );
}
