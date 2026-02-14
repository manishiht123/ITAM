import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { useEntity } from "../../context/EntityContext";
import { useToast } from "../../context/ToastContext";
import { getEntityLogo } from "../../config/entityLogos";
import {
  Button,
  Card,
  Input,
  Select,
  FormField,
  Badge,
  Table,
  Drawer,
  KpiCard
} from "../../components/ui";
import "./Reports.css";

export default function Reports() {
  const { entity } = useEntity();
  const toast = useToast();
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    assets: [],
    licenses: [],
    assignments: [],
    activity: []
  });
  const [openCustom, setOpenCustom] = useState(false);
  const [customReport, setCustomReport] = useState({
    name: "Custom Report",
    type: "assets",
    range: "30",
    includeAll: true
  });

  useEffect(() => {
    const loadEntities = async () => {
      try {
        const data = await api.getEntities();
        setEntities(data || []);
      } catch (err) {
        console.error("Failed to load entities", err);
      }
    };
    loadEntities();
  }, []);

  const templates = [
    {
      title: "Asset Inventory Summary",
      description: "Counts by category, status, and entity with last audit date."
    },
    {
      title: "License Compliance",
      description: "Owned vs. used seats with overage and renewal timeline."
    },
    {
      title: "Assignment & Ownership",
      description: "Assigned vs. unassigned assets, users, and departments."
    }
  ];

  const selectedEntity = useMemo(() => {
    return entity === "ALL"
      ? null
      : entities.find((item) => item.code === entity) || null;
  }, [entity, entities]);

  const normalizeCompliance = (row) => {
    const owned = Number(row?.seatsOwned || 0);
    const used = Number(row?.seatsUsed || 0);
    if (owned <= 0) return used > 0 ? "Critical" : "Good";
    if (used > owned) return "Critical";
    if (used / owned >= 0.9) return "Watch";
    return "Good";
  };

  const isUpcomingRenewal = (dateValue, days = 30) => {
    if (!dateValue) return false;
    const dt = new Date(dateValue);
    if (Number.isNaN(dt.getTime())) return false;
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    return dt >= start && dt <= end;
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return String(value);
    return dt.toLocaleString();
  };

  const downloadCsv = (rows, filename) => {
    if (!rows.length) {
      toast.warning("No data available for this report.");
      return;
    }
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filename} downloaded successfully!`);
  };

  const exportAssetsReport = async () => {
    try {
      const blob = await api.exportAssets(entity === "ALL" ? null : entity, "csv");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "assets_report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Assets report downloaded successfully!");
    } catch (err) {
      toast.error("Failed to export assets report.");
    }
  };

  const loadSoftwareData = async () => {
    if (entity === "ALL") {
      let scopedEntities = entities || [];
      if (!scopedEntities.length) {
        scopedEntities = await api.getEntities().catch(() => []);
      }

      const codes = scopedEntities.map((e) => e.code).filter(Boolean);
      const results = await Promise.allSettled(
        codes.map(async (code) => ({
          code,
          data: await api.getSoftwareInventory(code)
        }))
      );

      const licenses = results.flatMap((r) =>
        r.status === "fulfilled"
          ? (r.value?.data?.licenses || []).map((lic) => ({
              ...lic,
              _entityCode: r.value.code
            }))
          : []
      );

      const assignments = results.flatMap((r) =>
        r.status === "fulfilled"
          ? (r.value?.data?.assignments || []).map((assign) => ({
              ...assign,
              _entityCode: r.value.code
            }))
          : []
      );

      const defaultData = await api.getSoftwareInventory(null).catch(() => null);
      return {
        licenses: [...licenses, ...(defaultData?.licenses || [])],
        assignments: [...assignments, ...(defaultData?.assignments || [])]
      };
    }

    return api.getSoftwareInventory(entity);
  };

  useEffect(() => {
    let active = true;

    const loadLiveData = async () => {
      setLoading(true);
      try {
        const [assetsRes, softwareRes, auditRes] = await Promise.all([
          api.getAssets(entity === "ALL" ? null : entity).catch(() => []),
          loadSoftwareData().catch(() => ({ licenses: [], assignments: [] })),
          api.getAuditLogs().catch(() => [])
        ]);

        if (!active) return;

        setReportData({
          assets: Array.isArray(assetsRes) ? assetsRes : [],
          licenses: softwareRes?.licenses || [],
          assignments: softwareRes?.assignments || [],
          activity: Array.isArray(auditRes) ? auditRes : []
        });
      } catch (err) {
        if (active) {
          toast.error("Failed to load live report data.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadLiveData();
    return () => {
      active = false;
    };
  }, [entity, entities, toast]);

  const kpis = useMemo(() => {
    const licenses = reportData.licenses || [];
    const overused = licenses.filter((row) => normalizeCompliance(row) === "Critical").length;
    const totalLicenses = licenses.length || 1;
    const compliance = Math.round(((totalLicenses - overused) / totalLicenses) * 100);
    const upcomingRenewals = licenses.filter((row) => isUpcomingRenewal(row.renewalDate, 30)).length;

    return [
      { label: "Assets Tracked", value: reportData.assets.length },
      { label: "Compliance Score", value: `${compliance}%` },
      { label: "Licenses Overused", value: overused },
      { label: "Upcoming Renewals", value: upcomingRenewals }
    ];
  }, [reportData.assets, reportData.licenses]);

  const recentActivity = useMemo(() => {
    return (reportData.activity || []).slice(0, 8).map((row) => ({
      name: row.action || "System activity",
      owner: row.user || "System",
      date: formatDateTime(row.timestamp),
      status: /fail|error|denied/i.test(String(row.action || "")) ? "Attention" : "Completed"
    }));
  }, [reportData.activity]);

  const recentExportsColumns = [
    { key: "name", label: "Activity" },
    { key: "owner", label: "User" },
    { key: "date", label: "Timestamp" },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <Badge variant={value === "Attention" ? "warning" : "success"}>
          {value}
        </Badge>
      )
    }
  ];

  const exportLicenseReport = async () => {
    const data = await loadSoftwareData();
    const rows = (data.licenses || []).map((lic, idx) => ({
      "S. No": idx + 1,
      Product: lic.product,
      Vendor: lic.vendor,
      Entity: lic.entity || lic._entityCode || entity,
      "Seats Owned": lic.seatsOwned,
      "Seats Used": lic.seatsUsed,
      Renewal: lic.renewalDate || ""
    }));
    downloadCsv(rows, "license_report.csv");
  };

  const exportAssignmentReport = async () => {
    const data = await loadSoftwareData();
    const rows = (data.assignments || []).map((assign, idx) => ({
      "S. No": idx + 1,
      Employee: assign.employeeName || assign.employeeId,
      Email: assign.employeeEmail || "",
      License: assign.license?.product || "",
      Vendor: assign.license?.vendor || "",
      Entity: assign.entity || assign._entityCode || entity,
      Assigned: assign.assignedAt
        ? new Date(assign.assignedAt).toLocaleDateString()
        : ""
    }));
    downloadCsv(rows, "assignment_report.csv");
  };

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h1>
            Reports
            {selectedEntity && (
              <span style={{ marginLeft: 12, display: "inline-flex", alignItems: "center", gap: 8 }}>
                <img
                  src={getEntityLogo(selectedEntity.code)}
                  alt={`${selectedEntity.code} logo`}
                  style={{ height: 22 }}
                />
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                  {selectedEntity.name} ({selectedEntity.code})
                </span>
              </span>
            )}
          </h1>
          <p>Generate audit-ready exports and scheduled reports across assets, licenses, and compliance.</p>
        </div>
        <div className="reports-actions">
          <Button
            variant="secondary"
            onClick={() => toast.info("Report scheduling is coming soon.")}
          >
            Schedule Report
          </Button>
          <Button
            variant="primary"
            onClick={() => setOpenCustom(true)}
          >
            Custom Report
          </Button>
        </div>
      </div>

      <div className="reports-grid">
        <Card>
          <div className="kpi-row">
            {kpis.map((kpi) => (
              <KpiCard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                size="sm"
                loading={loading}
              />
            ))}
          </div>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Report Templates</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="report-tiles">
              {templates.map((item) => (
                <div className="report-tile" key={item.title}>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      if (item.title === "Asset Inventory Summary") {
                        await exportAssetsReport();
                      } else if (item.title === "License Compliance") {
                        await exportLicenseReport();
                      } else {
                        await exportAssignmentReport();
                      }
                    }}
                  >
                    Generate
                  </Button>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>

        <Card padding="none">
          <Card.Header>
            <Card.Title>Recent Activity</Card.Title>
          </Card.Header>
          <Table
            data={recentActivity}
            columns={recentExportsColumns}
            loading={loading}
            emptyMessage="No recent activity."
          />
        </Card>
      </div>

      <Drawer
        open={openCustom}
        onClose={() => setOpenCustom(false)}
        title="Create Custom Report"
        size="md"
      >
        <Drawer.Body>
          <FormField label="Report Name">
            <Input
              value={customReport.name}
              onChange={(e) => setCustomReport((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
            />
          </FormField>

          <FormField label="Report Type">
            <Select
              value={customReport.type}
              onChange={(e) => setCustomReport((prev) => ({ ...prev, type: e.target.value }))}
              options={[
                { value: "assets", label: "Asset Inventory" },
                { value: "licenses", label: "License Compliance" },
                { value: "assignments", label: "Assignment & Ownership" }
              ]}
              fullWidth
            />
          </FormField>

          <FormField label="Date Range">
            <Select
              value={customReport.range}
              onChange={(e) => setCustomReport((prev) => ({ ...prev, range: e.target.value }))}
              options={[
                { value: "7", label: "Last 7 days" },
                { value: "30", label: "Last 30 days" },
                { value: "90", label: "Last 90 days" },
                { value: "365", label: "Last 12 months" }
              ]}
              fullWidth
            />
          </FormField>
        </Drawer.Body>

        <Drawer.Footer>
          <Button variant="secondary" onClick={() => setOpenCustom(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              try {
                if (customReport.type === "assets") {
                  await exportAssetsReport();
                } else if (customReport.type === "licenses") {
                  await exportLicenseReport();
                } else {
                  await exportAssignmentReport();
                }
                setOpenCustom(false);
              } catch (err) {
                toast.error(err.message || "Failed to generate report.");
              }
            }}
          >
            Generate Report
          </Button>
        </Drawer.Footer>
      </Drawer>
    </div>
  );
}
