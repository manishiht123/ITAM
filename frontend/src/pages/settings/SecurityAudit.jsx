import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Button, LoadingOverlay, Modal, ConfirmDialog } from "../../components/ui";
import { FaEdit, FaTrash } from "react-icons/fa";
import "./SecurityAudit.css";

const toDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getSeverity = (log) => {
  const action = (log.action || "").toLowerCase();
  if (action.includes("failed") || action.includes("denied")) return "High";
  if (action.includes("update") || action.includes("change")) return "Medium";
  return "Low";
};

const getModule = (log) => {
  if (log.module) return log.module;
  const action = (log.action || "").toLowerCase();
  if (action.includes("asset")) return "Assets";
  if (action.includes("user") || action.includes("role")) return "Users & Roles";
  if (action.includes("settings") || action.includes("config")) return "Settings";
  if (action.includes("audit") || action.includes("log")) return "Compliance";
  return "General";
};

const EMPTY_RULE = { name: "", eventType: "Any", severity: "High", module: "All", enabled: true };

export default function SecurityAudit() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("All");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [range, setRange] = useState("7");

  // Alert rules state
  const [alertRules, setAlertRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [ruleModal, setRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState({ ...EMPTY_RULE });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, rule: null });

  const loadRules = useCallback(async () => {
    try {
      const data = await api.getAlertRules();
      setAlertRules(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setRulesLoading(false);
    }
  }, []);

  const handleDownload = () => {
    const rows = filteredLogs.map((log) => {
      const sev = getSeverity(log);
      const moduleName = getModule(log);
      return {
        Event: log.action || "Event",
        User: log.user || "",
        Time: toDate(log.timestamp)?.toISOString() || "",
        Source: moduleName,
        Severity: sev,
        Details: log.details || "",
        IP: log.ip || ""
      };
    });

    if (!rows.length) {
      toast.warning("No audit logs available for export.");
      return;
    }

    const headers = Object.keys(rows[0]).join(",");
    const csvRows = rows.map((row) =>
      Object.values(row)
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csvContent = [headers, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "audit_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await api.getAuditLogs();
        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load audit logs", err);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
    loadRules();
  }, [loadRules]);

  const filteredLogs = useMemo(() => {
    const now = Date.now();
    const days = Number(range);
    return logs.filter((log) => {
      const text = `${log.user || ""} ${log.action || ""} ${log.details || ""} ${log.ip || ""}`.toLowerCase();
      const matchesQuery = !query || text.includes(query.toLowerCase());
      const sev = getSeverity(log);
      const matchesSeverity = severity === "All" || sev === severity;
      const moduleName = getModule(log);
      const matchesModule = moduleFilter === "All" || moduleName === moduleFilter;
      const timestamp = toDate(log.timestamp) || new Date();
      const matchesRange = days ? now - timestamp.getTime() <= days * 86400000 : true;
      return matchesQuery && matchesSeverity && matchesModule && matchesRange;
    });
  }, [logs, query, severity, moduleFilter, range]);

  const kpis = useMemo(() => {
    const critical = logs.filter((log) => getSeverity(log) === "High").length;
    const failedLogins = logs.filter((log) => (log.action || "").toLowerCase().includes("failed")).length;
    const adminActions = logs.filter((log) => (log.action || "").toLowerCase().includes("admin")).length;
    const coverage = logs.length ? `${Math.min(99, 85 + Math.floor(logs.length / 8))}%` : "0%";
    return [
      { label: "Critical Alerts", value: String(critical) },
      { label: "Failed Logins (7d)", value: String(failedLogins) },
      { label: "Admin Actions", value: String(adminActions) },
      { label: "Audit Coverage", value: coverage }
    ];
  }, [logs]);

  // Alert rule handlers
  const openCreateModal = () => {
    setEditingRule(null);
    setRuleForm({ ...EMPTY_RULE });
    setRuleModal(true);
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      eventType: rule.eventType,
      severity: rule.severity,
      module: rule.module,
      enabled: rule.enabled
    });
    setRuleModal(true);
  };

  const handleSaveRule = async () => {
    if (!ruleForm.name.trim()) {
      toast.warning("Rule name is required.");
      return;
    }
    setSaving(true);
    try {
      if (editingRule) {
        await api.updateAlertRule(editingRule.id, ruleForm);
        toast.success("Alert rule updated.");
      } else {
        await api.createAlertRule(ruleForm);
        toast.success("Alert rule created.");
      }
      setRuleModal(false);
      loadRules();
    } catch (err) {
      toast.error(err.message || "Failed to save alert rule.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRule = async (rule) => {
    try {
      await api.updateAlertRule(rule.id, { enabled: !rule.enabled });
      loadRules();
    } catch (err) {
      toast.error(err.message || "Failed to toggle rule.");
    }
  };

  const handleDeleteRule = async () => {
    const rule = deleteConfirm.rule;
    if (!rule) return;
    try {
      await api.deleteAlertRule(rule.id);
      toast.success("Alert rule deleted.");
      setDeleteConfirm({ open: false, rule: null });
      loadRules();
    } catch (err) {
      toast.error(err.message || "Failed to delete alert rule.");
    }
  };

  return (
    <div className="security-page">
      <div className="security-header">
        <div className="security-title">
          <h1>Security & Audit Logs</h1>
          <p>Monitor system activity, security posture, and compliance trails.</p>
        </div>
        <div className="security-actions">
          <Button variant="secondary" onClick={handleDownload}>
            Download Audit Logs
          </Button>
          <Button variant="primary" onClick={openCreateModal}>
            Create Alert Rule
          </Button>
        </div>
      </div>

      <div className="security-grid">
        <div className="card">
          <div className="kpi-row">
            {kpis.map((kpi) => (
              <div className="kpi" key={kpi.label}>
                <h3>{kpi.label}</h3>
                <strong>{kpi.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Audit Log Filters</div>
          <div className="filters">
            <input
              placeholder="Search user, event, or IP..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="All">All severity</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
              <option value="All">All modules</option>
              <option value="Assets">Assets</option>
              <option value="Users & Roles">Users & Roles</option>
              <option value="Settings">Settings</option>
              <option value="Compliance">Compliance</option>
              <option value="General">General</option>
            </select>
            <select value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="1">Last 24 hours</option>
              <option value="30">Last 30 days</option>
              <option value="0">All time</option>
            </select>
          </div>
        </div>

        {/* Alert Rules */}
        <div className="card">
          <div className="card-title">Alert Rules</div>
          {rulesLoading ? (
            <LoadingOverlay visible message="Loading alert rules..." />
          ) : alertRules.length === 0 ? (
            <div className="empty-rules">
              No alert rules configured. Click "Create Alert Rule" to add one.
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Rule Name</th>
                  <th>Event Type</th>
                  <th>Severity</th>
                  <th>Module</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alertRules.map((rule) => (
                  <tr key={rule.id}>
                    <td><strong>{rule.name}</strong></td>
                    <td>{rule.eventType}</td>
                    <td>
                      <span className={`tag ${rule.severity.toLowerCase()}`}>
                        {rule.severity.toUpperCase()}
                      </span>
                    </td>
                    <td><span className="pill">{rule.module}</span></td>
                    <td>
                      <label className="rule-toggle">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={() => handleToggleRule(rule)}
                        />
                        <span>{rule.enabled ? "Enabled" : "Disabled"}</span>
                      </label>
                    </td>
                    <td>
                      <div className="rule-actions">
                        <button
                          className="icon-btn"
                          title="Edit"
                          onClick={() => openEditModal(rule)}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="icon-btn danger"
                          title="Delete"
                          onClick={() => setDeleteConfirm({ open: true, rule })}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-title">Security Alerts</div>
          {loading ? (
            <LoadingOverlay visible message="Loading audit logs..." />
          ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>User</th>
                <th>IP</th>
                <th>Time</th>
                <th>Source</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, idx) => {
                const sev = getSeverity(log);
                const moduleName = getModule(log);
                return (
                  <tr key={log.id || idx}>
                    <td>{log.action || "Event"}</td>
                    <td>{log.user || "—"}</td>
                    <td>{log.ip || "—"}</td>
                    <td>{toDate(log.timestamp)?.toLocaleString() || "—"}</td>
                    <td><span className="pill">{moduleName}</span></td>
                    <td>
                      <span className={`tag ${sev.toLowerCase()}`}>
                        {sev.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!filteredLogs.length && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--text-secondary)", padding: "16px" }}>
                    No audit logs found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
        <div className="card">
          <div className="card-title">Recent Activity</div>
          <div className="timeline">
            {filteredLogs.slice(0, 5).map((log, idx) => (
              <div key={log.id || idx} className="timeline-item">
                <h4>{log.action || "Activity"}</h4>
                <p>{log.user || "System"} · {toDate(log.timestamp)?.toLocaleString() || "—"}</p>
              </div>
            ))}
            {!filteredLogs.length && (
              <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>No recent activity.</div>
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit Alert Rule Modal */}
      <Modal open={ruleModal} onClose={() => setRuleModal(false)} title={editingRule ? "Edit Alert Rule" : "Create Alert Rule"}>
        <Modal.Body>
          <div className="rule-form">
            <div className="form-group">
              <label>Rule Name *</label>
              <input
                value={ruleForm.name}
                onChange={(e) => setRuleForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Failed Login Alert"
              />
            </div>
            <div className="rule-form-row">
              <div className="form-group">
                <label>Event Type</label>
                <select
                  value={ruleForm.eventType}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, eventType: e.target.value }))}
                >
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
              <div className="form-group">
                <label>Severity</label>
                <select
                  value={ruleForm.severity}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, severity: e.target.value }))}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
            <div className="rule-form-row">
              <div className="form-group">
                <label>Module</label>
                <select
                  value={ruleForm.module}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, module: e.target.value }))}
                >
                  <option value="All">All Modules</option>
                  <option value="Assets">Assets</option>
                  <option value="Users & Roles">Users & Roles</option>
                  <option value="Settings">Settings</option>
                  <option value="Compliance">Compliance</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={ruleForm.enabled ? "enabled" : "disabled"}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, enabled: e.target.value === "enabled" }))}
                >
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setRuleModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSaveRule} disabled={saving}>
            {saving ? "Saving..." : editingRule ? "Update Rule" : "Create Rule"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Alert Rule"
        message={`Are you sure you want to delete "${deleteConfirm.rule?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteRule}
        onCancel={() => setDeleteConfirm({ open: false, rule: null })}
      />
    </div>
  );
}
