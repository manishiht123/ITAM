import { useState, useRef, useEffect, useMemo } from "react";
import { useEntity } from "../context/EntityContext";
import "./Assets.css";
import { FaPencilAlt, FaUserPlus, FaUndoAlt, FaCheckCircle, FaExchangeAlt, FaHistory } from "react-icons/fa";
import { KpiCard, Card, Button, Badge, ConfirmDialog } from "../components/ui";
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
  const [returnConfirm, setReturnConfirm] = useState({ open: false, asset: null });
  const [repairConfirm, setRepairConfirm] = useState({ open: false, asset: null });

  // Transfer modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAsset, setTransferAsset] = useState(null);
  const [transferForm, setTransferForm] = useState({
    toEntity: "", reason: "", notes: "", authorizedBy: "", transferDate: new Date().toISOString().split("T")[0]
  });
  const [transferring, setTransferring] = useState(false);

  // Transfer history modal
  const [showTransferHistory, setShowTransferHistory] = useState(false);
  const [transferHistory, setTransferHistory] = useState([]);

  // Resolved source entity for the transfer modal (never "ALL")
  const resolvedFromEntity = useMemo(() => {
    if (!transferAsset) return null;
    const raw = (transferAsset.entity || "").toString().trim();
    if (raw && raw.toUpperCase() !== "ALL" && raw.toUpperCase() !== "ALL ENTITIES") {
      return raw.toUpperCase();
    }
    if (selectedEntityCode && selectedEntityCode.toUpperCase() !== "ALL" && selectedEntityCode.toUpperCase() !== "ALL ENTITIES") {
      return selectedEntityCode.toUpperCase();
    }
    return null;
  }, [transferAsset, selectedEntityCode]);

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
    "In Use": "#19cda5",
    "Allocated": "#19cda5",
    Available: "#22c55e",
    "In Stock": "#22c55e",
    "Under Repair": "#f97316",
    "Retired": "#ef4444",
    "Theft/Missing": "#ef4444",
    "Not Submitted": "#f59e0b"
  };

  // --- ACTIONS ---

  const handleReturn = (asset) => {
    setReturnConfirm({ open: true, asset });
  };

  const confirmReturn = async () => {
    const asset = returnConfirm.asset;
    setReturnConfirm({ open: false, asset: null });
    try {
      // Never send "ALL" as entity code — always resolve to the asset's own entity
      const entityCode = (selectedEntityCode && selectedEntityCode !== "ALL")
        ? selectedEntityCode
        : (asset.entity || null);
      await api.updateAsset(asset.id, {
        status: "Available",
        employeeId: null,
        department: null,
        location: null
      }, entityCode);
      toast.success(`Asset ${asset.name} returned successfully`);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to return asset");
    }
  };

  const confirmMarkAvailable = async () => {
    const asset = repairConfirm.asset;
    setRepairConfirm({ open: false, asset: null });
    try {
      const entityCode = (selectedEntityCode && selectedEntityCode !== "ALL")
        ? selectedEntityCode
        : (asset.entity || null);
      await api.updateAsset(asset.id, { status: "Available" }, entityCode);
      toast.success(`Asset ${asset.name} marked as Available`);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to update asset status");
    }
  };

  const openTransferModal = (asset) => {
    setTransferAsset(asset);
    setTransferForm({
      toEntity: "", reason: "", notes: "", authorizedBy: "",
      transferDate: new Date().toISOString().split("T")[0]
    });
    setShowTransferModal(true);
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferForm.toEntity) { toast.warning("Please select a target entity."); return; }

    // Resolve the source entity — never send "ALL" or empty as fromEntity
    const rawFrom = (transferAsset.entity || "").toString().trim();
    const fromEntity = rawFrom && rawFrom.toUpperCase() !== "ALL" && rawFrom.toUpperCase() !== "ALL ENTITIES"
      ? rawFrom.toUpperCase()
      : selectedEntityCode && selectedEntityCode.toUpperCase() !== "ALL" && selectedEntityCode.toUpperCase() !== "ALL ENTITIES"
        ? selectedEntityCode.toUpperCase()
        : "";

    if (!fromEntity) {
      toast.error("Could not determine source entity. Please switch to a specific entity and try again.");
      return;
    }

    setTransferring(true);
    try {
      await api.initiateAssetTransfer({
        assetId: transferAsset.assetId || String(transferAsset.id),
        fromEntity,
        toEntity: transferForm.toEntity,
        reason: transferForm.reason,
        notes: transferForm.notes,
        authorizedBy: transferForm.authorizedBy,
        transferDate: transferForm.transferDate
      });
      toast.success(`Asset "${transferAsset.name}" transferred to ${transferForm.toEntity} successfully.`);
      setShowTransferModal(false);
      loadData();
    } catch (err) {
      toast.error(err.message || "Transfer failed.");
    } finally {
      setTransferring(false);
    }
  };

  const openTransferHistory = async () => {
    try {
      const data = await api.getAssetTransfers();
      setTransferHistory(data || []);
      setShowTransferHistory(true);
    } catch {
      toast.error("Failed to load transfer history.");
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

  // Straight-line depreciation over 3 years (standard IT asset useful life).
  // Returns the current book value, or null if price/date is missing.
  const calcDepreciatedValue = (price, dateOfPurchase, usefulLifeYears = 3) => {
    if (!price || !dateOfPurchase) return null;
    const purchasePrice = parseFloat(String(price).replace(/[^0-9.]/g, ""));
    if (isNaN(purchasePrice) || purchasePrice <= 0) return null;
    const purchaseDate = new Date(dateOfPurchase);
    if (isNaN(purchaseDate.getTime())) return null;
    const yearsElapsed = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (yearsElapsed < 0) return purchasePrice;
    return Math.max(0, purchasePrice * (1 - yearsElapsed / usefulLifeYears));
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "-";
    return "₹" + value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
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
          <Button variant="ghost" onClick={openTransferHistory}>
            <FaHistory style={{ marginRight: 5 }} />Transfers
          </Button>
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
              <th className="sortable" onClick={() => toggleSort("employeeEmail")}>
                Employee Email <SortIndicator column="employeeEmail" />
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
              <th>Depr. Value</th>
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
                  a.employeeEmail,
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
                  <td>{asset.employeeEmail || "-"}</td>
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
                  <td style={{ whiteSpace: "nowrap" }}>
                    {(() => {
                      const dv = calcDepreciatedValue(asset.price, asset.dateOfPurchase);
                      if (dv === null) return <span style={{ color: "var(--text-secondary)" }}>-</span>;
                      const pct = asset.price
                        ? Math.round((dv / parseFloat(String(asset.price).replace(/[^0-9.]/g, ""))) * 100)
                        : null;
                      return (
                        <span title={`Purchase: ₹${parseFloat(String(asset.price).replace(/[^0-9.]/g,"")).toLocaleString("en-IN")}`}>
                          {formatCurrency(dv)}
                          {pct !== null && (
                            <span style={{ fontSize: 11, color: pct > 50 ? "var(--success, #22c55e)" : pct > 0 ? "var(--warning, #f97316)" : "var(--danger, #ef4444)", marginLeft: 4 }}>
                              ({pct}%)
                            </span>
                          )}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    <div className="asset-action-icons">
                      <button
                        className="asset-icon-btn edit"
                        title="Edit Asset"
                        onClick={() => navigate(`/assets/edit/${asset.id}?entity=${encodeURIComponent(asset.entity || "")}`)}
                      >
                        <FaPencilAlt />
                      </button>
                      {isAvailableStatus(asset.status) && (
                        <button
                          className="asset-icon-btn allocate"
                          title="Allocate Asset"
                          onClick={() => navigate(`/assets/allocate?assetId=${encodeURIComponent(asset.id)}`)}
                        >
                          <FaUserPlus />
                        </button>
                      )}
                      {asset.status === "Under Repair" && (
                        <button
                          className="asset-icon-btn return"
                          title="Mark as Available (Repair Complete)"
                          onClick={() => setRepairConfirm({ open: true, asset })}
                        >
                          <FaCheckCircle />
                        </button>
                      )}
                      {isAllocatedStatus(asset.status) && (
                        <button
                          className="asset-icon-btn return"
                          title="Return Asset"
                          onClick={() => handleReturn(asset)}
                        >
                          <FaUndoAlt />
                        </button>
                      )}
                      {!["Retired", "Theft/Missing"].includes(asset.status) && (
                        <button
                          className="asset-icon-btn transfer"
                          title="Transfer to Another Entity"
                          onClick={() => openTransferModal(asset)}
                        >
                          <FaExchangeAlt />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
            {normalizedAssets.length === 0 && (
              <tr>
                <td colSpan="11" style={{ textAlign: "center", padding: "20px" }}>No assets found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= ALLOCATE MODAL ================= */}
      {showAllocateModal && (
        <div className="page-modal-overlay">
          <div className="page-modal page-modal-md">
            <div className="page-modal-header">
              <div><h2>Allocate Asset</h2></div>
              <button className="page-modal-close" onClick={() => setShowAllocateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAllocateSubmit} className="page-modal-body">
              <p style={{ marginBottom: "var(--space-lg)", color: "var(--text-secondary)" }}>Allocate <strong>{selectedAsset?.name}</strong> to an employee.</p>

              <div style={{ marginBottom: "var(--space-lg)" }}>
                <label className="page-modal-label">Select Employee</label>
                <select
                  className="page-modal-input"
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

              <div className="page-modal-footer">
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

      {/* ================= RETURN CONFIRM ================= */}
      <ConfirmDialog
        open={returnConfirm.open}
        title="Return Asset"
        message={`Are you sure you want to return "${returnConfirm.asset?.name}"? It will be marked as Available.`}
        confirmText="Return Asset"
        variant="danger"
        onConfirm={confirmReturn}
        onCancel={() => setReturnConfirm({ open: false, asset: null })}
      />

      {/* ================= REPAIR COMPLETE CONFIRM ================= */}
      <ConfirmDialog
        open={repairConfirm.open}
        title="Mark as Available"
        message={`Confirm that "${repairConfirm.asset?.name}" has been repaired and is ready for use. It will be moved to Available status.`}
        confirmText="Mark Available"
        variant="primary"
        onConfirm={confirmMarkAvailable}
        onCancel={() => setRepairConfirm({ open: false, asset: null })}
      />

      {/* ================= TRANSFER MODAL ================= */}
      {showTransferModal && (
        <div className="page-modal-overlay">
          <div className="page-modal page-modal-lg">
            <div className="page-modal-header">
              <div>
                <h2><FaExchangeAlt style={{ marginRight: 8 }} />Asset Transfer</h2>
                <p style={{ opacity: 0.85, fontSize: 13, marginTop: 4 }}>
                  Transfer asset to another entity with full documentation.
                </p>
              </div>
              <button className="page-modal-close" onClick={() => setShowTransferModal(false)}>✕</button>
            </div>

            <form onSubmit={handleTransferSubmit} className="page-modal-body">
              {/* Warning if entity can't be resolved */}
              {!resolvedFromEntity && (
                <div style={{ background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#92400e" }}>
                  <strong>Warning:</strong> Could not determine the source entity. Please switch to a specific entity view before transferring.
                </div>
              )}

              {/* Asset Summary */}
              <div className="transfer-asset-summary">
                <div className="transfer-summary-row">
                  <span className="transfer-summary-label">Asset ID</span>
                  <span className="transfer-summary-value">{transferAsset?.assetId || transferAsset?.id}</span>
                </div>
                <div className="transfer-summary-row">
                  <span className="transfer-summary-label">Name</span>
                  <span className="transfer-summary-value">{transferAsset?.name}</span>
                </div>
                <div className="transfer-summary-row">
                  <span className="transfer-summary-label">Category</span>
                  <span className="transfer-summary-value">{transferAsset?.category || "—"}</span>
                </div>
                <div className="transfer-summary-row">
                  <span className="transfer-summary-label">Serial No.</span>
                  <span className="transfer-summary-value">{transferAsset?.serialNumber || "—"}</span>
                </div>
                <div className="transfer-summary-row">
                  <span className="transfer-summary-label">Current Status</span>
                  <span className="transfer-summary-value">
                    <Badge variant={isAllocatedStatus(transferAsset?.status) ? "primary" : isAvailableStatus(transferAsset?.status) ? "success" : "warning"}>
                      {transferAsset?.status}
                    </Badge>
                  </span>
                </div>
                <div className="transfer-summary-row">
                  <span className="transfer-summary-label">From Entity</span>
                  <span className="transfer-summary-value transfer-entity-chip">
                    {resolvedFromEntity || <span style={{ color: "var(--danger)", fontStyle: "italic" }}>Unknown</span>}
                  </span>
                </div>
              </div>

              {/* Transfer Details */}
              <div className="transfer-section-title">Transfer Details</div>
              <div className="transfer-form-grid">
                <div className="page-modal-field">
                  <label className="page-modal-label">To Entity <span className="transfer-required">*</span></label>
                  <select
                    className="page-modal-input"
                    value={transferForm.toEntity}
                    onChange={e => setTransferForm(f => ({ ...f, toEntity: e.target.value }))}
                    required
                  >
                    <option value="">— Select Target Entity —</option>
                    {entityList
                      .filter(e => e.code?.toUpperCase() !== resolvedFromEntity)
                      .map(e => (
                        <option key={e.code} value={e.code}>{e.code} — {e.name}</option>
                      ))}
                  </select>
                </div>
                <div className="page-modal-field">
                  <label className="page-modal-label">Transfer Date</label>
                  <input
                    type="date"
                    className="page-modal-input"
                    value={transferForm.transferDate}
                    onChange={e => setTransferForm(f => ({ ...f, transferDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="transfer-form-grid">
                <div className="page-modal-field">
                  <label className="page-modal-label">Transfer Reason <span className="transfer-required">*</span></label>
                  <select
                    className="page-modal-input"
                    value={transferForm.reason}
                    onChange={e => setTransferForm(f => ({ ...f, reason: e.target.value }))}
                    required
                  >
                    <option value="">— Select Reason —</option>
                    <option value="Redeployment">Redeployment</option>
                    <option value="Cost Optimization">Cost Optimization</option>
                    <option value="Project Requirement">Project Requirement</option>
                    <option value="Employee Transfer">Employee Transfer</option>
                    <option value="Capacity Balancing">Capacity Balancing</option>
                    <option value="Maintenance Relocation">Maintenance Relocation</option>
                    <option value="Send for Repair">Send for Repair</option>
                    <option value="Entity Merger">Entity Merger</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="page-modal-field">
                  <label className="page-modal-label">Authorized By</label>
                  <input
                    className="page-modal-input"
                    placeholder="Manager / Approver name"
                    value={transferForm.authorizedBy}
                    onChange={e => setTransferForm(f => ({ ...f, authorizedBy: e.target.value }))}
                  />
                </div>
              </div>

              <div className="page-modal-field">
                <label className="page-modal-label">Transfer Notes</label>
                <textarea
                  className="page-modal-input transfer-notes"
                  placeholder="Any additional context or instructions for the receiving entity..."
                  value={transferForm.notes}
                  onChange={e => setTransferForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="transfer-disclaimer">
                <strong>Note:</strong> The asset will be <strong>retired</strong> from{" "}
                <em>{resolvedFromEntity || "?"}</em> and created as{" "}
                <strong>{transferForm.reason === "Send for Repair" ? "Under Repair" : "Available"}</strong> in the target entity.
                {transferForm.reason === "Send for Repair" && " The asset will be marked as Under Repair in the target entity."}{" "}
                This action is logged for audit purposes.
              </div>

              <div className="page-modal-footer">
                <Button variant="ghost" type="button" onClick={() => setShowTransferModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={transferring || !resolvedFromEntity}>
                  {transferring ? "Transferring…" : <><FaExchangeAlt style={{ marginRight: 6 }} />Confirm Transfer</>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= TRANSFER HISTORY MODAL ================= */}
      {showTransferHistory && (
        <div className="page-modal-overlay">
          <div className="page-modal page-modal-xl">
            <div className="page-modal-header">
              <div>
                <h2><FaHistory style={{ marginRight: 8, color: "var(--primary)" }} />Asset Transfer History</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
                  Complete audit trail of all inter-entity asset transfers.
                </p>
              </div>
              <button className="page-modal-close" onClick={() => setShowTransferHistory(false)}>✕</button>
            </div>
            <div className="page-modal-body" style={{ padding: 0 }}>
              {transferHistory.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                  No asset transfers recorded yet.
                </div>
              ) : (
                <div className="transfer-history-table-wrap">
                  <table className="transfer-history-table">
                    <thead>
                      <tr>
                        <th>Asset ID</th>
                        <th>Asset Name</th>
                        <th>Category</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Reason</th>
                        <th>Authorized By</th>
                        <th>Transfer Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transferHistory.map(t => (
                        <tr key={t.id}>
                          <td><strong>{t.sourceAssetId}</strong></td>
                          <td>{t.assetName}</td>
                          <td>{t.category || "—"}</td>
                          <td><span className="transfer-entity-chip">{t.fromEntity}</span></td>
                          <td><span className="transfer-entity-chip target">{t.toEntity}</span></td>
                          <td>{t.reason || "—"}</td>
                          <td>{t.authorizedBy || "—"}</td>
                          <td>{t.transferDate || "—"}</td>
                          <td>
                            <Badge variant={t.status === "Completed" ? "success" : t.status === "Pending" ? "warning" : "danger"}>
                              {t.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
