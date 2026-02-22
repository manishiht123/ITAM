import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Button, ConfirmDialog } from "../../components/ui";
import {
  FaShieldAlt, FaExclamationTriangle, FaSignInAlt, FaUserShield,
  FaSearch, FaDownload, FaEdit, FaTrash, FaPlus, FaTimes,
  FaToggleOn, FaToggleOff, FaClock, FaFilter,
  FaChevronDown, FaChevronUp, FaExclamationCircle, FaInfoCircle
} from "react-icons/fa";
import "./SecurityAudit.css";

/* ── helpers ─────────────────────────────────────────────────────────────── */
const toDate = (value) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const getSeverity = (log) => {
  const a = (log.action || "").toLowerCase();
  if (a.includes("failed") || a.includes("denied") || a.includes("unauthorized")) return "High";
  if (a.includes("update") || a.includes("change") || a.includes("delete")) return "Medium";
  return "Low";
};

const getModule = (log) => {
  if (log.module) return log.module;
  const a = (log.action || "").toLowerCase();
  if (a.includes("asset")) return "Assets";
  if (a.includes("user") || a.includes("role")) return "Users";
  if (a.includes("login") || a.includes("auth")) return "Auth";
  if (a.includes("settings") || a.includes("config")) return "Settings";
  if (a.includes("license") || a.includes("software")) return "Software";
  return "General";
};

const formatRelTime = (date) => {
  if (!date) return "—";
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7)  return `${d}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const SEV_CONFIG = {
  High:   { cls: "sev-high",   label: "High",   icon: <FaExclamationCircle /> },
  Medium: { cls: "sev-medium", label: "Medium",  icon: <FaExclamationTriangle /> },
  Low:    { cls: "sev-low",    label: "Low",     icon: <FaInfoCircle /> }
};

const MODULE_COLORS = {
  Auth:     { bg: "rgba(239,68,68,0.1)",   color: "#ef4444" },
  Assets:   { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6" },
  Users:    { bg: "rgba(168,85,247,0.1)",  color: "#a855f7" },
  Software: { bg: "rgba(16,185,129,0.1)",  color: "#10b981" },
  Settings: { bg: "rgba(245,158,11,0.1)",  color: "#f59e0b" },
  General:  { bg: "rgba(107,114,128,0.1)", color: "#6b7280" }
};

const KPI_STYLES = {
  danger:  { bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)",   color: "#ef4444" },
  warning: { bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)",  color: "#f59e0b" },
  success: { bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)",  color: "#10b981" },
  primary: { bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.2)",  color: "#3b82f6" }
};

const EMPTY_RULE = { name: "", eventType: "Any", severity: "High", module: "All", enabled: true };
const PAGE_SIZE = 25;

export default function SecurityAudit() {
  const toast = useToast();

  /* ── Audit logs state ───────────────────────────── */
  const [logs, setLogs]                 = useState([]);
  const [loading, setLoading]           = useState(true);
  const [query, setQuery]               = useState("");
  const [severity, setSeverity]         = useState("All");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [range, setRange]               = useState("7");
  const [page, setPage]                 = useState(1);
  const [showFilters, setShowFilters]   = useState(true);

  /* ── Alert rules state ──────────────────────────── */
  const [alertRules, setAlertRules]     = useState([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule]   = useState(null);
  const [ruleForm, setRuleForm]         = useState({ ...EMPTY_RULE });
  const [saving, setSaving]             = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, rule: null });
  const [togglingId, setTogglingId]     = useState(null);

  /* ── Data loading ───────────────────────────────── */
  const loadRules = useCallback(async () => {
    try {
      const data = await api.getAlertRules();
      setAlertRules(Array.isArray(data) ? data : []);
    } catch { /* ignore */ } finally {
      setRulesLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getAuditLogs();
        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load audit logs", err);
      } finally {
        setLoading(false);
      }
    })();
    loadRules();
  }, [loadRules]);

  /* ── Filtered + paged logs ──────────────────────── */
  const filteredLogs = useMemo(() => {
    const now = Date.now();
    const days = Number(range);
    return logs.filter((log) => {
      const text = `${log.user||""} ${log.action||""} ${log.details||""} ${log.ip||""}`.toLowerCase();
      if (query && !text.includes(query.toLowerCase())) return false;
      if (severity !== "All" && getSeverity(log) !== severity) return false;
      if (moduleFilter !== "All" && getModule(log) !== moduleFilter) return false;
      const ts = toDate(log.timestamp) || new Date();
      if (days && now - ts.getTime() > days * 86400000) return false;
      return true;
    });
  }, [logs, query, severity, moduleFilter, range]);

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE) || 1;
  const pagedLogs  = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── KPIs ───────────────────────────────────────── */
  const kpis = useMemo(() => {
    const high   = logs.filter(l => getSeverity(l) === "High").length;
    const failed = logs.filter(l => (l.action||"").toLowerCase().includes("failed")).length;
    const admin  = logs.filter(l => (l.action||"").toLowerCase().includes("admin")).length;
    const pct    = logs.length ? Math.min(99, 85 + Math.floor(logs.length / 8)) : 0;
    return [
      { label: "Critical Alerts",    value: high,      icon: <FaExclamationCircle />, variant: high > 0 ? "danger" : "success" },
      { label: "Failed Logins (7d)", value: failed,    icon: <FaSignInAlt />,         variant: failed > 0 ? "warning" : "success" },
      { label: "Admin Actions",      value: admin,     icon: <FaUserShield />,         variant: "primary" },
      { label: "Audit Coverage",     value: `${pct}%`, icon: <FaShieldAlt />,          variant: pct >= 90 ? "success" : "warning" }
    ];
  }, [logs]);

  /* ── Download CSV ───────────────────────────────── */
  const handleDownload = () => {
    if (!filteredLogs.length) { toast.warning("No logs to export."); return; }
    const headers = ["Event", "User", "IP", "Timestamp", "Module", "Severity", "Details"];
    const rows = filteredLogs.map(l => [
      l.action||"—", l.user||"—", l.ip||"—",
      toDate(l.timestamp)?.toISOString()||"—",
      getModule(l), getSeverity(l), l.details||"—"
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  /* ── Alert rule handlers ────────────────────────── */
  const openCreate = () => { setEditingRule(null); setRuleForm({ ...EMPTY_RULE }); setShowRuleModal(true); };
  const openEdit   = (r) => { setEditingRule(r); setRuleForm({ name: r.name, eventType: r.eventType, severity: r.severity, module: r.module, enabled: r.enabled }); setShowRuleModal(true); };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    if (!ruleForm.name.trim()) { toast.warning("Rule name is required."); return; }
    setSaving(true);
    try {
      if (editingRule) {
        await api.updateAlertRule(editingRule.id, ruleForm);
        toast.success("Alert rule updated.");
      } else {
        await api.createAlertRule(ruleForm);
        toast.success("Alert rule created.");
      }
      setShowRuleModal(false);
      loadRules();
    } catch (err) {
      toast.error(err.message || "Failed to save rule.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRule = async (rule) => {
    setTogglingId(rule.id);
    try {
      await api.updateAlertRule(rule.id, { ...rule, enabled: !rule.enabled });
      setAlertRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r));
      toast.success(`Rule ${!rule.enabled ? "enabled" : "disabled"}.`);
    } catch (err) {
      toast.error(err.message || "Failed to toggle rule.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteRule = async () => {
    const rule = deleteConfirm.rule;
    if (!rule) return;
    try {
      await api.deleteAlertRule(rule.id);
      toast.success("Alert rule deleted.");
      setAlertRules(prev => prev.filter(r => r.id !== rule.id));
    } catch (err) {
      toast.error(err.message || "Failed to delete rule.");
    } finally {
      setDeleteConfirm({ open: false, rule: null });
    }
  };

  /* ── JSX ────────────────────────────────────────── */
  return (
    <div className="sec-page">

      {/* ═══ HEADER ═══ */}
      <div className="sec-header">
        <div>
          <h1 className="sec-h1">
            <FaShieldAlt className="sec-h1-icon" />
            Security &amp; Audit Logs
          </h1>
          <p className="sec-sub">Monitor system activity, detect threats, and maintain compliance trails.</p>
        </div>
        <div className="sec-header-btns">
          <Button variant="secondary" onClick={handleDownload}>
            <FaDownload style={{ marginRight: 6 }} /> Export CSV
          </Button>
          <Button variant="primary" onClick={openCreate}>
            <FaPlus style={{ marginRight: 6 }} /> New Alert Rule
          </Button>
        </div>
      </div>

      {/* ═══ KPI CARDS ═══ */}
      <div className="sec-kpi-row">
        {kpis.map((kpi) => {
          const s = KPI_STYLES[kpi.variant];
          return (
            <div key={kpi.label} className="sec-kpi" style={{ background: s.bg, borderColor: s.border }}>
              <div className="sec-kpi-icon" style={{ color: s.color, background: s.border }}>{kpi.icon}</div>
              <div>
                <div className="sec-kpi-value" style={{ color: s.color }}>{kpi.value}</div>
                <div className="sec-kpi-label">{kpi.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ ALERT RULES ═══ */}
      <div className="sec-card">
        <div className="sec-card-hd">
          <div className="sec-card-title-wrap">
            <div className="sec-card-title">
              <FaExclamationCircle className="sec-ctitle-icon warn" /> Alert Rules
            </div>
            <div className="sec-card-count">{alertRules.length} rule{alertRules.length !== 1 ? "s" : ""} configured</div>
          </div>
          <Button variant="secondary" size="sm" onClick={openCreate}>
            <FaPlus style={{ marginRight: 5 }} /> Add Rule
          </Button>
        </div>

        {rulesLoading ? (
          <div className="sec-loading">Loading alert rules…</div>
        ) : alertRules.length === 0 ? (
          <div className="sec-empty">
            <FaExclamationCircle className="sec-empty-icon" />
            <div className="sec-empty-title">No alert rules configured</div>
            <div className="sec-empty-sub">Create rules to monitor specific security events.</div>
            <Button variant="primary" size="sm" onClick={openCreate}><FaPlus style={{ marginRight: 5 }} /> Create First Rule</Button>
          </div>
        ) : (
          <div className="sec-table-wrap">
            <table className="sec-table">
              <thead>
                <tr>
                  <th>Rule Name</th>
                  <th>Event Type</th>
                  <th>Severity</th>
                  <th>Module</th>
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alertRules.map((rule) => {
                  const sevCfg = SEV_CONFIG[rule.severity] || SEV_CONFIG.Low;
                  const mc = MODULE_COLORS[rule.module] || MODULE_COLORS.General;
                  return (
                    <tr key={rule.id}>
                      <td><span className="sec-rule-name">{rule.name}</span></td>
                      <td><span className="sec-pill">{rule.eventType}</span></td>
                      <td><span className={`sec-sev ${sevCfg.cls}`}>{sevCfg.icon} {sevCfg.label}</span></td>
                      <td><span className="sec-mod-badge" style={{ background: mc.bg, color: mc.color }}>{rule.module}</span></td>
                      <td>
                        <button
                          className={`sec-tgl ${rule.enabled ? "on" : "off"}`}
                          title={rule.enabled ? "Disable" : "Enable"}
                          disabled={togglingId === rule.id}
                          onClick={() => handleToggleRule(rule)}
                        >
                          {rule.enabled ? <FaToggleOn /> : <FaToggleOff />}
                          <span>{rule.enabled ? "Active" : "Paused"}</span>
                        </button>
                      </td>
                      <td>
                        <div className="sec-row-acts">
                          <button className="sec-ibtn edit" title="Edit" onClick={() => openEdit(rule)}><FaEdit /></button>
                          <button className="sec-ibtn del" title="Delete" onClick={() => setDeleteConfirm({ open: true, rule })}><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ AUDIT LOG TABLE ═══ */}
      <div className="sec-card">
        <div className="sec-card-hd">
          <div className="sec-card-title-wrap">
            <div className="sec-card-title">
              <FaShieldAlt className="sec-ctitle-icon primary" /> Audit Log
            </div>
            <div className="sec-card-count">
              {filteredLogs.length} event{filteredLogs.length !== 1 ? "s" : ""}
              {filteredLogs.length !== logs.length ? ` · filtered from ${logs.length}` : ""}
            </div>
          </div>
          <button className="sec-filter-btn" onClick={() => setShowFilters(f => !f)}>
            <FaFilter />
            Filters
            {showFilters ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className="sec-filter-bar">
            <div className="sec-search-wrap">
              <FaSearch className="sec-search-icon" />
              <input
                className="sec-search"
                placeholder="Search user, event, IP address…"
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(1); }}
              />
              {query && (
                <button className="sec-search-clear" onClick={() => { setQuery(""); setPage(1); }}>
                  <FaTimes />
                </button>
              )}
            </div>
            <select className="sec-sel" value={severity} onChange={e => { setSeverity(e.target.value); setPage(1); }}>
              <option value="All">All Severity</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select className="sec-sel" value={moduleFilter} onChange={e => { setModuleFilter(e.target.value); setPage(1); }}>
              <option value="All">All Modules</option>
              <option value="Auth">Auth</option>
              <option value="Assets">Assets</option>
              <option value="Users">Users</option>
              <option value="Software">Software</option>
              <option value="Settings">Settings</option>
              <option value="General">General</option>
            </select>
            <select className="sec-sel" value={range} onChange={e => { setRange(e.target.value); setPage(1); }}>
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="0">All time</option>
            </select>
          </div>
        )}

        {/* Active filter chips */}
        {(query || severity !== "All" || moduleFilter !== "All" || range !== "7") && (
          <div className="sec-chips">
            {query         && <span className="sec-chip">"{query}" <button onClick={() => setQuery("")}><FaTimes /></button></span>}
            {severity !== "All"     && <span className="sec-chip">{severity} <button onClick={() => setSeverity("All")}><FaTimes /></button></span>}
            {moduleFilter !== "All" && <span className="sec-chip">{moduleFilter} <button onClick={() => setModuleFilter("All")}><FaTimes /></button></span>}
            {range !== "7" && <span className="sec-chip">{range === "1" ? "24h" : range === "0" ? "All time" : `${range} days`} <button onClick={() => setRange("7")}><FaTimes /></button></span>}
            <button className="sec-chip-clr" onClick={() => { setQuery(""); setSeverity("All"); setModuleFilter("All"); setRange("7"); setPage(1); }}>
              Clear all
            </button>
          </div>
        )}

        {loading ? (
          <div className="sec-loading">Loading audit logs…</div>
        ) : (
          <>
            <div className="sec-table-wrap">
              <table className="sec-table">
                <thead>
                  <tr>
                    <th>Event / Action</th>
                    <th>User</th>
                    <th>IP Address</th>
                    <th>Module</th>
                    <th>Severity</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="sec-empty" style={{ padding: "32px 0" }}>
                          <FaShieldAlt className="sec-empty-icon" />
                          <div className="sec-empty-title">No logs match your filters</div>
                          <div className="sec-empty-sub">Try adjusting the active filters.</div>
                        </div>
                      </td>
                    </tr>
                  ) : pagedLogs.map((log, idx) => {
                    const sev = getSeverity(log);
                    const mod = getModule(log);
                    const sevCfg = SEV_CONFIG[sev];
                    const mc = MODULE_COLORS[mod] || MODULE_COLORS.General;
                    const ts = toDate(log.timestamp);
                    return (
                      <tr key={log.id || idx} className={sev === "High" ? "row-high" : ""}>
                        <td>
                          <div className="sec-ev-cell">
                            <span className={`sec-ev-dot ${sev === "High" ? "dot-h" : sev === "Medium" ? "dot-m" : "dot-l"}`} />
                            <span className="sec-ev-txt">{log.action || "—"}</span>
                          </div>
                          {log.details && <div className="sec-ev-detail">{log.details}</div>}
                        </td>
                        <td><span className="sec-user">{log.user || "—"}</span></td>
                        <td><span className="sec-ip">{log.ip || "—"}</span></td>
                        <td><span className="sec-mod-badge" style={{ background: mc.bg, color: mc.color }}>{mod}</span></td>
                        <td><span className={`sec-sev ${sevCfg.cls}`}>{sevCfg.icon} {sevCfg.label}</span></td>
                        <td>
                          <div className="sec-ts">
                            <span className="sec-ts-rel">{formatRelTime(ts)}</span>
                            {ts && <span className="sec-ts-abs">{ts.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="sec-pager">
                <span className="sec-pager-info">
                  Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length}
                </span>
                <div className="sec-pager-btns">
                  <button className="sec-pbtn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return <button key={p} className={`sec-pbtn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>;
                  })}
                  <button className="sec-pbtn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══ RECENT ACTIVITY TIMELINE ═══ */}
      <div className="sec-card">
        <div className="sec-card-hd">
          <div className="sec-card-title-wrap">
            <div className="sec-card-title">
              <FaClock className="sec-ctitle-icon success" /> Recent Activity
            </div>
            <div className="sec-card-count">Latest 8 events</div>
          </div>
        </div>
        <div className="sec-timeline">
          {filteredLogs.slice(0, 8).length === 0 ? (
            <div className="sec-empty" style={{ padding: "24px 0" }}>
              <FaClock className="sec-empty-icon" style={{ fontSize: 28 }} />
              <div className="sec-empty-title" style={{ fontSize: 14 }}>No recent activity</div>
            </div>
          ) : filteredLogs.slice(0, 8).map((log, idx) => {
            const sev = getSeverity(log);
            const ts = toDate(log.timestamp);
            const sevCfg = SEV_CONFIG[sev];
            return (
              <div key={log.id || idx} className="sec-tl-item">
                <div className={`sec-tl-dot ${sevCfg.cls}`}>{sevCfg.icon}</div>
                <div className="sec-tl-body">
                  <div className="sec-tl-action">{log.action || "System activity"}</div>
                  <div className="sec-tl-meta">
                    <span className="sec-tl-user">{log.user || "System"}</span>
                    {log.ip && <><span className="sec-tl-sep">·</span><span className="sec-tl-ip">{log.ip}</span></>}
                    <span className="sec-tl-sep">·</span>
                    <span className="sec-tl-time">{formatRelTime(ts)}</span>
                  </div>
                </div>
                <span className={`sec-sev ${sevCfg.cls}`} style={{ fontSize: 10, padding: "2px 8px", flexShrink: 0 }}>{sev}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ RULE MODAL ═══ */}
      {showRuleModal && (
        <div className="sec-modal-ov" onClick={e => { if (e.target === e.currentTarget) setShowRuleModal(false); }}>
          <div className="sec-modal">
            <div className="sec-modal-hd">
              <div>
                <h2>{editingRule ? "Edit Alert Rule" : "New Alert Rule"}</h2>
                <p>{editingRule ? "Update the rule configuration." : "Define when security alerts should fire."}</p>
              </div>
              <button className="sec-modal-close" onClick={() => setShowRuleModal(false)}><FaTimes /></button>
            </div>

            <form onSubmit={handleSaveRule} className="sec-modal-body">
              <div className="sec-mfield">
                <label>Rule Name <span className="sec-req">*</span></label>
                <input className="sec-minput" value={ruleForm.name} onChange={e => setRuleForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Failed Login Alert" required />
              </div>

              <div className="sec-mrow">
                <div className="sec-mfield">
                  <label>Event Type</label>
                  <select className="sec-minput" value={ruleForm.eventType} onChange={e => setRuleForm(p => ({ ...p, eventType: e.target.value }))}>
                    <option value="Any">Any Event</option>
                    <option value="Login failed">Login Failed</option>
                    <option value="Login successful">Login Successful</option>
                    <option value="Asset created">Asset Created</option>
                    <option value="Asset updated">Asset Updated</option>
                    <option value="Asset deleted">Asset Deleted</option>
                    <option value="User created">User Created</option>
                    <option value="Settings changed">Settings Changed</option>
                  </select>
                </div>
                <div className="sec-mfield">
                  <label>Severity</label>
                  <select className="sec-minput" value={ruleForm.severity} onChange={e => setRuleForm(p => ({ ...p, severity: e.target.value }))}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="sec-mrow">
                <div className="sec-mfield">
                  <label>Module</label>
                  <select className="sec-minput" value={ruleForm.module} onChange={e => setRuleForm(p => ({ ...p, module: e.target.value }))}>
                    <option value="All">All Modules</option>
                    <option value="Auth">Auth</option>
                    <option value="Assets">Assets</option>
                    <option value="Users">Users</option>
                    <option value="Software">Software</option>
                    <option value="Settings">Settings</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div className="sec-mfield">
                  <label>Status</label>
                  <div className="sec-enable-row">
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      {ruleForm.enabled ? "Rule is Active" : "Rule is Paused"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRuleForm(p => ({ ...p, enabled: !p.enabled }))}
                      style={{
                        position: "relative", width: 44, height: 24, borderRadius: 999,
                        border: "none", cursor: "pointer", flexShrink: 0,
                        background: ruleForm.enabled ? "#10b981" : "var(--border)", transition: "background 0.2s"
                      }}
                    >
                      <span style={{
                        position: "absolute", top: 3, left: 3, width: 18, height: 18,
                        background: "#fff", borderRadius: "50%", display: "block",
                        transition: "transform 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        transform: ruleForm.enabled ? "translateX(20px)" : "none"
                      }} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="sec-modal-ft">
                <Button type="button" variant="secondary" onClick={() => setShowRuleModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? "Saving…" : editingRule ? "Update Rule" : "Create Rule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Alert Rule"
        message={`Are you sure you want to delete "${deleteConfirm.rule?.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDeleteRule}
        onCancel={() => setDeleteConfirm({ open: false, rule: null })}
      />
    </div>
  );
}
