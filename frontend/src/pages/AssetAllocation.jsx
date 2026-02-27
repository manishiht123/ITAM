import { useState, useEffect } from "react";
import "./AssetAllocation.css";
import AllocationHistoryDrawer from "../components/AllocationHistoryDrawer";
import api from "../services/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEntity } from "../context/EntityContext";
import { useToast } from "../context/ToastContext";
import { LoadingOverlay, ConfirmDialog, Button } from "../components/ui";
import { FaHistory, FaCheckCircle } from "react-icons/fa";

export default function AssetAllocation() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const { entity, setEntity } = useEntity();
  const [openHistory, setOpenHistory] = useState(false);
  const [allocationConfirm, setAllocationConfirm] = useState({ open: false });

  // Data State
  const [availableAssets, setAvailableAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allocationLimit, setAllocationLimit] = useState(2);
  const [allocationWarningMessage, setAllocationWarningMessage] = useState(
    "This employee already has 1 asset allocated. Do you want to allow a second asset?"
  );

  // Selection State
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  useEffect(() => {
    loadData();
  }, [entity]);

  useEffect(() => {
    const targetEntity = searchParams.get("entity");
    if (targetEntity && targetEntity !== entity) {
      setEntity(targetEntity);
    }
  }, [searchParams, entity, setEntity]);

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const prefs = await api.getSystemPreferences();
        if (prefs?.maxAssetsPerEmployee) {
          setAllocationLimit(Number(prefs.maxAssetsPerEmployee));
        }
        if (prefs?.allocationWarningMessage) {
          setAllocationWarningMessage(String(prefs.allocationWarningMessage));
        }
      } catch (err) {
        console.error("Failed to load system preferences", err);
      }
    };
    loadPrefs();
  }, []);

  useEffect(() => {
    if (!selectedEmpId) {
      setAiSuggestions(null);
      return;
    }
    const fetchSuggestions = async () => {
      setAiLoading(true);
      try {
        const emp = employees.find(e => empKey(e) === selectedEmpId);
        const isAll = entity === "ALL";
        const entityCode = isAll ? (emp?.entity || null) : entity;
        const result = await api.getAllocationSuggestions(emp?.employeeId || selectedEmpId, entityCode);
        setAiSuggestions(result);
      } catch {
        setAiSuggestions(null);
      } finally {
        setAiLoading(false);
      }
    };
    fetchSuggestions();
  }, [selectedEmpId, entity]);

  const loadData = async () => {
    try {
      const isAll = entity === "ALL";
      const entityCode = isAll ? null : entity;

      let assetsData = [];
      let empsData = [];

      if (isAll) {
        // Fetch assets (backend aggregates across all tenants)
        assetsData = await api.getAssets(null);

        // Fetch employees per entity (backend needs specific entity code)
        const entities = await api.getEntities();
        const entityCodes = (entities || []).map(e => e.code).filter(Boolean);
        const empResults = await Promise.allSettled(
          entityCodes.map(code => api.getEmployees(code))
        );
        empsData = empResults.flatMap(r =>
          r.status === "fulfilled" ? r.value : []
        );
      } else {
        const [assets, emps] = await Promise.all([
          api.getAssets(entityCode),
          api.getEmployees(entityCode)
        ]);
        assetsData = assets;
        empsData = emps;
      }

      setAllAssets(assetsData);

      const assetParam = searchParams.get("asset");
      const assetIdParam = searchParams.get("assetId");
      const historyParam = searchParams.get("history");

      // Statuses that can never be allocated
      const NON_ALLOCATABLE = ["retired", "theft/missing"];

      // Filter available assets (Available / In Stock / New)
      const available = assetsData.filter((asset) => {
        const status = String(asset.status || "").trim().toLowerCase();
        return status === "available" || status === "in stock" || status === "new";
      });

      // If a specific asset was requested via URL param (e.g. "Reassign After Repair"),
      // include it only if it is NOT in a non-allocatable state (Retired / Theft/Missing).
      let preSelectedId = "";
      if (assetParam || assetIdParam) {
        const target = assetParam || assetIdParam;
        const entityParam = searchParams.get("entity") || "";
        const match = assetsData.find((asset) => {
          // Match by ITAM assetId first (globally unique), fall back to numeric id
          const byItamId = String(asset.assetId || "").toLowerCase() === String(target).toLowerCase();
          const byNumericId = String(asset.id) === String(target);
          if (!byItamId && !byNumericId) return false;
          // When entity param is present, also scope to that entity to avoid cross-entity ID collisions
          if (entityParam) {
            return String(asset.entity || "").toLowerCase() === entityParam.toLowerCase();
          }
          return true;
        });
        if (match) {
          const matchStatus = String(match.status || "").trim().toLowerCase();
          if (NON_ALLOCATABLE.includes(matchStatus)) {
            setTimeout(() => {
              toast.error(`Asset "${match.name || match.assetId}" cannot be allocated. Its current status is "${match.status}".`);
            }, 300);
          } else {
            preSelectedId = String(match.id);
            // If it's not already in the available list, add it (e.g. Under Repair)
            if (!available.some((a) => String(a.id) === preSelectedId && String(a.entity || "") === String(match.entity || ""))) {
              available.unshift(match);
            }
          }
        }
      }

      setAvailableAssets(available);
      setEmployees(empsData);

      if (historyParam === "1") {
        setOpenHistory(true);
      }
      if (preSelectedId) {
        setSelectedAssetId(preSelectedId);
      }
    } catch (err) {
      console.error("Failed to load allocation data", err);
    } finally {
      setLoading(false);
    }
  };

  // Unique key that prevents ID collisions when employees from multiple entities are merged
  const empKey = (emp) => `${emp.entity || ""}_${emp.id}`;

  const performAllocation = async () => {
    const emp = employees.find(e => empKey(e) === selectedEmpId);
    const selectedAsset = availableAssets.find(a => String(a.id) === String(selectedAssetId));
    try {
      // Use the employee's entity so the backend looks up the correct tenant DB for the consent email
      const entityCode = entity === "ALL" ? (emp?.entity || selectedAsset?.entity || null) : entity;
      await api.updateAsset(selectedAssetId, {
        status: "In Use",
        employeeId: emp?.employeeId || emp?.email || "Unknown",
        department: emp?.department || "Unknown"
      }, entityCode);

      toast.success("Asset allocated successfully!");
      navigate("/assets");
    } catch (err) {
      toast.error(err.message || "Failed to allocate asset");
    }
  };

  const handleAllocate = async () => {
    if (!selectedAssetId || !selectedEmpId) {
      toast.warning("Please select an asset and an employee.");
      return;
    }

    const selectedAsset = availableAssets.find(a => String(a.id) === String(selectedAssetId));
    const assetStatus = String(selectedAsset?.status || "").trim().toLowerCase();
    if (assetStatus === "retired" || assetStatus === "theft/missing") {
      toast.error(`This asset cannot be allocated. Its current status is "${selectedAsset?.status}".`);
      return;
    }

    const emp = employees.find(e => empKey(e) === selectedEmpId);
    const employeeKey = (emp?.employeeId || emp?.email || "").toString().trim().toLowerCase();
    if (!employeeKey) {
      toast.warning("Employee details are missing. Please select a valid employee.");
      return;
    }

    const assignedCount = allAssets.filter((asset) => {
      const assetEmployee = (asset.employeeId || "").toString().trim().toLowerCase();
      const isAllocated = asset.status === "In Use" || asset.status === "Allocated";
      return isAllocated && assetEmployee && assetEmployee === employeeKey && String(asset.id) !== String(selectedAssetId);
    }).length;

    const maxAllowed = Math.max(1, allocationLimit || 2);
    if (assignedCount >= maxAllowed) {
      toast.error(`This employee already has ${maxAllowed} assets allocated. A new allocation is not allowed.`);
      return;
    }

    if (assignedCount === maxAllowed - 1 && maxAllowed > 1) {
      setAllocationConfirm({ open: true });
      return;
    }

    await performAllocation();
  };

  const getSelectedAssetDetails = () => availableAssets.find(a => a.id == selectedAssetId) || {};
  const getSelectedEmpDetails = () => employees.find(e => empKey(e) === selectedEmpId) || {};

  const allocationHistory = allAssets
    .filter((asset) => asset.employeeId || asset.status === "In Use" || asset.status === "Allocated")
    .map((asset) => {
      const emp =
        employees.find((e) => e.employeeId === asset.employeeId || e.email === asset.employeeId) || {};
      const wasReturned = ["Available", "In Stock"].includes(asset.status);
      const isRetired = asset.status === "Retired";
      const allocatedOn = asset.updatedAt || asset.createdAt || null;

      const formatDate = (value) =>
        value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

      let duration = "—";
      if (allocatedOn) {
        const start = new Date(allocatedOn);
        const end = wasReturned ? new Date(asset.updatedAt || asset.createdAt) : new Date();
        const days = Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
        duration = `${days} day${days !== 1 ? "s" : ""}`;
      }

      return {
        assetId: asset.assetId || asset.id || "—",
        assetName: asset.name || "—",
        category: asset.category || "—",
        entity: asset.entity || "—",
        employee: emp.name || asset.employeeId || "—",
        employeeId: emp.employeeId || asset.employeeId || "—",
        department: emp.department || asset.department || "—",
        allocatedOn: formatDate(allocatedOn),
        returnedOn: wasReturned ? formatDate(asset.updatedAt) : "—",
        duration,
        status: isRetired ? "Retired" : wasReturned ? "Returned" : "Active",
      };
    })
    .sort((a, b) => {
      // Active allocations first, then by assetId
      if (a.status === "Active" && b.status !== "Active") return -1;
      if (a.status !== "Active" && b.status === "Active") return 1;
      return String(a.assetId).localeCompare(String(b.assetId));
    });

  if (loading) return <LoadingOverlay visible message="Loading available assets..." />;

  return (
    <div className="assets-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1>Asset Allocation</h1>
          <p className="page-subtitle">
            Assign an available asset to an employee
          </p>
        </div>

        <Button
          variant="secondary"
          icon={<FaHistory />}
          onClick={() => setOpenHistory(true)}
        >
          Allocation History
        </Button>
      </div>

      {/* DRAWER */}
      <AllocationHistoryDrawer
        open={openHistory}
        onClose={() => setOpenHistory(false)}
        history={allocationHistory}
      />

      {/* ASSET */}
      <div className="form-card accent">
        <h3>Asset Selection</h3>

        <div className="form-grid three single-line">
          <div className="form-group">
            <label>Available Asset</label>
            <select value={selectedAssetId} onChange={e => setSelectedAssetId(e.target.value)}>
              <option value="">Select Available Asset</option>
              {availableAssets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.assetId} - {asset.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group readonly">
            <label>Allocation Date</label>
            <input value={today} readOnly />
          </div>

          <div className="form-group readonly">
            <label>Status</label>
            <input value="Allocated" readOnly />
          </div>

          <div className="form-group readonly">
            <label>Category</label>
            <input value={getSelectedAssetDetails().category || ""} readOnly />
          </div>
        </div>
      </div>

      {/* AI SUGGESTIONS */}
      {selectedEmpId && (
        <div className="form-card ai-suggestion-card">
          <h3>
            <span style={{ marginRight: 8 }}>AI Asset Recommendations</span>
            <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-secondary)" }}>
              {aiLoading ? "Analysing..." : aiSuggestions?.message || ""}
            </span>
          </h3>
          {aiLoading ? (
            <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Generating recommendations...</p>
          ) : aiSuggestions?.suggestions?.length > 0 ? (
            <div className="ai-suggestions-list">
              {aiSuggestions.suggestions.slice(0, 3).map((s, i) => (
                <div
                  key={s.asset.id}
                  className={`ai-suggestion-item${String(selectedAssetId) === String(s.asset.id) ? " selected" : ""}`}
                  onClick={() => setSelectedAssetId(String(s.asset.id))}
                  title="Click to select this asset"
                >
                  <div className="ai-suggestion-rank">#{i + 1}</div>
                  <div className="ai-suggestion-info">
                    <div className="ai-suggestion-name">{s.asset.assetId} — {s.asset.name}</div>
                    <div className="ai-suggestion-meta">
                      {s.asset.category} &nbsp;·&nbsp; Health: <strong>{s.asset.healthGrade}</strong>
                      &nbsp;·&nbsp; Match score: <strong>{s.score}</strong>
                    </div>
                    {s.reasons.length > 0 && (
                      <div className="ai-suggestion-reasons">
                        {s.reasons.map((r, ri) => (
                          <span key={ri} className="ai-reason-tag">{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No recommendations available for this employee.</p>
          )}
        </div>
      )}

      {/* EMPLOYEE */}
      <div className="form-card">
        <h3>Employee Details</h3>

        <div className="form-grid three single-line">
          <div className="form-group">
            <label>Employee</label>
            <select value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)}>
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={empKey(emp)} value={empKey(emp)}>
                  {emp.name} ({emp.employeeId || emp.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group readonly">
            <label>Email</label>
            <input value={getSelectedEmpDetails().email || ""} readOnly />
          </div>

          <div className="form-group readonly">
            <label>Department</label>
            <input value={getSelectedEmpDetails().department || ""} readOnly />
          </div>
        </div>
      </div>

      {/* SECURITY */}
      <div className="form-card">
        <h3>Security Classification (Auto)</h3>

        <div className="form-grid four single-line">
          <div className="form-group readonly">
            <label>Confidentiality</label>
            <input value="High" readOnly />
          </div>
          <div className="form-group readonly">
            <label>Integrity</label>
            <input value="High" readOnly />
          </div>
          <div className="form-group readonly">
            <label>Availability</label>
            <input value="High" readOnly />
          </div>
          <div className="form-group readonly">
            <label>Sensitivity</label>
            <input value="Critical" readOnly />
          </div>
        </div>
      </div>

      {/* SOFTWARE */}
      <div className="form-card">
        <h3>Software & Licensing</h3>

        <div className="form-grid software-grid single-line">
          <div className="form-group">
            <label>MS Office ID</label>
            <input placeholder="office@company.com" />
          </div>

          <div className="form-group">
            <label>Windows License Key</label>
            <input placeholder="XXXXX-XXXXX" />
          </div>

          <div className="form-group">
            <label>Antivirus Installed</label>
            <select>
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>

          <div className="form-group">
            <label>VPN Access</label>
            <select>
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>

          <div className="form-group">
            <label>ManageEngine Installation</label>
            <select>
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="form-actions">
        <Button
          variant="secondary"
          icon={<FaHistory />}
          onClick={() => setOpenHistory(true)}
        >
          Allocation History
        </Button>
        <Button
          variant="primary"
          size="md"
          icon={<FaCheckCircle />}
          onClick={handleAllocate}
        >
          Allocate Asset
        </Button>
      </div>

      {/* ALLOCATION WARNING CONFIRM */}
      <ConfirmDialog
        open={allocationConfirm.open}
        title="Multiple Asset Allocation"
        message={allocationWarningMessage || "This employee already has 1 asset allocated. Do you want to allow a second asset?"}
        confirmText="Proceed"
        variant="primary"
        onConfirm={() => {
          setAllocationConfirm({ open: false });
          performAllocation();
        }}
        onCancel={() => setAllocationConfirm({ open: false })}
      />
    </div>
  );
}
