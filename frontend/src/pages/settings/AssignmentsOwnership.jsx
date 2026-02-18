import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useEntity } from "../../context/EntityContext";
import { Button, LoadingOverlay } from "../../components/ui";
import { useToast } from "../../context/ToastContext";
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
  const [metrics, setMetrics] = useState({
    avgAge: "—",
    assetsPerEmployee: "—",
    unassignedRate: "—"
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
        const uniqueEmployees = new Set(
          assigned.map((row) => row.user).filter((name) => name && name !== "—")
        );

        let avgAge = "—";
        if (assigned.length) {
          const now = Date.now();
          const ages = assigned
            .map((row) => {
              const d = new Date(row.assignedOn);
              return isNaN(d.getTime()) ? null : (now - d.getTime()) / (1000 * 60 * 60 * 24 * 30);
            })
            .filter(Boolean);
          if (ages.length) {
            const avg = ages.reduce((s, v) => s + v, 0) / ages.length;
            avgAge = `${avg.toFixed(1)} months`;
          }
        }

        setMetrics({
          avgAge,
          assetsPerEmployee: uniqueEmployees.size
            ? (assigned.length / uniqueEmployees.size).toFixed(1)
            : "—",
          unassignedRate: mapped.length
            ? `${Math.round((unassigned.length / mapped.length) * 100)}%`
            : "—"
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
          <div className="card-title">Ownership Metrics</div>
          <div className="metrics-grid">
            <div className="metric">
              <span>Average Assignment Age</span>
              <strong>{metrics.avgAge}</strong>
            </div>
            <div className="metric">
              <span>Assets per Employee</span>
              <strong>{metrics.assetsPerEmployee}</strong>
            </div>
            <div className="metric">
              <span>Unassigned Assets</span>
              <strong>{metrics.unassignedRate}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
