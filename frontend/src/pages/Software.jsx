import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useEntity } from "../context/EntityContext";
import "./Software.css";

export default function Software() {
  const { entity } = useEntity();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState({ licenses: [], assignments: [] });
  const [search, setSearch] = useState("");
  const [openLicense, setOpenLicense] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [entities, setEntities] = useState([]);
  const [targetEntity, setTargetEntity] = useState("");
  const [editingLicense, setEditingLicense] = useState(null);
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
      alert("Please select an entity to add a license.");
      return;
    }
    if (!licenseForm.product || !licenseForm.vendor) {
      alert("Product and Vendor are required.");
      return;
    }
    try {
      if (editingLicense) {
        await api.updateSoftwareLicense(editingLicense.id, licenseForm, destinationEntity);
      } else {
        await api.addSoftwareLicense(licenseForm, destinationEntity);
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
      alert(error?.message || "Failed to add software license.");
    }
  };

  const handleCreateAssignment = async () => {
    const destinationEntity = entity === "ALL" ? targetEntity : entity;
    if (!destinationEntity) {
      alert("Please select an entity to assign a license.");
      return;
    }
    if (!assignForm.softwareLicenseId || !assignForm.employeeId) {
      alert("Select license and employee.");
      return;
    }
    try {
      await api.addSoftwareAssignment(assignForm, destinationEntity);
      setOpenAssign(false);
      setAssignForm({
        softwareLicenseId: "",
        employeeId: "",
        employeeName: "",
        employeeEmail: "",
        notes: ""
      });
      await loadInventory();
    } catch (error) {
      alert(error?.message || "Failed to assign software license.");
    }
  };

  return (
    <div className="software-page">
      <div className="software-header">
        <div>
          <h1>Software Inventory</h1>
          <p>Track software licenses and user-wise assignments.</p>
          <div className="software-hint">
            Managing entity: <span className="software-entity-pill">{entity || "All Entities"}</span>
          </div>
        </div>
        <div className="software-actions">
          <button
            className="asset-action-btn secondary"
            onClick={() => {
              setTargetEntity(entity === "ALL" ? "" : entity);
              setOpenAssign(true);
            }}
          >
            Assign License
          </button>
          <button
            className="asset-action-btn primary"
            onClick={() => {
              setTargetEntity(entity === "ALL" ? "" : entity);
              setEditingLicense(null);
              setOpenLicense(true);
            }}
          >
            Add License
          </button>
        </div>
      </div>

      {loading && <p style={{ color: "#6b7280" }}>Loading software inventory...</p>}

      <div className="software-grid">
        <div className="software-card">
          <div className="card-title">License Catalog</div>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Vendor</th>
                <th>Seats</th>
                <th>Used</th>
                <th>Renewal</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(inventory.licenses || []).map((row) => (
                <tr key={row.id}>
                  <td>{row.product}</td>
                  <td>{row.vendor}</td>
                  <td>{row.seatsOwned}</td>
                  <td>{row.seatsUsed}</td>
                  <td>{row.renewalDate || "—"}</td>
                  <td>
                    <button
                      className="asset-action-btn secondary"
                      onClick={() => {
                        const resolvedEntity =
                          entity === "ALL" ? row._entityCode : entity;
                        if (entity === "ALL" && !resolvedEntity) {
                          alert("Entity not available for this license.");
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
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {!inventory.licenses?.length && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#6b7280" }}>
                    No licenses added.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="software-card">
          <div className="card-title">User-wise Assignments</div>
          <div className="software-filter">
            <input
              placeholder="Search employee or license..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Email</th>
                <th>License</th>
                <th>Vendor</th>
                <th>Assigned</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.map((row) => (
                <tr key={row.id}>
                  <td>{row.employeeName || row.employeeId}</td>
                  <td>{row.employeeEmail || "—"}</td>
                  <td>{row.license?.product || "—"}</td>
                  <td>{row.license?.vendor || "—"}</td>
                  <td>{row.assignedAt ? new Date(row.assignedAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
              {!filteredAssignments.length && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#6b7280" }}>
                    No assignments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openLicense && (
        <>
          <div className="drawer-overlay" onClick={() => setOpenLicense(false)} />
          <div className="drawer-panel">
            <div className="drawer-header">
              <h3>{editingLicense ? "Edit Software License" : "Add Software License"}</h3>
              <button className="action-link" onClick={() => setOpenLicense(false)}>Close</button>
            </div>
            <div className="drawer-body">
              {entity === "ALL" && (
                <div className="form-group">
                  <label>Entity</label>
                  <select value={targetEntity} onChange={(e) => setTargetEntity(e.target.value)}>
                    <option value="">Select Entity</option>
                    {entities.map((ent) => (
                      <option key={ent.id} value={ent.code}>{ent.name} ({ent.code})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Product</label>
                <input value={licenseForm.product} onChange={(e) => setLicenseForm((prev) => ({ ...prev, product: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Vendor</label>
                <input value={licenseForm.vendor} onChange={(e) => setLicenseForm((prev) => ({ ...prev, vendor: e.target.value }))} />
              </div>
              <div className="form-grid two-col">
                <div className="form-group">
                  <label>Seats Owned</label>
                  <input type="number" value={licenseForm.seatsOwned} onChange={(e) => setLicenseForm((prev) => ({ ...prev, seatsOwned: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label>Seats Used</label>
                  <input type="number" value={licenseForm.seatsUsed} onChange={(e) => setLicenseForm((prev) => ({ ...prev, seatsUsed: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="form-grid two-col">
                <div className="form-group">
                  <label>Version</label>
                  <input value={licenseForm.version} onChange={(e) => setLicenseForm((prev) => ({ ...prev, version: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>License Key</label>
                  <input value={licenseForm.licenseKey} onChange={(e) => setLicenseForm((prev) => ({ ...prev, licenseKey: e.target.value }))} />
                </div>
              </div>
              <div className="form-grid two-col">
                <div className="form-group">
                  <label>Renewal Date</label>
                  <input type="date" value={licenseForm.renewalDate} onChange={(e) => setLicenseForm((prev) => ({ ...prev, renewalDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={licenseForm.status} onChange={(e) => setLicenseForm((prev) => ({ ...prev, status: e.target.value }))}>
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="drawer-footer">
              <button className="btn-secondary" onClick={() => setOpenLicense(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateLicense}>
                {editingLicense ? "Save Changes" : "Save License"}
              </button>
            </div>
          </div>
        </>
      )}

      {openAssign && (
        <>
          <div className="drawer-overlay" onClick={() => setOpenAssign(false)} />
          <div className="drawer-panel">
            <div className="drawer-header">
              <h3>Assign License</h3>
              <button className="action-link" onClick={() => setOpenAssign(false)}>Close</button>
            </div>
            <div className="drawer-body">
              {entity === "ALL" && (
                <div className="form-group">
                  <label>Entity</label>
                  <select value={targetEntity} onChange={(e) => setTargetEntity(e.target.value)}>
                    <option value="">Select Entity</option>
                    {entities.map((ent) => (
                      <option key={ent.id} value={ent.code}>{ent.name} ({ent.code})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>License</label>
                <select value={assignForm.softwareLicenseId} onChange={(e) => setAssignForm((prev) => ({ ...prev, softwareLicenseId: e.target.value }))}>
                  <option value="">Select License</option>
                  {(inventory.licenses || []).map((lic) => (
                    <option key={lic.id} value={lic.id}>{lic.product} ({lic.vendor})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Employee ID</label>
                <input value={assignForm.employeeId} onChange={(e) => setAssignForm((prev) => ({ ...prev, employeeId: e.target.value }))} />
              </div>
              <div className="form-grid two-col">
                <div className="form-group">
                  <label>Employee Name</label>
                  <input value={assignForm.employeeName} onChange={(e) => setAssignForm((prev) => ({ ...prev, employeeName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Employee Email</label>
                  <input value={assignForm.employeeEmail} onChange={(e) => setAssignForm((prev) => ({ ...prev, employeeEmail: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea value={assignForm.notes} onChange={(e) => setAssignForm((prev) => ({ ...prev, notes: e.target.value }))} />
              </div>
            </div>
            <div className="drawer-footer">
              <button className="btn-secondary" onClick={() => setOpenAssign(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateAssignment}>Assign</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
