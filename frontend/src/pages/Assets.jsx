import { useState } from "react";
import "./Assets.css";
import KpiCard from "../components/KpiCard";
import ChartCard from "../components/ChartCard";
import DonutChart from "../components/DonutChart";
import { useNavigate } from "react-router-dom";

export default function Assets() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [selectedEntity, setSelectedEntity] = useState(null);

  const kpis = {
    total: 6,
    inUse: 3,
    available: 2,
    repair: 1,
    retired: 0,
  };

  const entityCounts = {
    OFB: 3,
    Oxyzo: 3,
  };

  const statusCounts = {
    "In Use": 3,
    Available: 2,
    "Under Repair": 1,
  };

  const ENTITY_COLORS = {
    OFB: "#9333ea",
    Oxyzo: "#22c55e",
  };

  const STATUS_COLORS = {
    "In Use": "#4f46e5",
    Available: "#22c55e",
    "Under Repair": "#f97316",
  };

  return (
    <div className="assets-page">
      {/* ================= HEADER ================= */}
      <div className="assets-header">
        <div>
          <h1>Assets</h1>
          <p className="assets-subtitle">
            Centralized inventory across entities
          </p>
        </div>

        <div className="asset-actions">
          <button className="asset-action-btn primary" onClick={() => navigate("/assets/add")}>+ Add Asset</button>
          <button className="asset-action-btn primary" onClick={() => navigate("/assets/allocate")}>Allocate</button>
          <button className="asset-action-btn secondary">Import</button>
          <button className="asset-action-btn secondary">Export</button>
        </div>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="asset-kpis">
        <KpiCard label="Total Assets" value={kpis.total} />
        <KpiCard label="In Use" value={kpis.inUse} />
        <KpiCard label="Available" value={kpis.available} />
        <KpiCard label="Under Repair" value={kpis.repair} />
        <KpiCard label="Retired" value={kpis.retired} />
      </div>

      {/* ================= CHARTS ROW ================= */}
      <div className="assets-charts">

      {/* Assets by Entity */}
      <ChartCard title="Assets by Entity">
        <DonutChart
         data={entityCounts}
         total={kpis.total}
         colors={ENTITY_COLORS}
         selected={selectedEntity}
         onSelect={setSelectedEntity}
         />
      </ChartCard>

      {/* Assets by Status */}
      <ChartCard title="Assets by Status">
       {Object.entries(statusCounts).map(([status, count]) => (
        <div key={status} className="status-row">
          <span>{status}</span>

          <div className="status-bar">
            <div
              className="fill"
              style={{
                width: `${(count / kpis.total) * 100}%`,
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

        {selectedEntity && (
          <button onClick={() => setSelectedEntity(null)}>
            Clear Entity Filter
          </button>
        )}
      </div>

      {/* ================= TABLE ================= */}
      <div className="asset-table-wrapper">
        {/* Keep your existing table JSX here */}
      </div>
    </div>
  );
}

