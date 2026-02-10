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
  const { entity, setEntity } = useEntity();
  const toast = useToast();
  const [entities, setEntities] = useState([]);
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

  const kpis = [
    { label: "Assets Tracked", value: "4,820" },
    { label: "Compliance Score", value: "92%" },
    { label: "Licenses Overused", value: "13" },
    { label: "Upcoming Renewals", value: "28" }
  ];

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

  const recentExports = [
    { id: 1, name: "Monthly Asset Inventory", owner: "Admin", date: "2026-01-22", status: "Completed" },
    { id: 2, name: "License Compliance Q4", owner: "IT Ops", date: "2026-01-15", status: "Completed" },
    { id: 3, name: "Upcoming Renewals", owner: "Audit", date: "2026-01-10", status: "Scheduled" }
  ];

  const selectedEntity = useMemo(() => {
    return entity === "ALL"
      ? null
      : entities.find((item) => item.code === entity) || null;
  }, [entity, entities]);

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
      const codes = (entities || []).map((e) => e.code).filter(Boolean);
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
      return { licenses, assignments };
    }
    return api.getSoftwareInventory(entity);
  };

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

  const recentExportsColumns = [
    { key: 'name', label: 'Report' },
    { key: 'owner', label: 'Owner' },
    { key: 'date', label: 'Date' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <Badge variant={value === "Scheduled" ? "warning" : "success"}>
          {value}
        </Badge>
      )
    }
  ];

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

        <Card>
          <Card.Header>
            <Card.Title>Filters</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="filters">
              <Input placeholder="Search reports..." fullWidth />
              <Select
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
                options={[
                  { value: "ALL", label: "All entities" },
                  ...entities.map((ent) => ({
                    value: ent.code,
                    label: `${ent.name} (${ent.code})`
                  }))
                ]}
                fullWidth
              />
              <Select
                value={customReport.range}
                onChange={(e) => setCustomReport((prev) => ({ ...prev, range: e.target.value }))}
                options={[
                  { value: "30", label: "Last 30 days" },
                  { value: "7", label: "Last 7 days" },
                  { value: "90", label: "Quarter to date" },
                  { value: "365", label: "Year to date" }
                ]}
                fullWidth
              />
              <Select
                options={[
                  { value: "all", label: "All types" },
                  { value: "inventory", label: "Inventory" },
                  { value: "compliance", label: "Compliance" },
                  { value: "audit", label: "Audit" }
                ]}
                fullWidth
              />
            </div>
          </Card.Body>
        </Card>

        <Card padding="none">
          <Card.Header>
            <Card.Title>Recent Exports</Card.Title>
          </Card.Header>
          <Table
            data={recentExports}
            columns={recentExportsColumns}
            emptyMessage="No recent exports."
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
