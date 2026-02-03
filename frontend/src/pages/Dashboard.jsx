import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEntity } from "../context/EntityContext";
import { getDashboardData } from "../services/dashboardService";

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
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    getDashboardData(entity)
      .then((data) => {
        if (!active) return;
        setDashboardData(data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || "Failed to load dashboard data");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [entity]);

  return (
    <div style={{ padding: 24 }}>
      {loading && <p style={{ color: "#6b7280" }}>Loading dashboard…</p>}
      {!loading && error && (
        <p style={{ color: "#dc2626" }}>{error}</p>
      )}

      {/* =========================
          PHASE 1 – EXECUTIVE SNAPSHOT
         ========================= */}

      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>

      {/* KPI ROW */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
          gap: 12
        }}
      >
        <KpiCard
          title="Total Assets"
          value={dashboardData?.kpis?.totalAssets ?? "—"}
          compact
          onClick={() => navigate("/assets")}
        />
        <KpiCard
          title="Allocated"
          value={dashboardData?.kpis?.allocated ?? "—"}
          compact
          onClick={() => navigate("/assets?status=In%20Use")}
        />
        <KpiCard
          title="Available"
          value={dashboardData?.kpis?.available ?? "—"}
          compact
          onClick={() => navigate("/assets?status=Available")}
        />
        <KpiCard
          title="Under Repair"
          value={dashboardData?.kpis?.underRepair ?? "—"}
          compact
          onClick={() => navigate("/assets?status=Under%20Repair")}
        />
        <KpiCard
          title="Total Licenses"
          value={dashboardData?.licenseKpis?.totalLicenses ?? "—"}
          compact
          onClick={() => navigate("/settings/licenses")}
        />
        <KpiCard
          title="Overused Seats"
          value={dashboardData?.licenseKpis?.overusedSeats ?? "—"}
          compact
          onClick={() => navigate("/settings/licenses")}
        />
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
          <AssetStatusPie data={dashboardData?.statusBreakdown} />
        </Card>

        <Card title="License Usage Overview">
          <LicenseUsagePie data={dashboardData?.licenseUsage} />
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
          <AssetCategoryBar data={dashboardData?.categoryBreakdown} />
        </Card>

        <Card title="Assets by Operating System">
          <AssetOSBar data={dashboardData?.osBreakdown} />
        </Card>
      </div>

      {/* =========================
          PHASE 2B – ALERTS & COMPLIANCE
         ========================= */}

      <h2 style={{ marginTop: 48 }}>Alerts & Compliance</h2>

      <div style={{ marginTop: 24 }}>
        <AlertsPanel alerts={dashboardData?.alerts} />
      </div>

      <div style={{ marginTop: 24 }}>
        <ComplianceSummary items={dashboardData?.compliance} />
      </div>

      {/* =========================
          PHASE 3 – ASSIGNMENT & OWNERSHIP
         ========================= */}

      <h2 style={{ marginTop: 48 }}>Assignment & Ownership</h2>

      <div style={{ marginTop: 24 }}>
        <Card title="Asset Assignments">
          <AssignmentTable
            entity={entity}
            rows={dashboardData?.assignments}
          />
        </Card>
      </div>

      {/* =========================
          PHASE 5 – QUICK ACCESS (OPERATIONAL)
         ========================= */}

      <h2 style={{ marginTop: 48 }}>Quick Access</h2>

      <div style={{ marginTop: 24 }}>
        <Card title="Recently Added Assets">
          <RecentlyAddedAssets
            entity={entity}
            rows={dashboardData?.recentlyAdded}
          />
        </Card>
      </div>

      <div style={{ marginTop: 24 }}>
        <Card title="Recently Assigned Assets">
          <RecentlyAssignedAssets
            entity={entity}
            rows={dashboardData?.recentlyAssigned}
          />
        </Card>
      </div>

      <div style={{ marginTop: 24 }}>
        <Card title="Assets Needing Attention">
          <AssetsNeedingAttention
            entity={entity}
            rows={dashboardData?.attentionItems}
          />
        </Card>
      </div>

      <div style={{ marginTop: 24 }}>
        <Card title="Upcoming Renewals">
          <UpcomingRenewals
            entity={entity}
            rows={dashboardData?.upcomingRenewals}
          />
        </Card>
      </div>
    </div>
  );
}

/* =========================
   REUSABLE UI COMPONENTS
   ========================= */

function KpiCard({ title, value, compact, onClick }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: compact ? "10px 12px" : 16,
        background: "#fff",
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.2s ease"
      }}
      onClick={onClick}
    >
      <p style={{ fontSize: compact ? 11 : 14, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>{title}</p>
      <h2 style={{ marginTop: 6, fontSize: compact ? 18 : 24 }}>{value}</h2>
    </div>
  );
}

function Card({ title, children, onClick }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 16,
        background: "#fff",
        cursor: onClick ? "pointer" : "default"
      }}
      onClick={onClick}
    >
      <h4 style={{ marginBottom: 16 }}>{title}</h4>
      {children}
    </div>
  );
}
