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
import "./Software.css";

export default function Software() {
  const { entity } = useEntity();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState({ licenses: [], assignments: [] });
  const [search, setSearch] = useState("");
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

  // Table columns for licenses
  const licenseColumns = [
    { key: 'product', label: 'Product' },
    { key: 'vendor', label: 'Vendor' },
    {
      key: 'entity',
      label: 'Entity',
      render: (_, row) => (row.entity || row._entityCode || entity) || "—"
    },
    { key: 'seatsOwned', label: 'Seats' },
    { key: 'seatsUsed', label: 'Used' },
    {
      key: 'renewalDate',
      label: 'Renewal',
      render: (value) => value || "—"
    },
    {
      key: 'action',
      label: 'Action',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={<FaPen />}
            title="Edit"
            onClick={() => {
              const resolvedEntity = entity === "ALL" ? row._entityCode : entity;
              if (entity === "ALL" && !resolvedEntity) {
                toast.error("Entity not available for this license.");
                return;
              }
              setEditingLicense(row);
              setTargetEntity(resolvedEntity || "");
              setLicenseForm({
                product: row.product || "",
                vendor: row.vendor || "",
                version: row.version || "",
                licenseKey: row.licenseKey || "",
                seatsOwned: Number(row.seatsOwned || 0),
                seatsUsed: Number(row.seatsUsed || 0),
                renewalDate: row.renewalDate || "",
                status: row.status || "Active"
              });
              setOpenLicense(true);
            }}
          />
          <Button
            variant="danger"
            size="sm"
            iconOnly
            icon={<FaTrash />}
            title="Delete"
            onClick={() => setDeleteConfirm({ open: true, type: "license", item: row })}
          />
        </div>
      )
    }
  ];

  // Table columns for assignments
  const assignmentColumns = [
    {
      key: 'employeeName',
      label: 'Employee',
      render: (_, row) => row.employeeName || row.employeeId
    },
    {
      key: 'employeeEmail',
      label: 'Email',
      render: (value) => value || "—"
    },
    {
      key: 'license',
      label: 'License',
      render: (_, row) => row.license?.product || "—"
    },
    {
      key: 'vendor',
      label: 'Vendor',
      render: (_, row) => row.license?.vendor || "—"
    },
    {
      key: 'assignedAt',
      label: 'Assigned',
      render: (value) => value ? new Date(value).toLocaleDateString() : "—"
    },
    {
      key: 'action',
      label: 'Action',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={<FaPen />}
            title="Edit"
            onClick={() => {
              const resolvedEntity = entity === "ALL" ? row._entityCode : entity;
              if (entity === "ALL" && !resolvedEntity) {
                toast.error("Entity not available for this assignment.");
                return;
              }
              setEditingAssignment(row);
              setTargetEntity(resolvedEntity || "");
              setAssignForm({
                softwareLicenseId: row.softwareLicenseId || row.license?.id || "",
                employeeId: row.employeeId || "",
                employeeName: row.employeeName || "",
                employeeEmail: row.employeeEmail || "",
                notes: row.notes || ""
              });
              setOpenAssign(true);
            }}
          />
          <Button
            variant="danger"
            size="sm"
            iconOnly
            icon={<FaTrash />}
            title="Delete"
            onClick={() => setDeleteConfirm({ open: true, type: "assignment", item: row })}
          />
        </div>
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
        <Grid columns={2} gap="xl">
        <Card padding="none">
          <Card.Header>
            <Card.Title>License Catalog</Card.Title>
          </Card.Header>
          <Table
            data={inventory.licenses || []}
            columns={licenseColumns}
            emptyMessage="No licenses added."
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
        </Grid>
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
            <>
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
            </>
          )}

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
                value={licenseForm.licenseKey}
                onChange={(e) => setLicenseForm((prev) => ({ ...prev, licenseKey: e.target.value }))}
                placeholder="XXXXX-XXXXX-XXXXX"
                fullWidth
              />
            </FormField>
          </div>

          <div className="sw-form-divider" />
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

          <div className="sw-form-divider" />
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
            </FormField>
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
