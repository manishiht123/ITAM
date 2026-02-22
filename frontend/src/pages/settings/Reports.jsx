import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../../services/api";
import { useEntity } from "../../context/EntityContext";
import { useToast } from "../../context/ToastContext";
import ofbLogo from "../../assets/logos/default.svg";
import {
  Button,
  Card,
  Badge,
  KpiCard,
  ConfirmDialog
} from "../../components/ui";
import {
  FaBoxes,
  FaShieldAlt,
  FaUsers,
  FaDownload,
  FaCalendarAlt,
  FaChartBar,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHistory,
  FaPlus,
  FaEdit,
  FaTrash,
  FaPlay,
  FaClock,
  FaEnvelope,
  FaToggleOn,
  FaToggleOff
} from "react-icons/fa";
import "./Reports.css";

/* ── Schedule helpers ─────────────────────────────────────────────────────── */
const SCH_REPORT_TYPES = [
  { value: "assets",      label: "Asset Inventory",    icon: <FaBoxes />,    color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  { value: "licenses",    label: "License Compliance", icon: <FaShieldAlt />, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  { value: "assignments", label: "Assignment Report",  icon: <FaUsers />,    color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  }
];
const SCH_FREQUENCIES = [
  { value: "daily",     label: "Daily",     desc: "Every day at the specified time" },
  { value: "weekly",    label: "Weekly",    desc: "Once a week on your chosen day" },
  { value: "monthly",   label: "Monthly",   desc: "Once a month on a specific date" },
  { value: "quarterly", label: "Quarterly", desc: "Q1/Q2/Q3/Q4 on a specific date" }
];
const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const SCH_EMPTY = { name: "", reportType: "assets", entityCode: "", frequency: "weekly", time: "08:00", dayOfWeek: 1, dayOfMonth: 1, recipients: "", enabled: true };

const ordinal = (n) => { const s=["th","st","nd","rd"]; const v=n%100; return s[(v-20)%10]||s[v]||s[0]; };
const getScheduleLabel = (s) => {
  const t = s.time || "08:00";
  switch (s.frequency) {
    case "daily":     return `Every day at ${t}`;
    case "weekly":    return `Every ${DAY_NAMES[s.dayOfWeek??1]} at ${t}`;
    case "monthly":   return `${s.dayOfMonth??1}${ordinal(s.dayOfMonth??1)} of every month at ${t}`;
    case "quarterly": return `Quarterly, ${s.dayOfMonth??1}${ordinal(s.dayOfMonth??1)} day at ${t}`;
    default: return s.frequency;
  }
};
const formatNextRun = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  const now = new Date();
  const diffMs = d - now;
  const diffDays = Math.floor(diffMs / 86400000);
  const diffHrs  = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor(diffMs / 60000);
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  let rel = diffMins < 0 ? "Overdue" : diffMins < 60 ? `in ${diffMins}m` : diffHrs < 24 ? `in ${diffHrs}h` : diffDays === 0 ? "Today" : diffDays === 1 ? "Tomorrow" : `in ${diffDays}d`;
  return `${date} ${time} (${rel})`;
};

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
  const [generating, setGenerating] = useState(null);
  const [customReport, setCustomReport] = useState({
    name: "Custom Report",
    type: "assets",
    range: "30"
  });

  /* ── Schedule state ─────────────────────────────────────── */
  const [showSchFormModal, setShowSchFormModal] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [schLoading, setSchLoading] = useState(true);
  const [editingSchId, setEditingSchId] = useState(null);
  const [schForm, setSchForm] = useState(SCH_EMPTY);
  const [schSaving, setSchSaving] = useState(false);
  const [schRunningId, setSchRunningId] = useState(null);
  const [schTogglingId, setSchTogglingId] = useState(null);
  const [schDeleteConfirm, setSchDeleteConfirm] = useState({ open: false, id: null, name: "" });
  const [schFormError, setSchFormError] = useState("");

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

  /* ── Schedule functions ──────────────────────────────────── */
  const loadSchedules = useCallback(async () => {
    setSchLoading(true);
    try {
      const data = await api.getReportSchedules();
      setSchedules(data || []);
    } catch {
      toast.error("Failed to load schedules");
    } finally {
      setSchLoading(false);
    }
  }, [toast]);

  /* Load schedules on mount */
  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const openSchCreate = () => {
    setEditingSchId(null);
    setSchForm({ ...SCH_EMPTY, entityCode: entity !== "ALL" ? entity : "" });
    setSchFormError("");
    setShowSchFormModal(true);
  };

  const openSchEdit = (s) => {
    setEditingSchId(s.id);
    setSchForm({
      name: s.name || "",
      reportType: s.reportType || "assets",
      entityCode: s.entityCode || "",
      frequency: s.frequency || "weekly",
      time: s.time || "08:00",
      dayOfWeek: s.dayOfWeek ?? 1,
      dayOfMonth: s.dayOfMonth ?? 1,
      recipients: Array.isArray(s.recipients) ? s.recipients.join(", ") : (s.recipients || ""),
      enabled: s.enabled !== false
    });
    setSchFormError("");
    setShowSchFormModal(true);
  };

  const validateSchForm = () => {
    if (!schForm.name.trim()) return "Schedule name is required.";
    const emails = schForm.recipients.split(",").map(e => e.trim()).filter(Boolean);
    if (!emails.length) return "At least one recipient email is required.";
    const invalid = emails.find(e => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (invalid) return `Invalid email: ${invalid}`;
    return "";
  };

  const handleSchSave = async (e) => {
    e.preventDefault();
    const err = validateSchForm();
    if (err) { setSchFormError(err); return; }
    setSchFormError("");
    setSchSaving(true);
    try {
      const recipients = schForm.recipients.split(",").map(e => e.trim()).filter(Boolean);
      const payload = {
        name: schForm.name.trim(),
        reportType: schForm.reportType,
        entityCode: schForm.entityCode || null,
        frequency: schForm.frequency,
        time: schForm.time,
        dayOfWeek: schForm.frequency === "weekly" ? Number(schForm.dayOfWeek) : null,
        dayOfMonth: ["monthly","quarterly"].includes(schForm.frequency) ? Number(schForm.dayOfMonth) : null,
        recipients,
        enabled: schForm.enabled
      };
      if (editingSchId) {
        await api.updateReportSchedule(editingSchId, payload);
        toast.success("Schedule updated");
      } else {
        await api.createReportSchedule(payload);
        toast.success("Schedule created");
      }
      setShowSchFormModal(false);
      loadSchedules();
    } catch (err) {
      setSchFormError(err.message || "Failed to save schedule");
    } finally {
      setSchSaving(false);
    }
  };

  const handleSchToggle = async (s) => {
    setSchTogglingId(s.id);
    try {
      const recipients = Array.isArray(s.recipients) ? s.recipients : [];
      await api.updateReportSchedule(s.id, { ...s, recipients, enabled: !s.enabled });
      setSchedules(prev => prev.map(x => x.id === s.id ? { ...x, enabled: !x.enabled } : x));
      toast.success(`Schedule ${!s.enabled ? "enabled" : "disabled"}`);
    } catch (err) {
      toast.error(err.message || "Failed to toggle schedule");
    } finally {
      setSchTogglingId(null);
    }
  };

  const handleSchRunNow = async (s) => {
    setSchRunningId(s.id);
    try {
      await api.runReportScheduleNow(s.id);
      toast.success(`Report "${s.name}" sent!`);
      loadSchedules();
    } catch (err) {
      toast.error(err.message || "Failed to run report");
    } finally {
      setSchRunningId(null);
    }
  };

  const handleSchDelete = (s) => setSchDeleteConfirm({ open: true, id: s.id, name: s.name });

  const confirmSchDelete = async () => {
    const { id } = schDeleteConfirm;
    setSchDeleteConfirm({ open: false, id: null, name: "" });
    try {
      await api.deleteReportSchedule(id);
      toast.success("Schedule deleted");
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      toast.error(err.message || "Failed to delete schedule");
    }
  };

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
      : `<div style="width:52px;height:52px;border-radius:8px;background:#1a56db;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;">${String(entity || "IT").slice(0, 4).toUpperCase()}</div>`;

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
    .container { width: 100%; padding: 24px 28px; }
    .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; border-bottom: 2px solid #1a56db; margin-bottom: 20px; }
    .header-text { text-align: right; }
    .header-entity { font-size: 13px; font-weight: 700; color: #1a56db; text-transform: uppercase; letter-spacing: 0.05em; }
    .header-title { font-size: 16px; font-weight: 700; color: #111827; margin-top: 2px; }
    .header-sub { font-size: 10px; color: #6b7280; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; table-layout: auto; }
    th { background: #1a56db; color: #fff; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; padding: 7px 8px; text-align: left; white-space: nowrap; }
    td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 11px; color: #374151; word-break: break-word; }
    tr:nth-child(even) td { background: #f9fafb; }
    .doc-footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; display: flex; justify-content: space-between; }
    @media print {
      @page { size: A4 landscape; margin: 12mm 10mm; }
      .container { padding: 0; }
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
    return () => { active = false; };
  }, [entity, entities, toast]);

  const kpis = useMemo(() => {
    const licenses = reportData.licenses || [];
    const overused = licenses.filter((row) => normalizeCompliance(row) === "Critical").length;
    const totalLicenses = licenses.length || 1;
    const compliance = Math.round(((totalLicenses - overused) / totalLicenses) * 100);
    const upcomingRenewals = licenses.filter((row) => isUpcomingRenewal(row.renewalDate, 30)).length;

    return [
      { label: "Assets Tracked", value: reportData.assets.length, variant: "primary" },
      { label: "Compliance Score", value: `${compliance}%`, variant: compliance >= 80 ? "success" : "warning" },
      { label: "Licenses Overused", value: overused, variant: overused > 0 ? "danger" : "success" },
      { label: "Upcoming Renewals", value: upcomingRenewals, variant: upcomingRenewals > 0 ? "warning" : "success" }
    ];
  }, [reportData.assets, reportData.licenses]);

  const recentActivity = useMemo(() => {
    return (reportData.activity || []).slice(0, 8).map((row) => ({
      action: row.action || "System activity",
      user: row.user || "System",
      date: formatDateTime(row.timestamp || row.createdAt),
      isError: /fail|error|denied/i.test(String(row.action || ""))
    }));
  }, [reportData.activity]);

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

  const handleGenerate = async (type) => {
    setGenerating(type);
    try {
      if (type === "assets") await exportAssetsReport();
      else if (type === "licenses") await exportLicenseReport();
      else await exportAssignmentReport();
    } catch (err) {
      toast.error(err.message || "Failed to generate report.");
    } finally {
      setGenerating(null);
    }
  };

  const handleCustomGenerate = async () => {
    await handleGenerate(customReport.type);
    setOpenCustom(false);
  };

  const templates = [
    {
      key: "assets",
      icon: <FaBoxes />,
      iconColor: "#3b82f6",
      iconBg: "rgba(59,130,246,0.12)",
      title: "Asset Inventory Summary",
      description: "Full inventory with category, status, employee, department and purchase details.",
      badge: `${reportData.assets.length} records`,
      badgeVariant: "primary"
    },
    {
      key: "licenses",
      icon: <FaShieldAlt />,
      iconColor: "#10b981",
      iconBg: "rgba(16,185,129,0.12)",
      title: "License Compliance",
      description: "Owned vs. used seats with overage detection and upcoming renewal timeline.",
      badge: `${reportData.licenses.length} licenses`,
      badgeVariant: "success"
    },
    {
      key: "assignments",
      icon: <FaUsers />,
      iconColor: "#f59e0b",
      iconBg: "rgba(245,158,11,0.12)",
      title: "Assignment & Ownership",
      description: "Software assignments per employee with license and vendor details.",
      badge: `${reportData.assignments.length} records`,
      badgeVariant: "warning"
    }
  ];

  /* ── Schedule stats ──────────────────────────────────────── */
  const schStats = useMemo(() => ({
    total:   schedules.length,
    active:  schedules.filter(s => s.enabled).length,
    ok:      schedules.filter(s => s.lastStatus === "success").length,
    failed:  schedules.filter(s => s.lastStatus === "failed").length
  }), [schedules]);

  return (
    <div className="reports-page">
      {/* ===== HEADER ===== */}
      <div className="reports-header">
        <div>
          <h1>
            <FaChartBar className="reports-title-icon" />
            Reports
            <Badge variant="primary" style={{ marginLeft: 10, fontSize: 12, verticalAlign: "middle" }}>
              {selectedEntity ? selectedEntity.code : "All Entities"}
            </Badge>
          </h1>
          <p>Generate audit-ready exports across assets, licenses, and compliance.</p>
        </div>
        <div className="reports-actions">
          <Button variant="secondary" onClick={openSchCreate}>
            <FaCalendarAlt style={{ marginRight: 6 }} />
            New Schedule
          </Button>
          <Button variant="primary" onClick={() => setOpenCustom(true)}>
            <FaChartBar style={{ marginRight: 6 }} />
            Custom Report
          </Button>
        </div>
      </div>

      {/* ===== KPI CARDS ===== */}
      <div className="reports-kpi-grid">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            size="sm"
            variant={kpi.variant}
            loading={loading}
          />
        ))}
      </div>

      {/* ===== REPORT TEMPLATES ===== */}
      <Card>
        <Card.Header>
          <Card.Title>Report Templates</Card.Title>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Click Generate to open a print-ready PDF report</span>
        </Card.Header>
        <Card.Body>
          <div className="report-tiles">
            {templates.map((item) => (
              <div className="report-tile" key={item.key}>
                <div className="report-tile-top">
                  <div className="report-tile-icon" style={{ background: item.iconBg, color: item.iconColor }}>
                    {item.icon}
                  </div>
                  <Badge variant={item.badgeVariant}>{item.badge}</Badge>
                </div>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={generating === item.key || loading}
                  onClick={() => handleGenerate(item.key)}
                  style={{ marginTop: "auto" }}
                >
                  {generating === item.key
                    ? "Generating…"
                    : <><FaDownload style={{ marginRight: 5 }} />Generate</>
                  }
                </Button>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* ===== SCHEDULED REPORTS ===== */}
      <Card>
        <Card.Header>
          <div className="rsch-header-left">
            <Card.Title>
              <FaCalendarAlt style={{ marginRight: 8, opacity: 0.8 }} />
              Scheduled Reports
            </Card.Title>
            {/* Stats pills */}
            <div className="rsch-stats">
              <span className="rsch-stat">{schStats.total} Total</span>
              <span className="rsch-stat rsch-stat--active">{schStats.active} Active</span>
              {schStats.ok > 0 && <span className="rsch-stat rsch-stat--ok">{schStats.ok} Delivered</span>}
              {schStats.failed > 0 && <span className="rsch-stat rsch-stat--failed">{schStats.failed} Failed</span>}
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={openSchCreate}>
            <FaPlus style={{ marginRight: 5 }} /> New Schedule
          </Button>
        </Card.Header>
        <Card.Body style={{ padding: 0 }}>
          {schLoading ? (
            <div className="reports-empty">Loading schedules…</div>
          ) : schedules.length === 0 ? (
            <div className="rsch-empty">
              <FaCalendarAlt className="rsch-empty-icon" />
              <div className="rsch-empty-title">No scheduled reports yet</div>
              <div className="rsch-empty-sub">
                Automate report delivery to your team on a daily, weekly, or monthly basis.
              </div>
              <Button variant="primary" size="sm" onClick={openSchCreate}>
                <FaPlus style={{ marginRight: 5 }} /> Create First Schedule
              </Button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="reports-activity-table rsch-table">
                <thead>
                  <tr>
                    <th>Schedule Name</th>
                    <th>Report Type</th>
                    <th>Frequency</th>
                    <th>Entity</th>
                    <th>Recipients</th>
                    <th>Next Run</th>
                    <th>Last Status</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map(s => {
                    const rt = SCH_REPORT_TYPES.find(r => r.value === s.reportType) || SCH_REPORT_TYPES[0];
                    const recip = Array.isArray(s.recipients) ? s.recipients : [];
                    return (
                      <tr key={s.id} className={!s.enabled ? "rsch-row-paused" : ""}>
                        {/* Name */}
                        <td>
                          <div className="rsch-name">{s.name}</div>
                          {!s.enabled && <span className="rsch-paused-tag">Paused</span>}
                        </td>
                        {/* Type */}
                        <td>
                          <span className="rsch-type-badge" style={{ color: rt.color, background: rt.bg }}>
                            {rt.icon} {rt.label}
                          </span>
                        </td>
                        {/* Frequency */}
                        <td className="rsch-freq">
                          <FaClock style={{ opacity: 0.4, marginRight: 5, fontSize: 11 }} />
                          {getScheduleLabel(s)}
                        </td>
                        {/* Entity */}
                        <td>
                          <span className="rsch-entity-badge">
                            {s.entityCode || "All"}
                          </span>
                        </td>
                        {/* Recipients */}
                        <td className="rsch-recip">
                          <FaEnvelope style={{ opacity: 0.35, marginRight: 5, fontSize: 11 }} />
                          <span title={recip.join(", ")}>
                            {recip.length === 0
                              ? <em style={{ color: "var(--text-secondary)" }}>None</em>
                              : recip.length === 1
                                ? recip[0]
                                : `${recip[0]} +${recip.length - 1} more`}
                          </span>
                        </td>
                        {/* Next Run */}
                        <td className="rsch-next-run">
                          {s.enabled ? formatNextRun(s.nextRun) : "—"}
                        </td>
                        {/* Last Status */}
                        <td>
                          {!s.lastStatus
                            ? <Badge variant="neutral">Pending</Badge>
                            : s.lastStatus === "success"
                              ? <Badge variant="success"><FaCheckCircle style={{ marginRight: 4 }} />Delivered</Badge>
                              : <Badge variant="danger" title={s.lastError}><FaExclamationTriangle style={{ marginRight: 4 }} />Failed</Badge>
                          }
                        </td>
                        {/* Actions */}
                        <td>
                          <div className="rsch-actions">
                            {/* Toggle */}
                            <button
                              className="rsch-act-btn rsch-act-toggle"
                              title={s.enabled ? "Disable schedule" : "Enable schedule"}
                              disabled={schTogglingId === s.id}
                              onClick={() => handleSchToggle(s)}
                            >
                              {s.enabled ? <FaToggleOn style={{ color: "#10b981" }} /> : <FaToggleOff />}
                            </button>
                            {/* Run Now */}
                            <button
                              className="rsch-act-btn"
                              title="Run now"
                              disabled={schRunningId === s.id}
                              onClick={() => handleSchRunNow(s)}
                            >
                              {schRunningId === s.id
                                ? <span className="rsch-spinner" />
                                : <FaPlay style={{ color: "#10b981", fontSize: 10 }} />}
                            </button>
                            {/* Edit */}
                            <button
                              className="rsch-act-btn"
                              title="Edit schedule"
                              onClick={() => openSchEdit(s)}
                            >
                              <FaEdit style={{ color: "var(--primary)", fontSize: 11 }} />
                            </button>
                            {/* Delete */}
                            <button
                              className="rsch-act-btn rsch-act-del"
                              title="Delete schedule"
                              onClick={() => handleSchDelete(s)}
                            >
                              <FaTrash style={{ fontSize: 11 }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* ===== RECENT ACTIVITY ===== */}
      <Card>
        <Card.Header>
          <Card.Title><FaHistory style={{ marginRight: 8, opacity: 0.7 }} />Recent Activity</Card.Title>
        </Card.Header>
        <Card.Body style={{ padding: 0 }}>
          {loading ? (
            <div className="reports-empty">Loading activity…</div>
          ) : recentActivity.length === 0 ? (
            <div className="reports-empty">No recent activity found.</div>
          ) : (
            <table className="reports-activity-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>User</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((row, i) => (
                  <tr key={i}>
                    <td>{row.action}</td>
                    <td>{row.user}</td>
                    <td>{row.date}</td>
                    <td>
                      {row.isError
                        ? <span className="activity-status error"><FaExclamationTriangle /> Attention</span>
                        : <span className="activity-status success"><FaCheckCircle /> Completed</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card.Body>
      </Card>

      {/* ===== SCHEDULE FORM MODAL ===== */}
      {showSchFormModal && (
        <div
          className="reports-modal-overlay"
          style={{ alignItems: "flex-start", overflowY: "auto", padding: "24px 16px" }}
          onClick={e => { if (e.target === e.currentTarget) setShowSchFormModal(false); }}
        >
          <div className="reports-modal" style={{ maxWidth: 660, width: "100%" }}>
            {/* Header */}
            <div className="reports-modal-header">
              <div>
                <h2>
                  <FaCalendarAlt style={{ marginRight: 8, color: "var(--primary)" }} />
                  {editingSchId ? "Edit Schedule" : "New Report Schedule"}
                </h2>
                <p>{editingSchId ? "Update the automated report configuration." : "Configure automated report delivery via email."}</p>
              </div>
              <button className="reports-modal-close" onClick={() => setShowSchFormModal(false)} aria-label="Close">
                <FaTimes />
              </button>
            </div>

            {/* Form */}
            <div className="reports-modal-body" style={{ padding: "0 24px 24px" }}>
              <form onSubmit={handleSchSave} style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 20 }}>
                {schFormError && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#ef4444" }}>
                    <FaExclamationTriangle /> {schFormError}
                  </div>
                )}

                {/* Name */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Schedule Name <span style={{ color: "#ef4444" }}>*</span></label>
                  <input className="reports-input" value={schForm.name} onChange={e => setSchForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Weekly Asset Report for IT Team" required />
                </div>

                {/* Report Type */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Report Type <span style={{ color: "#ef4444" }}>*</span></label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {SCH_REPORT_TYPES.map(rt => (
                      <button key={rt.value} type="button" onClick={() => setSchForm(p => ({ ...p, reportType: rt.value }))}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${schForm.reportType === rt.value ? rt.color : "var(--border)"}`, background: schForm.reportType === rt.value ? rt.bg : "var(--bg-muted)", cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                        <span style={{ width: 30, height: 30, borderRadius: 8, background: rt.bg, color: rt.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{rt.icon}</span>
                        <span>{rt.label}</span>
                        {schForm.reportType === rt.value && <FaCheckCircle style={{ marginLeft: "auto", color: rt.color }} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Entity + Frequency */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Entity</label>
                    <select className="reports-input" value={schForm.entityCode} onChange={e => setSchForm(p => ({ ...p, entityCode: e.target.value }))}>
                      <option value="">All Entities</option>
                      {entities.map(e => <option key={e.code} value={e.code}>{e.code} — {e.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Frequency <span style={{ color: "#ef4444" }}>*</span></label>
                    <select className="reports-input" value={schForm.frequency} onChange={e => setSchForm(p => ({ ...p, frequency: e.target.value }))}>
                      {SCH_FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label} — {f.desc}</option>)}
                    </select>
                  </div>
                </div>

                {/* Time + Day */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Send Time <span style={{ color: "#ef4444" }}>*</span></label>
                    <input type="time" className="reports-input" value={schForm.time} onChange={e => setSchForm(p => ({ ...p, time: e.target.value }))} required />
                  </div>
                  {schForm.frequency === "weekly" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Day of Week</label>
                      <select className="reports-input" value={schForm.dayOfWeek} onChange={e => setSchForm(p => ({ ...p, dayOfWeek: Number(e.target.value) }))}>
                        {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                      </select>
                    </div>
                  )}
                  {["monthly","quarterly"].includes(schForm.frequency) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Day of Month</label>
                      <select className="reports-input" value={schForm.dayOfMonth} onChange={e => setSchForm(p => ({ ...p, dayOfMonth: Number(e.target.value) }))}>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}{ordinal(d)}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                {/* Recipients */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    <FaEnvelope style={{ marginRight: 6, opacity: 0.7 }} />
                    Recipients <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input className="reports-input" value={schForm.recipients} onChange={e => setSchForm(p => ({ ...p, recipients: e.target.value }))} placeholder="manager@company.com, it-team@company.com" />
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Separate multiple email addresses with commas.</span>
                </div>

                {/* Enable Toggle */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-muted)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Enable Schedule</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Disabled schedules will not run automatically.</div>
                  </div>
                  <button type="button" onClick={() => setSchForm(p => ({ ...p, enabled: !p.enabled }))}
                    style={{ position: "relative", width: 44, height: 24, borderRadius: 999, border: "none", cursor: "pointer", background: schForm.enabled ? "#10b981" : "var(--border)", transition: "background 0.2s", flexShrink: 0 }}>
                    <span style={{ position: "absolute", top: 3, left: 3, width: 18, height: 18, background: "#fff", borderRadius: "50%", transition: "transform 0.2s", display: "block", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transform: schForm.enabled ? "translateX(20px)" : "none" }} />
                  </button>
                </div>

                {/* Info box */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  <FaChartBar style={{ color: "var(--primary)", flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: "var(--text-primary)" }}>How it works:</strong> The report will be generated with live data and sent as a CSV attachment via your configured SMTP server.
                    Configure SMTP in <em>Settings → Notifications</em>.
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 8, borderTop: "1px solid var(--border)", marginTop: 4 }}>
                  <Button type="button" variant="secondary" onClick={() => setShowSchFormModal(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" disabled={schSaving}>
                    {schSaving ? "Saving…" : editingSchId ? "Update Schedule" : "Create Schedule"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ===== CUSTOM REPORT MODAL ===== */}
      {openCustom && (
        <div className="reports-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpenCustom(false); }}>
          <div className="reports-modal">
            <div className="reports-modal-header">
              <div>
                <h2><FaChartBar style={{ marginRight: 8, color: "var(--primary)" }} />Custom Report</h2>
                <p>Configure and generate a tailored report</p>
              </div>
              <button className="reports-modal-close" onClick={() => setOpenCustom(false)} aria-label="Close">
                <FaTimes />
              </button>
            </div>

            <div className="reports-modal-body">
              <div className="reports-form-group">
                <label>Report Name</label>
                <input
                  className="reports-input"
                  value={customReport.name}
                  onChange={(e) => setCustomReport((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter report name"
                />
              </div>

              <div className="reports-form-group">
                <label>Report Type</label>
                <div className="reports-type-grid">
                  {templates.map((t) => (
                    <button
                      key={t.key}
                      className={`reports-type-btn ${customReport.type === t.key ? "active" : ""}`}
                      onClick={() => setCustomReport((prev) => ({ ...prev, type: t.key }))}
                    >
                      <span className="reports-type-icon" style={{ color: t.iconColor, background: t.iconBg }}>
                        {t.icon}
                      </span>
                      <span>{t.title}</span>
                      {customReport.type === t.key && <FaCheckCircle className="reports-type-check" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="reports-form-group">
                <label>Date Range</label>
                <select
                  className="reports-input"
                  value={customReport.range}
                  onChange={(e) => setCustomReport((prev) => ({ ...prev, range: e.target.value }))}
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last 12 months</option>
                  <option value="all">All time</option>
                </select>
              </div>

              <div className="reports-preview-info">
                <FaCalendarAlt style={{ color: "var(--primary)", flexShrink: 0 }} />
                <span>
                  This will generate a <strong>{templates.find(t => t.key === customReport.type)?.title}</strong> report
                  {" "}for <strong>{selectedEntity?.name || "All Entities"}</strong>.
                  The report will open in a new tab ready to print or save as PDF.
                </span>
              </div>
            </div>

            <div className="reports-modal-footer">
              <Button variant="secondary" onClick={() => setOpenCustom(false)}>Cancel</Button>
              <Button
                variant="primary"
                disabled={generating !== null}
                onClick={handleCustomGenerate}
              >
                {generating ? "Generating…" : <><FaDownload style={{ marginRight: 6 }} />Generate Report</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SCHEDULE DELETE CONFIRM ===== */}
      <ConfirmDialog
        open={schDeleteConfirm.open}
        title="Delete Schedule"
        message={`Are you sure you want to delete "${schDeleteConfirm.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmSchDelete}
        onCancel={() => setSchDeleteConfirm({ open: false, id: null, name: "" })}
      />
    </div>
  );
}
