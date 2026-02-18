import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { useEntity } from "../../context/EntityContext";
import { useToast } from "../../context/ToastContext";
import ofbLogo from "../../assets/logos/default.svg";
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

  const entityNameMap = useMemo(() => {
    const map = {};
    entities.forEach(e => { map[e.code] = e.name || e.code; });
    return map;
  }, [entities]);

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

  const downloadHtmlReport = (title, columns, rows) => {
    if (!rows.length) {
      toast.warning("No data available for this report.");
      return;
    }

    const entityLogo = selectedEntity?.logo || (entity === "ALL" ? ofbLogo : "");
    const entityName = selectedEntity?.name || (entity !== "ALL" ? entity : "All Entities");
    const reportDate = new Date().toLocaleDateString("en-GB", {
      year: "numeric", month: "long", day: "numeric"
    });

    const logoHtml = entityLogo
      ? `<img src="${entityLogo}" alt="${entityName}" style="height:52px;max-width:160px;object-fit:contain;border-radius:6px;" />`
      : `<div style="width:52px;height:52px;border-radius:8px;background:#1a56db;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;">${entity.slice(0, 4).toUpperCase()}</div>`;

    const headerCells = columns.map(col => `<th>${col.label}</th>`).join("");
    const dataRows = rows.map(row =>
      `<tr>${columns.map(col => `<td>${row[col.key] ?? "-"}</td>`).join("")}</tr>`
    ).join("\n");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #111827; background: #fff; }
    .container { max-width: 960px; margin: 0 auto; padding: 32px 28px; }
    .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 18px; border-bottom: 2px solid #1a56db; margin-bottom: 24px; }
    .header-text { text-align: right; }
    .header-entity { font-size: 15px; font-weight: 700; color: #1a56db; }
    .header-title { font-size: 18px; font-weight: 700; color: #111827; margin-top: 2px; }
    .header-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    th { background: #1a56db; color: #fff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; padding: 9px 12px; text-align: left; }
    td { border: 1px solid #e5e7eb; padding: 8px 12px; font-size: 13px; color: #374151; }
    tr:nth-child(even) td { background: #f9fafb; }
    .doc-footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; display: flex; justify-content: space-between; }
    @media print {
      .container { padding: 16px; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoHtml}
      <div class="header-text">
        <div class="header-entity">${entityName}</div>
        <div class="header-title">${title}</div>
        <div class="header-sub">ITAM &middot; Generated on ${reportDate}</div>
      </div>
    </div>
    <table>
      <thead><tr>${headerCells}</tr></thead>
      <tbody>
${dataRows}
      </tbody>
    </table>
    <div class="doc-footer">
      <span>${entityName} &middot; IT Asset Management</span>
      <span>Report Date: ${reportDate}</span>
    </div>
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 350);
      window.addEventListener('afterprint', function() { window.close(); });
    });
  </script>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.warning("Please allow pop-ups to export PDF reports.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const exportAssetsReport = () => {
    const columns = [
      { key: "assetId", label: "Asset ID" },
      { key: "name", label: "Asset Name" },
      { key: "category", label: "Category" },
      { key: "serialNumber", label: "Serial Number" },
      { key: "status", label: "Status" },
      { key: "entity", label: "Entity" },
      { key: "employeeId", label: "Employee ID" },
      { key: "employeeName", label: "Employee Name" },
      { key: "employeeEmail", label: "Employee Email" },
      { key: "department", label: "Department" },
      { key: "location", label: "Location" },
      { key: "purchaseDate", label: "Purchase Date" },
      { key: "allocationDate", label: "Allocation Date" }
    ];
    const rows = reportData.assets.map(asset => ({
      assetId: asset.assetId || asset.id || "-",
      name: asset.name || "-",
      category: asset.category || "-",
      serialNumber: asset.serialNumber || "-",
      status: asset.status || "-",
      entity: entityNameMap[asset.entityCode || asset.entity] || asset.entityCode || asset.entity || entityNameMap[entity] || entity,
      employeeId: asset.employeeId || "-",
      employeeName: asset.employeeName || "-",
      employeeEmail: asset.employeeEmail || "-",
      department: asset.employeeDepartment || asset.department || "-",
      location: asset.location || "-",
      purchaseDate: asset.dateOfPurchase ? new Date(asset.dateOfPurchase).toLocaleDateString() : "-",
      allocationDate: asset.status === "In Use" && asset.updatedAt
        ? new Date(asset.updatedAt).toLocaleDateString()
        : "-"
    }));
    downloadHtmlReport("Asset Inventory Summary", columns, rows);
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
    const columns = [
      { key: "sno", label: "S. No" },
      { key: "product", label: "Product" },
      { key: "vendor", label: "Vendor" },
      { key: "entity", label: "Entity" },
      { key: "seatsOwned", label: "Seats Owned" },
      { key: "seatsUsed", label: "Seats Used" },
      { key: "renewal", label: "Renewal Date" }
    ];
    const rows = (data.licenses || []).map((lic, idx) => {
      const code = lic.entity || lic._entityCode || entity;
      return {
        sno: idx + 1,
        product: lic.product || "-",
        vendor: lic.vendor || "-",
        entity: entityNameMap[code] || code,
        seatsOwned: lic.seatsOwned ?? "-",
        seatsUsed: lic.seatsUsed ?? "-",
        renewal: lic.renewalDate || "-"
      };
    });
    downloadHtmlReport("License Compliance Report", columns, rows);
  };

  const exportAssignmentReport = async () => {
    const data = await loadSoftwareData();
    const columns = [
      { key: "sno", label: "S. No" },
      { key: "employee", label: "Employee" },
      { key: "email", label: "Email" },
      { key: "license", label: "License" },
      { key: "vendor", label: "Vendor" },
      { key: "entity", label: "Entity" },
      { key: "assigned", label: "Assigned On" }
    ];
    const rows = (data.assignments || []).map((assign, idx) => {
      const code = assign.entity || assign._entityCode || entity;
      return {
        sno: idx + 1,
        employee: assign.employeeName || assign.employeeId || "-",
        email: assign.employeeEmail || "-",
        license: assign.license?.product || "-",
        vendor: assign.license?.vendor || "-",
        entity: entityNameMap[code] || code,
        assigned: assign.assignedAt ? new Date(assign.assignedAt).toLocaleDateString() : "-"
      };
    });
    downloadHtmlReport("Assignment & Ownership Report", columns, rows);
  };

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h1>
            Reports
            <Badge variant="primary" style={{ marginLeft: 10, fontSize: 12, verticalAlign: "middle" }}>
              {selectedEntity ? selectedEntity.code : "All Entities"}
            </Badge>
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
