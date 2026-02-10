import { useState, useEffect } from "react";
import "./AssetAllocation.css";
import AllocationHistoryDrawer from "../components/AllocationHistoryDrawer";
import api from "../services/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEntity } from "../context/EntityContext";
import { useToast } from "../context/ToastContext";
import { LoadingOverlay, ConfirmDialog } from "../components/ui";

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

  const loadData = async () => {
    try {
      const entityCode = entity === "ALL" ? null : entity;
      const [assetsData, empsData] = await Promise.all([
        api.getAssets(entityCode),
        api.getEmployees(entityCode)
      ]);
      setAllAssets(assetsData);
      // Filter only available assets
      const available = assetsData.filter(
        (asset) => asset.status === "Available" || asset.status === "In Stock"
      );
      setAvailableAssets(available);
      setEmployees(empsData);

      const assetParam = searchParams.get("asset");
      const assetIdParam = searchParams.get("assetId");
      const historyParam = searchParams.get("history");
      if (historyParam === "1") {
        setOpenHistory(true);
      }
      if (assetParam || assetIdParam) {
        const target = assetParam || assetIdParam;
        const match = assetsData.find(
          (asset) =>
            String(asset.assetId || "").toLowerCase() === String(target).toLowerCase() ||
            String(asset.id) === String(target)
        );
        if (match) {
          setSelectedAssetId(String(match.id));
        }
      }
    } catch (err) {
      console.error("Failed to load allocation data", err);
    } finally {
      setLoading(false);
    }
  };

  const performAllocation = async () => {
    const emp = employees.find(e => e.id == selectedEmpId);
    try {
      const entityCode = entity === "ALL" ? null : entity;
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

    const emp = employees.find(e => e.id == selectedEmpId);
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
  const getSelectedEmpDetails = () => employees.find(e => e.id == selectedEmpId) || {};

  const allocationHistory = allAssets
    .filter((asset) => asset.employeeId || asset.status === "In Use" || asset.status === "Allocated")
    .map((asset) => {
      const emp =
        employees.find((e) => e.employeeId === asset.employeeId || e.email === asset.employeeId) || {};
      const wasReturned = ["Available", "In Stock"].includes(asset.status);
      const allocatedOn = asset.updatedAt || asset.createdAt || null;
      const formatDate = (value) =>
        value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";

      return {
        employee: emp.name || asset.employeeId || "—",
        department: emp.department || asset.department || "—",
        allocatedOn: formatDate(allocatedOn),
        handoverOn: wasReturned ? formatDate(asset.updatedAt || asset.createdAt) : "—",
        status: wasReturned ? "Returned" : "Allocated",
      };
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

        <button
          className="btn-secondary"
          onClick={() => setOpenHistory(true)}
        >
          Allocation History
        </button>
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

      {/* EMPLOYEE */}
      <div className="form-card">
        <h3>Employee Details</h3>

        <div className="form-grid three single-line">
          <div className="form-group">
            <label>Employee</label>
            <select value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)}>
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
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
        <button className="btn-primary" onClick={handleAllocate}>
          Allocate Asset
        </button>
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
