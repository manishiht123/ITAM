import { useEntity } from "../context/EntityContext";

/* =========================
   PHASE 1 – Executive Snapshot
   ========================= */
import AssetStatusPie from "../components/charts/AssetStatusPie";
import LicenseUsagePie from "../components/charts/LicenseUsagePie";

/* =========================
   PHASE 2A – Asset Distribution & Health
   ========================= */
import AssetCategoryBar from "../components/charts/AssetCategoryBar";
import AssetOSBar from "../components/charts/AssetOSBar";

/* =========================
   PHASE 2B – Alerts & Compliance
   ========================= */
import AlertsPanel from "../components/alerts/AlertsPanel";
import ComplianceSummary from "../components/alerts/ComplianceSummary";

/* =========================
   PHASE 3 – Assignment & Ownership
   ========================= */
import AssignmentTable from "../components/assignment/AssignmentTable";

/* =========================
   PHASE 5 – Quick Access Tables
   ========================= */
import RecentlyAddedAssets from "../components/tables/RecentlyAddedAssets";
import RecentlyAssignedAssets from "../components/tables/RecentlyAssignedAssets";
import AssetsNeedingAttention from "../components/tables/AssetsNeedingAttention";
import UpcomingRenewals from "../components/tables/UpcomingRenewals";

export default function Dashboard() {
  const { entity } = useEntity();

  return (
    <div style={{ padding: 24 }}>
      {/* =========================
          PHASE 1 – EXECUTIVE SNAPSHOT
         ========================= */}

      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>

      {/* KPI ROW */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16
        }}
      >
        <KpiCard title="Total Assets" value="1800" />
        <KpiCard title="Allocated" value="1400" />
        <KpiCard title="Available" value="300" />
        <KpiCard title="Under Repair" value="100" />
      </div>

      {/* PIE ROW */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 24,
          marginTop: 32
        }}
      >
        <Card title="Asset Status Overview">
          <AssetStatusPie entity={entity} />
        </Card>

        <Card title="License Usage Overview">
          <LicenseUsagePie entity={entity} />
        </Card>
      </div>

      {/* =========================
          PHASE 2A – ASSET DISTRIBUTION & HEALTH
         ========================= */}

      <h2 style={{ marginTop: 48 }}>Asset Distribution & Health</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 24,
          marginTop: 24
        }}
      >
        <Card title="Assets by Category">
          <AssetCategoryBar entity={entity} />
        </Card>

        <Card title="Assets by Operating System">
          <AssetOSBar entity={entity} />
        </Card>
      </div>

      {/* =========================
          PHASE 2B – ALERTS & COMPLIANCE
         ========================= */}

      <h2 style={{ marginTop: 48 }}>Alerts & Compliance</h2>

      <div style={{ marginTop: 24 }}>
        <AlertsPanel entity={entity} />
      </div>

      <div style={{ marginTop: 24 }}>
        <ComplianceSummary entity={entity} />
      </div>

      {/* =========================
          PHASE 3 – ASSIGNMENT & OWNERSHIP
         ========================= */}

      <h2 style={{ marginTop: 48 }}>Assignment & Ownership</h2>

      <div style={{ marginTop: 24 }}>
        <Card title="Asset Assignments">
          <AssignmentTable entity={entity} />
        </Card>
      </div>

      {/* =========================
          PHASE 5 – QUICK ACCESS (OPERATIONAL)
         ========================= */}

      <h2 style={{ marginTop: 48 }}>Quick Access</h2>

      <div style={{ marginTop: 24 }}>
        <Card title="Recently Added Assets">
          <RecentlyAddedAssets entity={entity} />
        </Card>
      </div>

      <div style={{ marginTop: 24 }}>
        <Card title="Recently Assigned Assets">
          <RecentlyAssignedAssets entity={entity} />
        </Card>
      </div>

      <div style={{ marginTop: 24 }}>
        <Card title="Assets Needing Attention">
          <AssetsNeedingAttention entity={entity} />
        </Card>
      </div>

      <div style={{ marginTop: 24 }}>
        <Card title="Upcoming Renewals">
          <UpcomingRenewals entity={entity} />
        </Card>
      </div>
    </div>
  );
}

/* =========================
   REUSABLE UI COMPONENTS
   ========================= */

function KpiCard({ title, value }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 16,
        background: "#fff"
      }}
    >
      <p style={{ fontSize: 14, color: "#6b7280" }}>{title}</p>
      <h2 style={{ marginTop: 8 }}>{value}</h2>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 16,
        background: "#fff"
      }}
    >
      <h4 style={{ marginBottom: 16 }}>{title}</h4>
      {children}
    </div>
  );
}
