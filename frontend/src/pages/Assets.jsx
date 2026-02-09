import { useState, useRef, useEffect, useMemo } from "react";
import { useEntity } from "../context/EntityContext";
import "./Assets.css";
import { KpiCard, Card, Button, Badge } from "../components/ui";
import ChartCard from "../components/ChartCard";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

export default function Assets() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(50);

  // Entity State
  const { entity: selectedEntityCode, setEntity: setSelectedEntityCode } = useEntity();
  const [entityList, setEntityList] = useState([]);
  // const [selectedEntityCode, setSelectedEntityCode] = useState(""); // "" = Global/Default

  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState("assetId");
  const [sortDir, setSortDir] = useState("asc");

  // Modal State
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [allocationData, setAllocationData] = useState({ employeeId: "" });

  useEffect(() => {
    loadEntities();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedEntityCode]);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  const loadEntities = async () => {
    try {
      const ents = await api.getEntities();
      setEntityList(ents);
    } catch (err) {
      console.error("Failed to load entities", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const isAll = selectedEntityCode === "ALL";

      if (isAll) {
        const assetsData = await api.getAssets(null);
        const uniqueAssets = Array.from(
          new Map(
            (assetsData || []).map((asset) => {
              const normalizedEntity = (asset.entity || "GLOBAL").toString().trim().toUpperCase();
              const rawId = asset.assetId || asset.id;
              const keyId = rawId ? String(rawId).trim().toUpperCase() : "";
              const key = `${normalizedEntity}::${keyId}`;
              return [key, asset];
            })
          ).values()
        );

        const entityCodes = Array.from(
          new Set(
            uniqueAssets
              .map((asset) => (asset.entity || "").toString().trim().toUpperCase())
              .filter(Boolean)
          )
        );
        const employeeResults = await Promise.allSettled(
          entityCodes.map((code) => api.getEmployees(code))
        );
        const employeesData = employeeResults.flatMap((result) =>
          result.status === "fulfilled" ? result.value : []
        );

        setAssets(uniqueAssets);
        setEmployees(employeesData);
      } else {
        const [assetsData, employeesData] = await Promise.all([
          api.getAssets(selectedEntityCode),
          api.getEmployees(selectedEntityCode)
        ]);
        setAssets(assetsData);
        setEmployees(employeesData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const isAllocatedStatus = (status) =>
    status === "In Use" || status === "Allocated";
  const isAvailableStatus = (status) =>
    status === "Available" || status === "In Stock";
  const matchesStatusFilter = (asset) => {
    if (!statusFilter) return true;
    if (statusFilter === "In Use") return isAllocatedStatus(asset.status);
    if (statusFilter === "Available") return isAvailableStatus(asset.status);
    return asset.status === statusFilter;
  };

  const normalizedAssets = useMemo(() => {
    const map = new Map();
    assets.forEach((asset) => {
      const normalizedEntity = (asset.entity || "GLOBAL").toString().trim().toUpperCase();
      const rawId = asset.assetId || asset.id;
      const normalizedId = rawId ? String(rawId).trim().toUpperCase() : "";
      const fallbackKey = `${asset.name || ""}::${asset.category || ""}::${asset.location || ""}`.toUpperCase();
      const key = normalizedId ? `${normalizedEntity}::${normalizedId}` : `${normalizedEntity}::${fallbackKey}`;
      if (!map.has(key)) map.set(key, asset);
    });
    return Array.from(map.values());
  }, [assets]);

  const kpis = {
    total: normalizedAssets.length,
    inUse: normalizedAssets.filter(a => isAllocatedStatus(a.status)).length,
    available: normalizedAssets.filter(a => isAvailableStatus(a.status)).length,
    repair: normalizedAssets.filter(a => a.status === "Under Repair").length,
    retired: normalizedAssets.filter(a => a.status === "Retired").length,
    theftMissing: normalizedAssets.filter(a => a.status === "Theft/Missing").length,
    notSubmitted: normalizedAssets.filter(a => a.status === "Not Submitted").length,
  };

  // Charts data now reflects only the current scope (Global or Specific Entity)
  const statusCounts = {
    "In Use": normalizedAssets.filter(a => isAllocatedStatus(a.status)).length,
    Available: normalizedAssets.filter(a => isAvailableStatus(a.status)).length,
    "Under Repair": normalizedAssets.filter(a => a.status === "Under Repair").length,
    "Retired": normalizedAssets.filter(a => a.status === "Retired").length,
    "Theft/Missing": normalizedAssets.filter(a => a.status === "Theft/Missing").length,
    "Not Submitted": normalizedAssets.filter(a => a.status === "Not Submitted").length,
  };

  const STATUS_COLORS = {
    "In Use": "#7c3aed",
    "Allocated": "#7c3aed",
    Available: "#22c55e",
    "In Stock": "#22c55e",
    "Under Repair": "#f97316",
    "Retired": "#ef4444",
    "Theft/Missing": "#ef4444",
    "Not Submitted": "#f59e0b"
  };

  // --- ACTIONS ---

  const handleReturn = async (asset) => {
    if (!window.confirm(`Confirm return for ${asset.name}?`)) return;
    try {
      const entityCode = selectedEntityCode || asset.entity || null;
      await api.updateAsset(asset.id, {
        status: "Available",
        employeeId: null,
        department: null,
        location: null
      }, entityCode);
      toast.success(`Asset ${asset.name} returned successfully`);
      loadData(); // Reload to refresh UI
    } catch (err) {
      toast.error(err.message || "Failed to return asset");
    }
  };

  const openAllocateModal = (asset) => {
    setSelectedAsset(asset);
    setAllocationData({ employeeId: "" });
    setShowAllocateModal(true);
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!allocationData.employeeId) return;

    const emp = employees.find(e => e.id.toString() === allocationData.employeeId);
    if (!emp) return;

    try {
      const entityCode = selectedEntityCode || selectedAsset?.entity || null;
      await api.updateAsset(selectedAsset.id, {
        status: "In Use",
        employeeId: emp.employeeId || emp.email,
        department: emp.department,
        location: emp.entity // Assuming entity maps to location or logic
      }, entityCode);
      toast.success(`Asset allocated to ${emp.name} successfully`);
      setShowAllocateModal(false);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to allocate asset");
    }
  };

  const handleExport = async () => {
    try {
      const blob = await api.exportAssets(selectedEntityCode, "csv");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "assets_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Assets exported successfully");
    } catch (err) {
      toast.error(err.message || "Export failed");
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "S. No",
      "Employee ID",
      "Asset ID",
      "Employee Mail",
      "Employee Name",
      "Asset Status",
      "Faulty laptop Issue",
      "Department",
      "Location",
      "Asset Type",
      "Additional Items",
      "Make/Model",
      "Serial Number",
      "Asset Owner",
      "SSD/HDD",
      "RAM SIZE",
      "CPU",
      "OS",
      "Date of Purchase",
      "Warranty Expire Date",
      "Price",
      "Invoice Number",
      "Vendor Name",
      "Last User",
      "Insurance Status",
      "MS Office Email",
      "Windows Keys",
      "Laptop Allocation Date"
    ];
    const sample = new Array(headers.length).fill("");
    const csvContent = [headers.join(","), sample.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "assets_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!selectedEntityCode || selectedEntityCode === "ALL") {
      toast.warning("Please select a single entity to import assets");
      e.target.value = null;
      return;
    }
    try {
      const result = await api.importAssets(file, selectedEntityCode);
      toast.success(result?.message || "Assets imported successfully");
      await loadData();
    } catch (err) {
      toast.error(err.message || "Import failed");
    } finally {
      e.target.value = null;
    }
  };

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const getSortValue = (asset, key) => {
    const value = asset[key];
    if (value === null || value === undefined) return "";
    return String(value).toLowerCase();
  };

  const sortedAssets = useMemo(() => {
    const list = [...normalizedAssets];
    list.sort((a, b) => {
      const aVal = getSortValue(a, sortKey);
      const bVal = getSortValue(b, sortKey);
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [normalizedAssets, sortKey, sortDir]);

  const SortIndicator = ({ column }) => {
    if (sortKey !== column) return <span className="sort-indicator">↕</span>;
    return <span className="sort-indicator active">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    if (status) {
      setSearchParams({ status });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="assets-page">
      {/* ================= HEADER ================= */}
      <div className="assets-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            Assets
            <Badge variant="primary">{selectedEntityCode === "ALL" || !selectedEntityCode ? "All Entities" : selectedEntityCode}</Badge>
          </h1>
          <p className="assets-subtitle">
            Centralized inventory across entities
          </p>
        </div>

        <div className="asset-actions">
          <Button variant="primary" onClick={() => navigate("/assets/add")}>+ Add Asset</Button>
          <Button variant="primary" onClick={() => navigate("/assets/allocate")}>Allocate</Button>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".csv,.xlsx"
            onChange={handleFileChange}
          />
          <Button variant="primary" onClick={handleImportClick}>Import</Button>
          <Button variant="primary" onClick={handleExport}>Export</Button>
          <Button variant="primary" onClick={handleDownloadTemplate}>Template</Button>
        </div>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="asset-kpis">
        <div onClick={() => handleStatusFilter("")}>
          <KpiCard label="Total Assets" value={kpis.total} size="sm" />
        </div>
        <div onClick={() => handleStatusFilter("In Use")}>
          <KpiCard label="In Use" value={kpis.inUse} size="sm" variant="primary" />
        </div>
        <div onClick={() => handleStatusFilter("Available")}>
          <KpiCard label="Available" value={kpis.available} size="sm" variant="success" />
        </div>
        <div onClick={() => handleStatusFilter("Under Repair")}>
          <KpiCard label="Under Repair" value={kpis.repair} size="sm" variant="warning" />
        </div>
        <div onClick={() => handleStatusFilter("Retired")}>
          <KpiCard label="Retired" value={kpis.retired} size="sm" variant="danger" />
        </div>
        <div onClick={() => handleStatusFilter("Theft/Missing")}>
          <KpiCard label="Theft/Missing" value={kpis.theftMissing} size="sm" variant="danger" />
        </div>
        <div onClick={() => handleStatusFilter("Not Submitted")}>
          <KpiCard label="Not Submitted" value={kpis.notSubmitted} size="sm" variant="warning" />
        </div>
      </div>

      {/* ================= CHARTS ROW ================= */}
      <div className="assets-charts">
        {/* Assets by Status */}
        <ChartCard title="Assets by Status">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="status-row">
              <span>{status}</span>

              <div className="status-bar">
                <div
                  className="fill"
                  style={{
                    width: `${kpis.total > 0 ? (count / kpis.total) * 100 : 0}%`,
                    background: STATUS_COLORS[status],
                  }}
                />
              </div>

              <strong>{count}</strong>
            </div>
          ))}
        </ChartCard>

      </div>

      {/* ================= FILTERS ================= */}
      <div className="asset-filters">
        <input
          placeholder="Search assets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select value={pageSize} onChange={e => setPageSize(+e.target.value)}>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
          <option value={500}>500 / page</option>
        </select>

        {!!statusFilter && (
          <button onClick={() => handleStatusFilter("")}>
            Clear Status Filter
          </button>
        )}
      </div>

      {/* ================= TABLE ================= */}
      <div className="asset-table-wrapper">
        <table className="assets-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => toggleSort("assetId")}>
                Asset ID <SortIndicator column="assetId" />
              </th>
              <th className="sortable" onClick={() => toggleSort("name")}>
                Name <SortIndicator column="name" />
              </th>
              <th className="sortable" onClick={() => toggleSort("category")}>
                Category <SortIndicator column="category" />
              </th>
              <th className="sortable" onClick={() => toggleSort("entity")}>
                Entity <SortIndicator column="entity" />
              </th>
              <th className="sortable" onClick={() => toggleSort("employeeId")}>
                Employee ID <SortIndicator column="employeeId" />
              </th>
              <th className="sortable" onClick={() => toggleSort("department")}>
                Department <SortIndicator column="department" />
              </th>
              <th className="sortable" onClick={() => toggleSort("location")}>
                Location <SortIndicator column="location" />
              </th>
              <th className="sortable" onClick={() => toggleSort("status")}>
                Status <SortIndicator column="status" />
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedAssets
              .filter((a) => {
                if (!search) return true;
                const q = search.toLowerCase();
                return [
                  a.name,
                  a.assetId,
                  a.id,
                  a.category,
                  a.entity,
                  a.employeeId,
                  a.department,
                  a.location,
                  a.status
                ]
                  .filter(Boolean)
                  .some((value) => String(value).toLowerCase().includes(q));
              })
              .filter(matchesStatusFilter)
              .map(asset => {
                const rowEntity = (asset.entity || "GLOBAL").toString().trim().toUpperCase();
                const rowId = asset.assetId || asset.id || "";
                const rowKey = `${rowEntity}::${String(rowId).trim().toUpperCase()}`;
                return (
                <tr key={rowKey}>
                  <td>{asset.assetId || asset.id}</td>
                  <td>{asset.name}</td>
                  <td>{asset.category}</td>
                  <td>{asset.entity}</td>
                  <td>{asset.employeeId || "-"}</td>
                  <td>{asset.department || "-"}</td>
                  <td>{asset.location || "-"}</td>
                  <td>
                    <Badge
                      variant={
                        isAllocatedStatus(asset.status) ? "primary" :
                        isAvailableStatus(asset.status) ? "success" :
                        asset.status === "Under Repair" ? "warning" :
                        asset.status === "Retired" || asset.status === "Theft/Missing" ? "danger" :
                        "neutral"
                      }
                    >
                      {asset.status}
                    </Badge>
                  </td>
                  <td>
                    {/* ACTION BUTTONS */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/assets/edit/${asset.id}?entity=${encodeURIComponent(asset.entity || "")}`)}
                    >
                      Edit
                    </Button>
                    {isAvailableStatus(asset.status) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/assets/allocate?assetId=${encodeURIComponent(asset.id)}`)}
                      >
                        Allocate
                      </Button>
                    )}
                    {isAllocatedStatus(asset.status) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReturn(asset)}
                      >
                        Return
                      </Button>
                    )}
                  </td>
                </tr>
              )})}
            {normalizedAssets.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>No assets found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= ALLOCATE MODAL ================= */}
      {showAllocateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Allocate Asset</h2>
            <p className="mb-4 text-gray-600">Allocate <strong>{selectedAsset?.name}</strong> to an employee.</p>

            <form onSubmit={handleAllocateSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Select Employee</label>
                <select
                  className="w-full border p-2 rounded"
                  value={allocationData.employeeId}
                  onChange={e => setAllocationData({ ...allocationData, employeeId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowAllocateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                >
                  Confirm Allocation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
