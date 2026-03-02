import { useState, useEffect, useCallback } from "react";
import {
  FaTasks, FaSync, FaCheck, FaTimes,
  FaExchangeAlt, FaTrashAlt, FaClock
} from "react-icons/fa";
import api from "../services/api";
import { useEntity } from "../context/EntityContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "./Approvals.css";

const TYPE_META = {
  transfer: { cls: "appr-type-transfer",  label: "Transfer",  Icon: FaExchangeAlt },
  disposal: { cls: "appr-type-disposal",  label: "Disposal",  Icon: FaTrashAlt   },
};

const STATUS_META = {
  Pending:  { cls: "appr-status-pending",  label: "Pending"  },
  Approved: { cls: "appr-status-approved", label: "Approved" },
  Rejected: { cls: "appr-status-rejected", label: "Rejected" },
};

function TypeBadge({ type }) {
  const meta = TYPE_META[type] || { cls: "appr-badge", label: type };
  return <span className={`appr-badge ${meta.cls}`}>{meta.label}</span>;
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { cls: "appr-badge", label: status };
  return <span className={`appr-badge ${meta.cls}`}>{meta.label}</span>;
}

function detailSummary(approval) {
  const p = approval.payload || {};
  if (approval.requestType === "transfer") {
    return `→ ${p.toEntity || "?"} | ${p.reason || "Transfer"}`;
  }
  return `${p.disposalReason || "Disposal"} · ${p.disposalMethod || ""}`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Approvals() {
  const { entity } = useEntity();
  const { user, isAdmin, hasRole } = useAuth();
  const toast = useToast();

  const isManager = isAdmin || hasRole("manager");

  const [allRows, setAllRows] = useState([]);
  const [myRows, setMyRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(isManager ? "pending" : "my");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Inline reject state: { [id]: { open: boolean, comment: string, busy: boolean } }
  const [rejectState, setRejectState] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [all, my] = await Promise.all([
        isManager ? api.getApprovals(entity, "") : Promise.resolve([]),
        api.getMyApprovals(entity)
      ]);
      setAllRows(all || []);
      setMyRows(my || []);
    } catch (err) {
      toast.error(err.message || "Failed to load approvals");
    } finally {
      setLoading(false);
    }
  }, [entity, isManager]);

  useEffect(() => { load(); }, [load]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const pending   = allRows.filter((r) => r.status === "Pending").length;
  const transfers = allRows.filter((r) => r.requestType === "transfer" && r.status === "Pending").length;
  const disposals = allRows.filter((r) => r.requestType === "disposal" && r.status === "Pending").length;
  const approved  = allRows.filter((r) => r.status === "Approved").length;
  const rejected  = allRows.filter((r) => r.status === "Rejected").length;

  // ── Current dataset ────────────────────────────────────────────────────────
  const currentRows = activeTab === "my" ? myRows : allRows;

  const filtered = currentRows.filter((r) => {
    const q = search.toLowerCase();
    if (q && !`${r.assetId} ${r.assetName} ${r.requestedBy} ${r.entityCode}`.toLowerCase().includes(q)) return false;
    if (filterType   && r.requestType !== filterType)  return false;
    if (filterStatus && r.status      !== filterStatus) return false;
    return true;
  });

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleApprove = async (row) => {
    try {
      await api.reviewApproval(row.id, "approve", "", entity);
      toast.success(`Request for "${row.assetName}" approved.`);
      load();
    } catch (err) {
      toast.error(err.message || "Approval failed");
    }
  };

  const openReject = (id) => setRejectState((s) => ({ ...s, [id]: { open: true, comment: "", busy: false } }));
  const closeReject = (id) => setRejectState((s) => { const n = { ...s }; delete n[id]; return n; });

  const handleRejectSubmit = async (row) => {
    const state = rejectState[row.id] || {};
    setRejectState((s) => ({ ...s, [row.id]: { ...s[row.id], busy: true } }));
    try {
      await api.reviewApproval(row.id, "reject", state.comment || "", entity);
      toast.success(`Request for "${row.assetName}" rejected.`);
      closeReject(row.id);
      load();
    } catch (err) {
      toast.error(err.message || "Rejection failed");
      setRejectState((s) => ({ ...s, [row.id]: { ...s[row.id], busy: false } }));
    }
  };

  return (
    <div className="appr-page">
      {/* ── Header ── */}
      <div className="appr-header">
        <div>
          <h1 className="appr-title">
            <FaTasks className="appr-title-icon" />
            Approval Workflows
          </h1>
          <p className="appr-subtitle">
            Review and approve asset transfer and disposal requests
          </p>
        </div>
        <div className="appr-header-actions">
          <button className="appr-btn appr-btn-ghost" onClick={load} disabled={loading}>
            <FaSync className={loading ? "appr-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Cards (managers only) ── */}
      {isManager && (
        <div className="appr-kpi-row">
          <div className="appr-kpi-card">
            <div className="appr-kpi-icon appr-kpi-yellow"><FaClock /></div>
            <div className="appr-kpi-body">
              <span className="appr-kpi-label">Total Pending</span>
              <span className="appr-kpi-value">{pending}</span>
            </div>
          </div>
          <div className="appr-kpi-card">
            <div className="appr-kpi-icon appr-kpi-purple"><FaExchangeAlt /></div>
            <div className="appr-kpi-body">
              <span className="appr-kpi-label">Transfers</span>
              <span className="appr-kpi-value">{transfers}</span>
            </div>
          </div>
          <div className="appr-kpi-card">
            <div className="appr-kpi-icon appr-kpi-red"><FaTrashAlt /></div>
            <div className="appr-kpi-body">
              <span className="appr-kpi-label">Disposals</span>
              <span className="appr-kpi-value">{disposals}</span>
            </div>
          </div>
          <div className="appr-kpi-card">
            <div className="appr-kpi-icon appr-kpi-green"><FaCheck /></div>
            <div className="appr-kpi-body">
              <span className="appr-kpi-label">Approved</span>
              <span className="appr-kpi-value">{approved}</span>
            </div>
          </div>
          <div className="appr-kpi-card">
            <div className="appr-kpi-icon appr-kpi-red"><FaTimes /></div>
            <div className="appr-kpi-body">
              <span className="appr-kpi-label">Rejected</span>
              <span className="appr-kpi-value">{rejected}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="appr-tabs">
        {isManager && (
          <button
            className={`appr-tab ${activeTab === "pending" ? "appr-tab-active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            All Requests
            {pending > 0 && <span className="appr-tab-badge">{pending}</span>}
          </button>
        )}
        <button
          className={`appr-tab ${activeTab === "my" ? "appr-tab-active" : ""}`}
          onClick={() => setActiveTab("my")}
        >
          My Requests
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="appr-toolbar">
        <input
          className="appr-search"
          placeholder="Search by asset ID, name, requester…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="appr-filter" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option value="transfer">Transfer</option>
          <option value="disposal">Disposal</option>
        </select>
        <select className="appr-filter" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <span className="appr-count">{filtered.length} requests</span>
      </div>

      {/* ── Table ── */}
      <div className="appr-table-wrap">
        {loading ? (
          <div className="appr-loading">Loading approval requests…</div>
        ) : (
          <table className="appr-table">
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Asset Name</th>
                <th>Type</th>
                <th>Entity</th>
                <th>Requested By</th>
                <th>Date</th>
                <th>Details</th>
                <th>Status</th>
                {isManager && activeTab === "pending" && <th>Actions</th>}
                {activeTab !== "pending" && <th>Reviewed By</th>}
                {activeTab !== "pending" && <th>Comments</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isManager && activeTab === "pending" ? 9 : 10} className="appr-empty">
                    {currentRows.length === 0
                      ? (activeTab === "my" ? "You have no approval requests." : "No requests found.")
                      : "No requests match your filters."}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const rs = rejectState[row.id];
                  return (
                    <tr key={row.id}>
                      <td className="appr-id">{row.assetId}</td>
                      <td className="appr-name">{row.assetName || "—"}</td>
                      <td><TypeBadge type={row.requestType} /></td>
                      <td style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>{row.entityCode}</td>
                      <td style={{ fontSize: "var(--text-sm)" }}>{row.requestedBy}</td>
                      <td style={{ fontSize: "var(--text-xs)", whiteSpace: "nowrap" }}>{formatDate(row.createdAt)}</td>
                      <td className="appr-details">{detailSummary(row)}</td>
                      <td><StatusBadge status={row.status} /></td>

                      {/* Actions (pending tab, managers only) */}
                      {isManager && activeTab === "pending" && (
                        <td>
                          {row.status === "Pending" ? (
                            rs?.open ? (
                              <div className="appr-reject-form">
                                <textarea
                                  className="appr-reject-input"
                                  placeholder="Reason for rejection (optional)…"
                                  value={rs.comment}
                                  onChange={(e) => setRejectState((s) => ({ ...s, [row.id]: { ...s[row.id], comment: e.target.value } }))}
                                />
                                <div className="appr-reject-actions">
                                  <button
                                    className="appr-btn appr-btn-reject"
                                    onClick={() => handleRejectSubmit(row)}
                                    disabled={rs.busy}
                                  >
                                    {rs.busy ? "…" : "Confirm Reject"}
                                  </button>
                                  <button className="appr-btn appr-btn-ghost" style={{ padding: "4px 10px", fontSize: "var(--text-xs)" }} onClick={() => closeReject(row.id)}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="appr-actions">
                                <button className="appr-btn appr-btn-approve" onClick={() => handleApprove(row)}>
                                  <FaCheck /> Approve
                                </button>
                                <button className="appr-btn appr-btn-reject" onClick={() => openReject(row.id)}>
                                  <FaTimes /> Reject
                                </button>
                              </div>
                            )
                          ) : (
                            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>—</span>
                          )}
                        </td>
                      )}

                      {/* Reviewed By + Comments (non-pending tab) */}
                      {activeTab !== "pending" && (
                        <>
                          <td style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
                            {row.reviewedBy || "—"}
                          </td>
                          <td className="appr-details">{row.reviewComments || "—"}</td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {!isManager && (
        <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "var(--space-lg)", lineHeight: 1.6 }}>
          * Transfers and disposal requests require manager approval before execution.
          You can track the status of your submitted requests here.
        </p>
      )}
    </div>
  );
}
