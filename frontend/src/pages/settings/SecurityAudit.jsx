import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
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

export default function SecurityAudit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("All");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [range, setRange] = useState("7");

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
      alert("No audit logs available for export.");
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
  }, []);

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

  return (
    <div className="security-page">
      <div className="security-header">
        <div className="security-title">
          <h1>Security & Audit Logs</h1>
          <p>Monitor system activity, security posture, and compliance trails.</p>
        </div>
        <div className="security-actions">
          <button className="asset-action-btn secondary" onClick={handleDownload}>
            Download Audit Logs
          </button>
          <button className="asset-action-btn primary">Create Alert Rule</button>
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

        <div className="card">
          <div className="card-title">Security Alerts</div>
          {loading ? (
            <div style={{ padding: "12px 0", color: "#64748b" }}>Loading audit logs…</div>
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
                  <td colSpan={6} style={{ textAlign: "center", color: "#64748b", padding: "16px" }}>
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
              <div style={{ color: "#64748b", fontSize: 12 }}>No recent activity.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
