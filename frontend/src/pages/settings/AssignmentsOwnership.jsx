import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useEntity } from "../../context/EntityContext";
import { Button, LoadingOverlay } from "../../components/ui";
import { useToast } from "../../context/ToastContext";
import { FaCheckCircle, FaExclamationTriangle, FaClock, FaBuilding } from "react-icons/fa";
import "./AssignmentsOwnership.css";

export default function AssignmentsOwnership() {
  const navigate = useNavigate();
  const { entity } = useEntity();
  const toast = useToast();
  const [policy, setPolicy] = useState({
    requireApproval: true,
    maxAssetsPerUser: 3,
    autoReturnOnExit: true,
    allowCrossEntity: false,
    requireConsent: true
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [assignments, setAssignments] = useState([]);
  const [insights, setInsights] = useState({
    total: 0, assigned: 0, unassigned: 0, utilizationPct: 0,
    topDepts: [], policyViolators: [], longHoldCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadServerPrefs = async () => {
      try {
        const prefs = await api.getSystemPreferences();
        if (prefs.maxAssetsPerEmployee) {
          setPolicy((prev) => ({ ...prev, maxAssetsPerUser: prefs.maxAssetsPerEmployee }));
        }
      } catch {
        // use defaults
      }
    };
    loadServerPrefs();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const entityCode = entity === "ALL" ? null : entity;

        let employees = [];
        if (entity === "ALL") {
          const entitiesData = await api.getEntities();
          const codes = (entitiesData || []).map(e => e.code).filter(Boolean);
          const empResults = await Promise.allSettled(
            codes.map(code => api.getEmployees(code))
          );
          employees = empResults.flatMap(r =>
            r.status === "fulfilled" ? r.value : []
          );
        } else {
          employees = await api.getEmployees(entityCode);
        }

        const [assets] = await Promise.all([
          api.getAssets(entityCode)
        ]);

        const employeeIndex = employees.reduce((acc, employee) => {
          if (employee.employeeId) acc[String(employee.employeeId)] = employee;
          if (employee.email) acc[String(employee.email)] = employee;
          acc[String(employee.id)] = employee;
          return acc;
        }, {});

        const mapped = (assets || []).map((asset) => {
          const employee = employeeIndex[String(asset.employeeId)] || null;
          const normalizedStatus = String(asset.status || "").toLowerCase();
          const hasEmployee = Boolean(String(asset.employeeId || "").trim());
          const isAssigned =
            hasEmployee ||
            ["in use", "allocated"].includes(normalizedStatus);
          return {
            id: asset.id,
            assetTag: asset.assetId || asset.id,
            assetType: asset.category || asset.name || "Asset",
            user: employee?.name || (asset.employeeId ? "Assigned" : "—"),
            department: employee?.department || asset.department || "—",
            entity: asset.entity || entity || "—",
            status: isAssigned ? "Assigned" : "Unassigned",
            assignedOn: asset.updatedAt || asset.createdAt || "—"
          };
        });

        setAssignments(mapped);

        const assigned = mapped.filter((row) => row.status === "Assigned");
        const unassigned = mapped.filter((row) => row.status === "Unassigned");

        // Department breakdown (top 5 by asset count)
        const deptMap = {};
        mapped.forEach((row) => {
          const dept = row.department && row.department !== "—" ? row.department : "Unspecified";
          deptMap[dept] = (deptMap[dept] || 0) + 1;
        });
        const topDepts = Object.entries(deptMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));

        // Policy violators: users with more assets than maxAssetsPerUser
        const userAssetCount = {};
        assigned.forEach((row) => {
          if (row.user && row.user !== "—" && row.user !== "Assigned") {
            userAssetCount[row.user] = (userAssetCount[row.user] || 0) + 1;
          }
        });
        const maxAllowed = policy.maxAssetsPerUser;
        const policyViolators = Object.entries(userAssetCount)
          .filter(([, count]) => count > maxAllowed)
          .map(([name, count]) => ({ name, count }));

        // Long-hold: assets assigned for > 12 months (candidates for refresh)
        const now = Date.now();
        const longHoldCount = assigned.filter((row) => {
          const d = new Date(row.assignedOn);
          if (isNaN(d.getTime())) return false;
          return (now - d.getTime()) / (1000 * 60 * 60 * 24 * 30) > 12;
        }).length;

        setInsights({
          total: mapped.length,
          assigned: assigned.length,
          unassigned: unassigned.length,
          utilizationPct: mapped.length ? Math.round((assigned.length / mapped.length) * 100) : 0,
          topDepts,
          policyViolators,
          longHoldCount
        });
      } catch (err) {
        console.error("Failed to load assignments", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [entity]);

  const filtered = useMemo(() => {
    return assignments.filter((row) => {
      const matchesSearch = !search ||
        `${row.assetTag} ${row.user} ${row.department}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [assignments, search, statusFilter]);

  return (
    <div className="assignments-page">
      <div className="assignments-header">
        <div>
          <h1>Assignments & Ownership</h1>
          <p>Manage allocation rules, ownership policies, and assignment workflow.</p>
        </div>
        <div className="assignments-actions">
          <Button
            variant="primary"
            onClick={async () => {
              try {
                await api.updateSystemPreferences({
                  maxAssetsPerEmployee: policy.maxAssetsPerUser
                });
                toast.success("Policy saved successfully");
              } catch (err) {
                toast.error(err.message || "Failed to save policy");
              }
            }}
          >
            Save Policy
          </Button>
        </div>
      </div>

      <div className="assignments-grid">
        <div className="card">
          <div className="card-title">Policy Controls</div>
          <div className="policy-grid">
            <label className="switch-row">
              <span>Require Manager Approval</span>
              <input
                type="checkbox"
                checked={policy.requireApproval}
                onChange={() => setPolicy((prev) => ({ ...prev, requireApproval: !prev.requireApproval }))}
              />
            </label>
            <label className="switch-row">
              <span>Auto-return assets on exit</span>
              <input
                type="checkbox"
                checked={policy.autoReturnOnExit}
                onChange={() => setPolicy((prev) => ({ ...prev, autoReturnOnExit: !prev.autoReturnOnExit }))}
              />
            </label>
            <label className="switch-row">
              <span>Require consent form for allocation</span>
              <input
                type="checkbox"
                checked={policy.requireConsent}
                onChange={() => setPolicy((prev) => ({ ...prev, requireConsent: !prev.requireConsent }))}
              />
            </label>
            <label className="switch-row">
              <span>Allow cross-entity assignments</span>
              <input
                type="checkbox"
                checked={policy.allowCrossEntity}
                onChange={() => setPolicy((prev) => ({ ...prev, allowCrossEntity: !prev.allowCrossEntity }))}
              />
            </label>
            <div className="policy-input">
              <span>Max assets per user</span>
              <input
                type="number"
                min="1"
                value={policy.maxAssetsPerUser}
                onChange={(e) =>
                  setPolicy((prev) => ({ ...prev, maxAssetsPerUser: Number(e.target.value) }))
                }
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Assignment Directory</div>
          <div className="filters-row">
            <input
              placeholder="Search asset, user, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All status</option>
              <option value="Assigned">Assigned</option>
              <option value="Unassigned">Unassigned</option>
            </select>
          </div>

          {loading ? (
            <LoadingOverlay visible message="Loading assignments..." />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>User</th>
                  <th>Department</th>
                  <th>Entity</th>
                  <th>Status</th>
                  <th>Assigned On</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.assetTag}</strong>
                      <div className="muted">{row.assetType}</div>
                    </td>
                    <td>{row.user}</td>
                    <td>{row.department}</td>
                    <td>{row.entity}</td>
                    <td>
                      <span className={`status-chip ${row.status === "Assigned" ? "good" : "watch"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>{row.assignedOn}</td>
                    <td>
                      <Button variant="ghost" size="sm" onClick={() => navigate("/assets")}>View</Button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={7} className="empty">
                      No assignments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-title">Assignment Insights</div>

          {/* ── Utilization Overview ── */}
          <div className="insight-section">
            <div className="insight-section-label">Asset Utilization</div>
            <div className="utilization-bar-wrap">
              <div className="utilization-bar">
                <div
                  className="utilization-fill"
                  style={{ width: `${insights.utilizationPct}%` }}
                />
              </div>
              <span className="utilization-pct">{insights.utilizationPct}%</span>
            </div>
            <div className="utilization-legend">
              <span className="legend-dot assigned" />
              <span>{insights.assigned} Assigned</span>
              <span className="legend-dot unassigned" />
              <span>{insights.unassigned} Available</span>
              <span className="legend-total">{insights.total} Total</span>
            </div>
          </div>

          {/* ── Department Breakdown ── */}
          {insights.topDepts.length > 0 && (
            <div className="insight-section">
              <div className="insight-section-label">
                <FaBuilding style={{ marginRight: 5 }} />Top Departments
              </div>
              <div className="dept-list">
                {insights.topDepts.map(({ name, count }) => {
                  const pct = insights.total ? Math.round((count / insights.total) * 100) : 0;
                  return (
                    <div className="dept-row" key={name}>
                      <span className="dept-name">{name}</span>
                      <div className="dept-bar-wrap">
                        <div className="dept-bar">
                          <div className="dept-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="dept-count">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Policy Alerts ── */}
          <div className="insight-section">
            <div className="insight-section-label">
              <FaExclamationTriangle style={{ marginRight: 5 }} />Policy Compliance
            </div>
            {insights.policyViolators.length === 0 ? (
              <div className="insight-ok">
                <FaCheckCircle /> All users within asset limit ({policy.maxAssetsPerUser} max)
              </div>
            ) : (
              <div className="insight-violations">
                <div className="violation-warning">
                  {insights.policyViolators.length} user{insights.policyViolators.length > 1 ? "s" : ""} exceed the {policy.maxAssetsPerUser}-asset limit
                </div>
                <div className="violation-list">
                  {insights.policyViolators.slice(0, 4).map(({ name, count }) => (
                    <div key={name} className="violation-row">
                      <span className="violation-name">{name}</span>
                      <span className="violation-count">{count} assets</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Long-hold Assets ── */}
          <div className="insight-section" style={{ marginBottom: 0 }}>
            <div className="insight-section-label">
              <FaClock style={{ marginRight: 5 }} />Refresh Candidates
            </div>
            {insights.longHoldCount === 0 ? (
              <div className="insight-ok">
                <FaCheckCircle /> No assets held longer than 12 months
              </div>
            ) : (
              <div className="insight-longhold">
                <span className="longhold-count">{insights.longHoldCount}</span>
                <span className="longhold-label">
                  asset{insights.longHoldCount > 1 ? "s" : ""} assigned &gt;12 months — consider refresh or reassessment
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
