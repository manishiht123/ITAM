import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useEntity } from "../context/EntityContext";
import { useToast } from "../context/ToastContext";
import { FaPen, FaTrash, FaBox, FaBuilding, FaTag, FaKey, FaUsers, FaCalendarAlt, FaIdBadge, FaEnvelope, FaUser, FaStickyNote, FaCheckCircle } from "react-icons/fa";
import {
  Button,
  Card,
  Input,
  Select,
  FormField,
  Badge,
  Table,
  Drawer,
  LoadingOverlay,
  PageLayout,
  Grid,
  ConfirmDialog
} from "../components/ui";
import LicenseUsagePie from "../components/charts/LicenseUsagePie";
import SoftwareLicenseTypePie from "../components/charts/SoftwareLicenseTypePie";
import "./Software.css";

export default function Software() {
  const { entity } = useEntity();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState({ licenses: [], assignments: [] });
  const [search, setSearch] = useState("");
  const [licenseSearch, setLicenseSearch] = useState("");
  const [openLicense, setOpenLicense] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [entities, setEntities] = useState([]);
  const [targetEntity, setTargetEntity] = useState("");
  const [editingLicense, setEditingLicense] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: null, item: null });
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [licenseForm, setLicenseForm] = useState({
    product: "",
    vendor: "",
    version: "",
    licenseKey: "",
    seatsOwned: 0,
    seatsUsed: 0,
    renewalDate: "",
    status: "Active"
  });
  const [assignForm, setAssignForm] = useState({
    softwareLicenseId: "",
    employeeId: "",
    employeeName: "",
    employeeEmail: "",
    notes: ""
  });

  useEffect(() => {
    loadInventory();
  }, [entity]);

  useEffect(() => {
    const loadEntities = async () => {
      try {
        const data = await api.getEntities();
        setEntities(data || []);
      } catch (error) {
        console.error("Failed to load entities", error);
        toast.error("Failed to load entities");
      }
    };
    loadEntities();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      if (entity === "ALL") {
        const entitiesData = await api.getEntities();
        const codes = (entitiesData || []).map((e) => e.code).filter(Boolean);
        const results = await Promise.allSettled(
          codes.map(async (code) => ({
            code,
            data: await api.getSoftwareInventory(code)
          }))
        );
        const mergedLicenses = results.flatMap((r) =>
          r.status === "fulfilled"
            ? (r.value?.data?.licenses || []).map((lic) => ({
                ...lic,
                _entityCode: r.value.code
              }))
            : []
        );
        const mergedAssignments = results.flatMap((r) =>
          r.status === "fulfilled"
            ? (r.value?.data?.assignments || []).map((assign) => ({
                ...assign,
                _entityCode: r.value.code
              }))
            : []
        );
        setInventory({
          licenses: mergedLicenses,
          assignments: mergedAssignments
        });
      } else {
        const data = await api.getSoftwareInventory(entity === "ALL" ? null : entity);
        setInventory({
          licenses: data.licenses || [],
          assignments: data.assignments || []
        });
      }
    } catch (error) {
      console.error("Failed to load software inventory", error);
      toast.error("Failed to load software inventory");
    } finally {
      setLoading(false);
    }
  };

  const filteredLicenses = useMemo(() => {
    const rows = inventory.licenses || [];
    if (!licenseSearch) return rows;
    const needle = licenseSearch.toLowerCase();
    return rows.filter((row) =>
      [row.product, row.vendor, row.version, row.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle))
    );
  }, [inventory.licenses, licenseSearch]);

  const filteredAssignments = useMemo(() => {
    const rows = inventory.assignments || [];
    if (!search) return rows;
    const needle = search.toLowerCase();
    return rows.filter((row) => {
      return [
        row.employeeName,
        row.employeeEmail,
        row.employeeId,
        row.license?.product,
        row.license?.vendor
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [inventory.assignments, search]);

  // Chart data: seat usage per license
  const licenseChartData = useMemo(() =>
    (inventory.licenses || []).map(l => ({
      name: l.product,
      seatsUsed: l.seatsUsed || 0,
      seatsOwned: l.seatsOwned || 0,
    })),
    [inventory.licenses]
  );

  // Chart data: license status distribution
  const licenseTypeData = useMemo(() => {
    const counts = {};
    (inventory.licenses || []).forEach(l => {
      const status = l.status || "Unknown";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [inventory.licenses]);

  const handleCreateLicense = async () => {
    const destinationEntity = entity === "ALL" ? targetEntity : entity;
    if (!destinationEntity) {
      toast.warning("Please select an entity to add a license.");
      return;
    }
    if (!licenseForm.product || !licenseForm.vendor) {
      toast.warning("Product and Vendor are required.");
      return;
    }
    try {
      if (editingLicense) {
        await api.updateSoftwareLicense(editingLicense.id, licenseForm, destinationEntity);
        toast.success("License updated successfully!");
      } else {
        await api.addSoftwareLicense(licenseForm, destinationEntity);
        toast.success("License added successfully!");
      }
      setOpenLicense(false);
      setEditingLicense(null);
      setLicenseForm({
        product: "",
        vendor: "",
        version: "",
        licenseKey: "",
        seatsOwned: 0,
        seatsUsed: 0,
        renewalDate: "",
        status: "Active"
      });
      await loadInventory();
    } catch (error) {
      toast.error(error?.message || "Failed to save software license.");
    }
  };

  const handleCreateAssignment = async () => {
    const destinationEntity = entity === "ALL" ? targetEntity : entity;
    if (!destinationEntity) {
      toast.warning("Please select an entity to assign a license.");
      return;
    }
    if (!assignForm.softwareLicenseId || !assignForm.employeeId) {
      toast.warning("Select license and employee.");
      return;
    }
    try {
      if (editingAssignment) {
        await api.updateSoftwareAssignment(editingAssignment.id, assignForm, destinationEntity);
        toast.success("Assignment updated successfully!");
      } else {
        await api.addSoftwareAssignment(assignForm, destinationEntity);
        toast.success("License assigned successfully!");
      }
      setOpenAssign(false);
      setEditingAssignment(null);
      setAssignForm({
        softwareLicenseId: "",
        employeeId: "",
        employeeName: "",
        employeeEmail: "",
        notes: ""
      });
      await loadInventory();
    } catch (error) {
      toast.error(error?.message || "Failed to assign software license.");
    }
  };

  const confirmDelete = async () => {
    const { type, item } = deleteConfirm;
    setDeleteConfirm({ open: false, type: null, item: null });
    try {
      const resolvedEntity = entity === "ALL" ? item._entityCode : entity;
      if (type === "license") {
        await api.deleteSoftwareLicense(item.id, resolvedEntity);
        toast.success(`License "${item.product}" deleted successfully`);
      } else {
        await api.deleteSoftwareAssignment(item.id, resolvedEntity);
        toast.success("Assignment deleted successfully");
      }
      await loadInventory();
    } catch (error) {
      toast.error(error?.message || `Failed to delete ${type}`);
    }
  };

  // ── shared action cell renderer ──────────────────────────────────────────
  const makeActions = (onEdit, onDelete) => (
    <div style={{ display: "flex", gap: "var(--space-sm)" }}>
      <Button variant="ghost"        size="sm" iconOnly icon={<FaPen />}   title="Edit"   onClick={onEdit}   />
      <Button variant="danger-ghost" size="sm" iconOnly icon={<FaTrash />} title="Delete" onClick={onDelete} />
    </div>
  );

  // ── shared cell renderers ─────────────────────────────────────────────────
  const renderProductCell = (name, vendor) => (
    <div className="sw-cell-product">
      <span className="sw-cell-name">{name || "—"}</span>
      {vendor && <span className="sw-cell-sub">{vendor}</span>}
    </div>
  );

  const renderPersonCell = (name, id, email) => (
    <div className="sw-cell-product">
      <span className="sw-cell-name">{name || id || "—"}</span>
      {email && <span className="sw-cell-sub">{email}</span>}
    </div>
  );

  const renderSeats = (used, owned) => {
    const pct = owned > 0 ? Math.round((used / owned) * 100) : 0;
    const color = pct >= 100 ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#22c55e";
    return (
      <div className="sw-cell-seats">
        <span className="sw-cell-seats-num" style={{ color }}>
          {used}<span style={{ opacity: 0.45, fontWeight: 400 }}>/{owned}</span>
        </span>
        <div className="sw-cell-seats-bar">
          <div className="sw-cell-seats-fill" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
        </div>
      </div>
    );
  };

  const renderStatusBadge = (status) => {
    const map = {
      Active:    { bg: "#dcfce7", color: "#15803d" },
      Expired:   { bg: "#fee2e2", color: "#dc2626" },
      Suspended: { bg: "#fef9c3", color: "#92400e" },
    };
    const s = map[status] || { bg: "#f1f5f9", color: "#64748b" };
    return (
      <span className="sw-status-badge" style={{ background: s.bg, color: s.color }}>
        {status || "—"}
      </span>
    );
  };

  const renderDate = (value) => {
    if (!value) return <span style={{ color: "var(--text-secondary)" }}>—</span>;
    return (
      <span className="sw-cell-date">
        {new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
      </span>
    );
  };

  // ── License Catalog columns ───────────────────────────────────────────────
  const licenseColumns = [
    {
      key: 'product',
      label: 'Product',
      render: (_, row) => renderProductCell(row.product, row.vendor)
    },
    {
      key: 'entity',
      label: 'Entity',
      render: (_, row) => {
        const e = row.entity || row._entityCode || entity || "—";
        return <span className="sw-cell-entity">{e}</span>;
      }
    },
    {
      key: 'seats',
      label: 'Seats',
      render: (_, row) => renderSeats(Number(row.seatsUsed || 0), Number(row.seatsOwned || 0))
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => renderStatusBadge(row.status)
    },
    {
      key: 'renewalDate',
      label: 'Renewal',
      render: (value) => renderDate(value)
    },
    {
      key: 'action',
      label: 'Action',
      render: (_, row) => makeActions(
        () => {
          const resolvedEntity = entity === "ALL" ? row._entityCode : entity;
          if (entity === "ALL" && !resolvedEntity) { toast.error("Entity not available for this license."); return; }
          setEditingLicense(row);
          setTargetEntity(resolvedEntity || "");
          setLicenseForm({
            product: row.product || "", vendor: row.vendor || "",
            version: row.version || "", licenseKey: row.licenseKey || "",
            seatsOwned: Number(row.seatsOwned || 0), seatsUsed: Number(row.seatsUsed || 0),
            renewalDate: row.renewalDate || "", status: row.status || "Active"
          });
          setOpenLicense(true);
        },
        () => setDeleteConfirm({ open: true, type: "license", item: row })
      )
    }
  ];

  // ── User-wise Assignment columns ──────────────────────────────────────────
  const assignmentColumns = [
    {
      key: 'employeeName',
      label: 'Employee',
      render: (_, row) => renderPersonCell(row.employeeName, row.employeeId, row.employeeEmail)
    },
    {
      key: 'license',
      label: 'License',
      render: (_, row) => renderProductCell(row.license?.product, row.license?.vendor)
    },
    {
      key: 'entity',
      label: 'Entity',
      render: (_, row) => {
        const e = row._entityCode || entity || "—";
        return <span className="sw-cell-entity">{e}</span>;
      }
    },
    {
      key: 'assignedAt',
      label: 'Assigned On',
      render: (value) => renderDate(value)
    },
    {
      key: 'action',
      label: 'Action',
      render: (_, row) => makeActions(
        () => {
          const resolvedEntity = entity === "ALL" ? row._entityCode : entity;
          if (entity === "ALL" && !resolvedEntity) { toast.error("Entity not available for this assignment."); return; }
          setEditingAssignment(row);
          setTargetEntity(resolvedEntity || "");
          setAssignForm({
            softwareLicenseId: row.softwareLicenseId || row.license?.id || "",
            employeeId: row.employeeId || "", employeeName: row.employeeName || "",
            employeeEmail: row.employeeEmail || "", notes: row.notes || ""
          });
          setOpenAssign(true);
        },
        () => setDeleteConfirm({ open: true, type: "assignment", item: row })
      )
    }
  ];

  return (
    <PageLayout>
      <LoadingOverlay visible={loading} message="Loading software inventory..." />

      <PageLayout.Header
        className="software-page-header"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            Software Inventory
            <Badge variant="primary">{entity || "All Entities"}</Badge>
          </div>
        }
        subtitle="Track software licenses and user-wise assignments."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setTargetEntity(entity === "ALL" ? "" : entity);
                setEditingAssignment(null);
                setOpenAssign(true);
              }}
            >
              Assign License
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setTargetEntity(entity === "ALL" ? "" : entity);
                setEditingLicense(null);
                setOpenLicense(true);
              }}
            >
              Add License
            </Button>
          </>
        }
      />

      <PageLayout.Content>
        {/* Charts row */}
        <Grid columns={2} gap="xl" style={{ marginBottom: "var(--space-xl)" }}>
          <Card>
            <Card.Header>
              <Card.Title>Seat Usage by License</Card.Title>
            </Card.Header>
            <Card.Body>
              <LicenseUsagePie data={licenseChartData} />
            </Card.Body>
          </Card>
          <Card>
            <Card.Header>
              <Card.Title>License Status Distribution</Card.Title>
            </Card.Header>
            <Card.Body>
              <SoftwareLicenseTypePie data={licenseTypeData} />
            </Card.Body>
          </Card>
        </Grid>

        {/* Tables row */}
        <Grid columns={2} gap="xl">
        <Card padding="none">
          <Card.Header>
            <Card.Title>License Catalog</Card.Title>
          </Card.Header>
          <div style={{ padding: 'var(--space-lg)' }}>
            <Input
              placeholder="Search product, vendor, status..."
              value={licenseSearch}
              onChange={(e) => setLicenseSearch(e.target.value)}
              fullWidth
            />
          </div>
          <Table
            data={filteredLicenses}
            columns={licenseColumns}
            emptyMessage="No licenses found."
          />
        </Card>

        <Card padding="none">
          <Card.Header>
            <Card.Title>User-wise Assignments</Card.Title>
          </Card.Header>
          <div style={{ padding: 'var(--space-lg)' }}>
            <Input
              placeholder="Search employee or license..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
            />
          </div>
          <Table
            data={filteredAssignments}
            columns={assignmentColumns}
            emptyMessage="No assignments found."
          />
        </Card>
        </Grid> {/* end tables Grid */}
      </PageLayout.Content>

      {/* License Drawer */}
      <Drawer
        open={openLicense}
        onClose={() => setOpenLicense(false)}
        title={editingLicense ? "Edit Software License" : "Add Software License"}
        size="lg"
      >
        <Drawer.Body>
          {entity === "ALL" && (
            <div className="sw-section">
              <div className="sw-form-section-title">
                <FaBuilding className="sw-form-section-icon" />
                Entity
              </div>
              <FormField label="Target Entity" required>
                <Select
                  value={targetEntity}
                  onChange={(e) => setTargetEntity(e.target.value)}
                  placeholder="Select entity for this license"
                  options={entities.map((ent) => ({
                    value: ent.code,
                    label: `${ent.name} (${ent.code})`
                  }))}
                  fullWidth
                />
              </FormField>
              <div className="sw-form-divider" />
            </div>
          )}

          {/* ── License Details ── */}
          <div className="sw-section">
            <div className="sw-form-section-title">
              <FaBox className="sw-form-section-icon" />
              License Details
            </div>
            <div className="sw-form-row">
              <FormField label="Product Name" required>
                <Input
                  value={licenseForm.product}
                  onChange={(e) => setLicenseForm((prev) => ({ ...prev, product: e.target.value }))}
                  placeholder="e.g. Microsoft Office 365"
                  fullWidth
                />
              </FormField>
              <FormField label="Vendor" required>
                <Input
                  value={licenseForm.vendor}
                  onChange={(e) => setLicenseForm((prev) => ({ ...prev, vendor: e.target.value }))}
                  placeholder="e.g. Microsoft"
                  fullWidth
                />
              </FormField>
            </div>
            <div className="sw-form-row">
              <FormField label="Version">
                <Input
                  value={licenseForm.version}
                  onChange={(e) => setLicenseForm((prev) => ({ ...prev, version: e.target.value }))}
                  placeholder="e.g. 2021"
                  fullWidth
                />
              </FormField>
              <FormField label="License Key">
                <Input
                  className="sw-input-mono"
                  value={licenseForm.licenseKey}
                  onChange={(e) => setLicenseForm((prev) => ({ ...prev, licenseKey: e.target.value }))}
                  placeholder="XXXXX-XXXXX-XXXXX"
                  fullWidth
                />
              </FormField>
            </div>
          </div>

          <div className="sw-form-divider" />

          {/* ── Seat Management ── */}
          <div className="sw-section">
            <div className="sw-form-section-title">
              <FaUsers className="sw-form-section-icon" />
              Seat Management
            </div>
            <div className="sw-form-row">
              <FormField label="Seats Owned" hint="Total licenses purchased">
                <Input
                  type="number"
                  min="0"
                  value={licenseForm.seatsOwned}
                  onChange={(e) => setLicenseForm((prev) => ({ ...prev, seatsOwned: Number(e.target.value) }))}
                  fullWidth
                />
              </FormField>
              <FormField label="Seats Used" hint="Currently assigned seats">
                <Input
                  type="number"
                  min="0"
                  value={licenseForm.seatsUsed}
                  onChange={(e) => setLicenseForm((prev) => ({ ...prev, seatsUsed: Number(e.target.value) }))}
                  fullWidth
                />
              </FormField>
            </div>
            {/* Usage bar */}
            {licenseForm.seatsOwned > 0 && (
              <div className="sw-seat-bar-wrap">
                <div className="sw-seat-bar-track">
                  <div
                    className={`sw-seat-bar-fill${
                      licenseForm.seatsUsed >= licenseForm.seatsOwned ? " over"
                      : licenseForm.seatsUsed / licenseForm.seatsOwned >= 0.8 ? " warn"
                      : ""
                    }`}
                    style={{ width: `${Math.min(100, (licenseForm.seatsUsed / licenseForm.seatsOwned) * 100)}%` }}
                  />
                </div>
                <div className="sw-seat-bar-label">
                  <span>{licenseForm.seatsUsed} used</span>
                  <span>{licenseForm.seatsOwned - licenseForm.seatsUsed >= 0
                    ? `${licenseForm.seatsOwned - licenseForm.seatsUsed} available`
                    : "Over limit"}</span>
                </div>
              </div>
            )}
          </div>

          <div className="sw-form-divider" />

          {/* ── Validity ── */}
          <div className="sw-section">
            <div className="sw-form-section-title">
              <FaCalendarAlt className="sw-form-section-icon" />
              Validity
            </div>
            <div className="sw-form-row">
              <FormField label="Renewal Date">
                <Input
                  type="date"
                  value={licenseForm.renewalDate}
                  onChange={(e) => setLicenseForm((prev) => ({ ...prev, renewalDate: e.target.value }))}
                  fullWidth
                />
              </FormField>
              <FormField label="Status">
                <Select
                  value={licenseForm.status}
                  onChange={(e) => setLicenseForm((prev) => ({ ...prev, status: e.target.value }))}
                  options={[
                    { value: "Active", label: "Active" },
                    { value: "Expired", label: "Expired" },
                    { value: "Suspended", label: "Suspended" }
                  ]}
                  fullWidth
                />
                <div className="sw-status-row">
                  <span className={`sw-status-dot ${licenseForm.status?.toLowerCase()}`} />
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {licenseForm.status === "Active" ? "License is currently active"
                      : licenseForm.status === "Expired" ? "License has expired"
                      : "License is suspended"}
                  </span>
                </div>
              </FormField>
            </div>
          </div>
        </Drawer.Body>

        <Drawer.Footer>
          <Button variant="ghost" onClick={() => setOpenLicense(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreateLicense}>
            {editingLicense ? "Save Changes" : "Add License"}
          </Button>
        </Drawer.Footer>
      </Drawer>

      {/* Assignment Drawer */}
      <Drawer
        open={openAssign}
        onClose={() => setOpenAssign(false)}
        title={editingAssignment ? "Edit Assignment" : "Assign License"}
        size="lg"
      >
        <Drawer.Body>
          {entity === "ALL" && (
            <>
              <div className="sw-form-section-title">
                <FaBuilding className="sw-form-section-icon" />
                Entity
              </div>
              <FormField label="Target Entity" required>
                <Select
                  value={targetEntity}
                  onChange={(e) => setTargetEntity(e.target.value)}
                  placeholder="Select entity for this assignment"
                  options={entities.map((ent) => ({
                    value: ent.code,
                    label: `${ent.name} (${ent.code})`
                  }))}
                  fullWidth
                />
              </FormField>
              <div className="sw-form-divider" />
            </>
          )}

          <div className="sw-form-section-title">
            <FaKey className="sw-form-section-icon" />
            License
          </div>
          <FormField label="Select License" required>
            <Select
              value={assignForm.softwareLicenseId}
              onChange={(e) => setAssignForm((prev) => ({ ...prev, softwareLicenseId: e.target.value }))}
              placeholder="Choose a license to assign"
              options={(inventory.licenses || []).map((lic) => ({
                value: lic.id,
                label: `${lic.product} — ${lic.vendor}${lic.seatsOwned ? ` (${lic.seatsUsed ?? 0}/${lic.seatsOwned} seats used)` : ""}`
              }))}
              fullWidth
            />
          </FormField>

          <div className="sw-form-divider" />
          <div className="sw-form-section-title">
            <FaUser className="sw-form-section-icon" />
            Employee Details
          </div>
          <FormField label="Employee ID" required hint="Enter the official employee ID">
            <Input
              value={assignForm.employeeId}
              onChange={(e) => setAssignForm((prev) => ({ ...prev, employeeId: e.target.value }))}
              placeholder="e.g. OFB1001"
              fullWidth
            />
          </FormField>
          <div className="sw-form-row">
            <FormField label="Full Name">
              <Input
                value={assignForm.employeeName}
                onChange={(e) => setAssignForm((prev) => ({ ...prev, employeeName: e.target.value }))}
                placeholder="Employee full name"
                fullWidth
              />
            </FormField>
            <FormField label="Email Address">
              <Input
                type="email"
                value={assignForm.employeeEmail}
                onChange={(e) => setAssignForm((prev) => ({ ...prev, employeeEmail: e.target.value }))}
                placeholder="employee@company.com"
                fullWidth
              />
            </FormField>
          </div>

          <div className="sw-form-divider" />
          <div className="sw-form-section-title">
            <FaStickyNote className="sw-form-section-icon" />
            Notes
          </div>
          <FormField label="Additional Notes">
            <textarea
              className="sw-textarea"
              value={assignForm.notes}
              onChange={(e) => setAssignForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes or context..."
              rows={3}
            />
          </FormField>
        </Drawer.Body>

        <Drawer.Footer>
          <Button variant="ghost" onClick={() => setOpenAssign(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreateAssignment}>
            {editingAssignment ? "Save Changes" : "Assign License"}
          </Button>
        </Drawer.Footer>
      </Drawer>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title={deleteConfirm.type === "license" ? "Delete License" : "Delete Assignment"}
        message={
          deleteConfirm.type === "license"
            ? `Are you sure you want to delete the license "${deleteConfirm.item?.product}"? All associated assignments will also be removed.`
            : `Are you sure you want to remove the assignment for "${deleteConfirm.item?.employeeName || deleteConfirm.item?.employeeId}"?`
        }
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, type: null, item: null })}
      />
    </PageLayout>
  );
}
