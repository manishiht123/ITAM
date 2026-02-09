import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEntity } from "../context/EntityContext";
import { getDashboardData } from "../services/dashboardService";

/* =========================
   UI Components
   ========================= */
import { KpiCard, Card, Spinner, PageLayout, Badge } from "../components/ui";

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

import "./Dashboard.css";

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

  if (loading) {
    return (
      <PageLayout>
        <div className="dashboard-loading">
          <Spinner size="lg" />
          <p>Loading dashboard…</p>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <PageLayout.Header title="Dashboard" />
        <PageLayout.Content>
          <Card variant="bordered">
            <Card.Body>
              <p style={{ color: "var(--danger)" }}>{error}</p>
            </Card.Body>
          </Card>
        </PageLayout.Content>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* =========================
          PHASE 1 – EXECUTIVE SNAPSHOT
         ========================= */}
      <PageLayout.Header
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            Dashboard
            <Badge variant="primary">{entity || "All Entities"}</Badge>
          </div>
        }
        subtitle="Real-time overview of your IT assets and operations"
      />

      <PageLayout.Content>
        {/* KPI ROW */}
        <div className="dashboard-kpi-grid">
          <KpiCard
            label="Total Assets"
            value={dashboardData?.kpis?.totalAssets ?? "—"}
            size="sm"
            onClick={() => navigate("/assets")}
          />
          <KpiCard
            label="Allocated"
            value={dashboardData?.kpis?.allocated ?? "—"}
            size="sm"
            onClick={() => navigate("/assets?status=In%20Use")}
            variant="success"
          />
          <KpiCard
            label="Available"
            value={dashboardData?.kpis?.available ?? "—"}
            size="sm"
            onClick={() => navigate("/assets?status=Available")}
          />
          <KpiCard
            label="Under Repair"
            value={dashboardData?.kpis?.underRepair ?? "—"}
            size="sm"
            onClick={() => navigate("/assets?status=Under%20Repair")}
            variant="warning"
          />
          <KpiCard
            label="Total Licenses"
            value={dashboardData?.licenseKpis?.totalLicenses ?? "—"}
            size="sm"
            onClick={() => navigate("/settings/licenses")}
          />
          <KpiCard
            label="Overused Seats"
            value={dashboardData?.licenseKpis?.overusedSeats ?? "—"}
            size="sm"
            onClick={() => navigate("/settings/licenses")}
            variant="danger"
          />
        </div>

        {/* PIE ROW */}
        <div className="dashboard-chart-grid">
          <Card>
            <Card.Header>
              <Card.Title>Asset Status Overview</Card.Title>
            </Card.Header>
            <Card.Body>
              <AssetStatusPie data={dashboardData?.statusBreakdown} />
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>License Usage Overview</Card.Title>
            </Card.Header>
            <Card.Body>
              <LicenseUsagePie data={dashboardData?.licenseUsage} />
            </Card.Body>
          </Card>
        </div>

        {/* =========================
            PHASE 2A – ASSET DISTRIBUTION & HEALTH
           ========================= */}
        <h2 className="dashboard-section-title">Asset Distribution & Health</h2>

        <div className="dashboard-chart-grid">
          <Card>
            <Card.Header>
              <Card.Title>Assets by Category</Card.Title>
            </Card.Header>
            <Card.Body>
              <AssetCategoryBar data={dashboardData?.categoryBreakdown} />
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Assets by Operating System</Card.Title>
            </Card.Header>
            <Card.Body>
              <AssetOSBar data={dashboardData?.osBreakdown} />
            </Card.Body>
          </Card>
        </div>

        {/* =========================
            PHASE 2B – ALERTS & COMPLIANCE
           ========================= */}
        <h2 className="dashboard-section-title">Alerts & Compliance</h2>

        <AlertsPanel alerts={dashboardData?.alerts} />

        <ComplianceSummary items={dashboardData?.compliance} />

        {/* =========================
            PHASE 3 – ASSIGNMENT & OWNERSHIP
           ========================= */}
        <h2 className="dashboard-section-title">Assignment & Ownership</h2>

        <Card>
          <Card.Header>
            <Card.Title>Asset Assignments</Card.Title>
          </Card.Header>
          <Card.Body>
            <AssignmentTable
              entity={entity}
              rows={dashboardData?.assignments}
            />
          </Card.Body>
        </Card>

        {/* =========================
            PHASE 5 – QUICK ACCESS (OPERATIONAL)
           ========================= */}
        <h2 className="dashboard-section-title">Quick Access</h2>

        <Card>
          <Card.Header>
            <Card.Title>Recently Added Assets</Card.Title>
          </Card.Header>
          <Card.Body>
            <RecentlyAddedAssets
              entity={entity}
              rows={dashboardData?.recentlyAdded}
            />
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Recently Assigned Assets</Card.Title>
          </Card.Header>
          <Card.Body>
            <RecentlyAssignedAssets
              entity={entity}
              rows={dashboardData?.recentlyAssigned}
            />
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Assets Needing Attention</Card.Title>
          </Card.Header>
          <Card.Body>
            <AssetsNeedingAttention
              entity={entity}
              rows={dashboardData?.attentionItems}
            />
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Upcoming Renewals</Card.Title>
          </Card.Header>
          <Card.Body>
            <UpcomingRenewals
              entity={entity}
              rows={dashboardData?.upcomingRenewals}
            />
          </Card.Body>
        </Card>
      </PageLayout.Content>
    </PageLayout>
  );
}
