import { useEffect, useState, useMemo } from "react";
import { useEntity } from "../../context/EntityContext";
import { PageLayout, Card, Spinner, ConfirmDialog } from "../../components/ui";
import {
  FaStore, FaSearch, FaPlus, FaEdit, FaTrashAlt,
  FaFilter, FaCheckCircle, FaTimesCircle, FaStar
} from "react-icons/fa";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import "./Vendors.css";
import { useEscClose } from "../../hooks/useEscClose";

const VENDOR_TYPES    = ["Hardware", "Software", "AMC", "Services", "Cloud", "Other"];
const PAYMENT_TERMS   = ["Net 15", "Net 30", "Net 60", "Net 90", "Advance", "On Delivery", "Other"];
const VENDOR_STATUSES = ["Active", "Inactive"];

const BLANK_FORM = {
  name: "", contactPerson: "", email: "", phone: "",
  street: "", city: "", state: "", country: "",
  vendorType: "", paymentTerms: "", gstNumber: "", panNumber: "",
  status: "Active", rating: "", notes: ""
};

const TYPE_COLORS = {
  Hardware: { bg: "rgba(37,99,235,0.1)",   color: "#2563eb" },
  Software: { bg: "rgba(124,58,237,0.1)",  color: "#7c3aed" },
  AMC:      { bg: "rgba(245,158,11,0.1)",  color: "#d97706" },
  Services: { bg: "rgba(22,163,74,0.1)",   color: "#16a34a" },
  Cloud:    { bg: "rgba(8,145,178,0.1)",   color: "#0891b2" },
  Other:    { bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
};

function StarRating({ value }) {
  return (
    <span className="vnd-stars">
      {[1, 2, 3, 4, 5].map(n => (
        <FaStar key={n} className={n <= value ? "vnd-star-on" : "vnd-star-off"} />
      ))}
    </span>
  );
}

export default function Vendors() {
  const { entity, setEntity } = useEntity();
  const toast = useToast();

  const [vendors, setVendors]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [filterType, setFilterType]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [entityList, setEntityList]     = useState([]);

  // Modal state
  const [modalOpen, setModalOpen]       = useState(false);
  const [editTarget, setEditTarget]     = useState(null);   // null = add, object = edit
  const [form, setForm]                 = useState(BLANK_FORM);
  const [saving, setSaving]             = useState(false);

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, vendor: null });
  const [deleting, setDeleting]           = useState(false);

  const isAllEntities = !entity || entity === "ALL";

  useEscClose(modalOpen, () => setModalOpen(false));

  useEffect(() => {
    api.getEntities().then(data => setEntityList(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  useEffect(() => { loadVendors(); }, [entity]);

  const loadVendors = async () => {
    if (!entity || entity === "ALL") {
      setVendors([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getVendors(entity);
      setVendors(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  const entityCode = entity;

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total    = vendors.length;
    const active   = vendors.filter(v => v.status === "Active").length;
    const inactive = vendors.filter(v => v.status === "Inactive").length;
    const byType   = vendors.reduce((acc, v) => {
      const t = v.vendorType || "Other";
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});
    const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    return { total, active, inactive, topType };
  }, [vendors]);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = vendors;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(v =>
        (v.name          || "").toLowerCase().includes(q) ||
        (v.contactPerson || "").toLowerCase().includes(q) ||
        (v.email         || "").toLowerCase().includes(q) ||
        (v.gstNumber     || "").toLowerCase().includes(q) ||
        (v.city          || "").toLowerCase().includes(q)
      );
    }
    if (filterType)   list = list.filter(v => v.vendorType === filterType);
    if (filterStatus) list = list.filter(v => v.status === filterStatus);
    return list;
  }, [vendors, search, filterType, filterStatus]);

  const hasFilters = search || filterType || filterStatus;
  const clearFilters = () => { setSearch(""); setFilterType(""); setFilterStatus(""); };

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null);
    setForm(BLANK_FORM);
    setModalOpen(true);
  };

  const openEdit = (vendor) => {
    setEditTarget(vendor);
    setForm({
      name:          vendor.name          || "",
      contactPerson: vendor.contactPerson || "",
      email:         vendor.email         || "",
      phone:         vendor.phone         || "",
      street:        vendor.street        || "",
      city:          vendor.city          || "",
      state:         vendor.state         || "",
      country:       vendor.country       || "",
      vendorType:    vendor.vendorType    || "",
      paymentTerms:  vendor.paymentTerms  || "",
      gstNumber:     vendor.gstNumber     || "",
      panNumber:     vendor.panNumber     || "",
      status:        vendor.status        || "Active",
      rating:        vendor.rating        || "",
      notes:         vendor.notes         || "",
    });
    setModalOpen(true);
  };

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.warning("Vendor name is required."); return; }
    setSaving(true);
    try {
      const payload = { ...form, rating: form.rating ? parseInt(form.rating) : null };
      if (editTarget) {
        await api.updateVendor(editTarget.id, payload, entityCode);
        toast.success(`Vendor "${form.name}" updated.`);
      } else {
        await api.createVendor(payload, entityCode);
        toast.success(`Vendor "${form.name}" added.`);
      }
      setModalOpen(false);
      loadVendors();
    } catch (err) {
      toast.error(err.message || "Failed to save vendor.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    const v = deleteConfirm.vendor;
    setDeleting(true);
    try {
      await api.deleteVendor(v.id, entityCode);
      toast.success(`Vendor "${v.name}" deleted.`);
      setDeleteConfirm({ open: false, vendor: null });
      loadVendors();
    } catch (err) {
      toast.error(err.message || "Failed to delete vendor.");
    } finally {
      setDeleting(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <PageLayout>
      <PageLayout.Header
        title="Vendor Management"
        subtitle="Manage suppliers, service providers and AMC vendors"
        actions={
          <button className="vnd-add-btn" onClick={openAdd} disabled={isAllEntities} title={isAllEntities ? "Select a specific entity to add vendors" : ""}>
            <FaPlus /> Add Vendor
          </button>
        }
      />

      <PageLayout.Content>

        {isAllEntities && (
          <div className="vnd-entity-notice">
            <FaStore />
            <span>Vendors are per-entity. Select an entity to view or manage its vendors:</span>
            <select
              className="vnd-entity-inline-select"
              defaultValue=""
              onChange={e => e.target.value && setEntity(e.target.value)}
            >
              <option value="">— Select Entity —</option>
              {entityList.map(e => (
                <option key={e.code} value={e.code}>{e.name || e.code}</option>
              ))}
            </select>
          </div>
        )}

        {/* ── KPI CARDS ─────────────────────────────────────────── */}
        <div className="vnd-kpi-row">
          <div className="vnd-kpi-card vnd-kpi-blue">
            <div className="vnd-kpi-icon vnd-kpi-icon-blue"><FaStore /></div>
            <div className="vnd-kpi-body">
              <div className="vnd-kpi-label">Total Vendors</div>
              <div className="vnd-kpi-value">{kpis.total}</div>
            </div>
          </div>
          <div className="vnd-kpi-card vnd-kpi-green">
            <div className="vnd-kpi-icon vnd-kpi-icon-green"><FaCheckCircle /></div>
            <div className="vnd-kpi-body">
              <div className="vnd-kpi-label">Active</div>
              <div className="vnd-kpi-value">{kpis.active}</div>
            </div>
          </div>
          <div className="vnd-kpi-card vnd-kpi-red">
            <div className="vnd-kpi-icon vnd-kpi-icon-red"><FaTimesCircle /></div>
            <div className="vnd-kpi-body">
              <div className="vnd-kpi-label">Inactive</div>
              <div className="vnd-kpi-value">{kpis.inactive}</div>
            </div>
          </div>
          <div className="vnd-kpi-card vnd-kpi-amber">
            <div className="vnd-kpi-icon vnd-kpi-icon-amber"><FaStar /></div>
            <div className="vnd-kpi-body">
              <div className="vnd-kpi-label">Top Type</div>
              <div className="vnd-kpi-value vnd-kpi-value-sm">{kpis.topType}</div>
            </div>
          </div>
        </div>

        {/* ── TOOLBAR ───────────────────────────────────────────── */}
        <div className="vnd-toolbar">
          <div className="vnd-search-wrap">
            <FaSearch className="vnd-search-icon" />
            <input
              className="vnd-search"
              placeholder="Search by name, contact, email, GST, city…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="vnd-filters-group">
            <FaFilter className="vnd-filter-icon" />
            <select className="vnd-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              {VENDOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="vnd-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              {VENDOR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {hasFilters && (
            <button className="vnd-clear-btn" onClick={clearFilters}>Clear Filters</button>
          )}
        </div>

        {/* ── TABLE ─────────────────────────────────────────────── */}
        <Card>
          <Card.Body style={{ padding: 0 }}>
            {loading ? (
              <div className="vnd-center"><Spinner size="md" /></div>
            ) : filtered.length === 0 ? (
              <div className="vnd-empty">
                <FaStore className="vnd-empty-icon" />
                <p className="vnd-empty-title">No vendors found</p>
                <p className="vnd-empty-sub">
                  {hasFilters ? "Try clearing your filters." : "Add your first vendor to get started."}
                </p>
                {!hasFilters && (
                  <button className="vnd-add-btn" onClick={openAdd}><FaPlus /> Add Vendor</button>
                )}
              </div>
            ) : (
              <div className="vnd-table-wrap">
                <table className="vnd-table">
                  <thead>
                    <tr>
                      <th>Vendor Name</th>
                      <th>Contact Person</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Type</th>
                      <th>GST No.</th>
                      <th>Payment Terms</th>
                      <th>Status</th>
                      <th>Rating</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(v => {
                      const tc = TYPE_COLORS[v.vendorType] || TYPE_COLORS["Other"];
                      return (
                        <tr key={v.id}>
                          <td>
                            <div className="vnd-name-cell">
                              <span className="vnd-name">{v.name}</span>
                              {v.city && <span className="vnd-city">{v.city}{v.state ? `, ${v.state}` : ""}</span>}
                            </div>
                          </td>
                          <td className="vnd-muted">{v.contactPerson || "—"}</td>
                          <td>
                            {v.email
                              ? <a href={`mailto:${v.email}`} className="vnd-link">{v.email}</a>
                              : "—"}
                          </td>
                          <td className="vnd-muted">{v.phone || "—"}</td>
                          <td>
                            {v.vendorType
                              ? <span className="vnd-pill" style={{ background: tc.bg, color: tc.color }}>{v.vendorType}</span>
                              : "—"}
                          </td>
                          <td className="vnd-mono">{v.gstNumber || "—"}</td>
                          <td className="vnd-muted">{v.paymentTerms || "—"}</td>
                          <td>
                            <span className={`vnd-status ${v.status === "Active" ? "vnd-status-active" : "vnd-status-inactive"}`}>
                              {v.status === "Active" ? <FaCheckCircle /> : <FaTimesCircle />}
                              {v.status}
                            </span>
                          </td>
                          <td>
                            {v.rating ? <StarRating value={v.rating} /> : <span className="vnd-muted">—</span>}
                          </td>
                          <td>
                            <div className="vnd-actions">
                              <button className="vnd-action-btn vnd-edit" title="Edit" onClick={() => openEdit(v)}>
                                <FaEdit />
                              </button>
                              <button className="vnd-action-btn vnd-delete" title="Delete" onClick={() => setDeleteConfirm({ open: true, vendor: v })}>
                                <FaTrashAlt />
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

        {!loading && filtered.length > 0 && (
          <div className="vnd-footer-count">
            Showing <strong>{filtered.length}</strong> of <strong>{vendors.length}</strong> vendors
          </div>
        )}

      </PageLayout.Content>

      {/* ── ADD / EDIT MODAL ──────────────────────────────────────── */}
      {modalOpen && (
        <div className="page-modal-overlay">
          <div className="page-modal page-modal-lg">
            <div className="page-modal-header">
              <div>
                <h2><FaStore style={{ marginRight: 8 }} />{editTarget ? "Edit Vendor" : "Add Vendor"}</h2>
                <p style={{ margin: 0, opacity: 0.8, fontSize: 13 }}>
                  {editTarget ? `Editing: ${editTarget.name}` : "Register a new vendor for this entity"}
                </p>
              </div>
              <button className="page-modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="page-modal-body">
              {/* Section: Basic Info */}
              <div className="vnd-form-section-title">Basic Information</div>
              <div className="vnd-form-grid">
                <div className="page-modal-field vnd-full">
                  <label className="page-modal-label">Vendor Name <span className="vnd-req">*</span></label>
                  <input className="page-modal-input" value={form.name} onChange={e => set("name", e.target.value)} required placeholder="e.g. Lenovo India Pvt. Ltd." />
                </div>
                <div className="page-modal-field">
                  <label className="page-modal-label">Contact Person</label>
                  <input className="page-modal-input" value={form.contactPerson} onChange={e => set("contactPerson", e.target.value)} placeholder="Account manager name" />
                </div>
                <div className="page-modal-field">
                  <label className="page-modal-label">Email</label>
                  <input type="email" className="page-modal-input" value={form.email} onChange={e => set("email", e.target.value)} placeholder="vendor@company.com" />
                </div>
                <div className="page-modal-field">
                  <label className="page-modal-label">Phone</label>
                  <input className="page-modal-input" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 98765 43210" />
                </div>
                <div className="page-modal-field">
                  <label className="page-modal-label">Vendor Type</label>
                  <select className="page-modal-input" value={form.vendorType} onChange={e => set("vendorType", e.target.value)}>
                    <option value="">— Select Type —</option>
                    {VENDOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Section: Address */}
              <div className="vnd-form-section-title">Address</div>
              <div className="vnd-form-grid">
                <div className="page-modal-field vnd-full">
                  <label className="page-modal-label">Street</label>
                  <input className="page-modal-input" value={form.street} onChange={e => set("street", e.target.value)} placeholder="Street address" />
                </div>
                <div className="page-modal-field">
                  <label className="page-modal-label">City</label>
                  <input className="page-modal-input" value={form.city} onChange={e => set("city", e.target.value)} placeholder="Mumbai" />
                </div>
                <div className="page-modal-field">
                  <label className="page-modal-label">State</label>
                  <input className="page-modal-input" value={form.state} onChange={e => set("state", e.target.value)} placeholder="Maharashtra" />
                </div>
                <div className="page-modal-field">
                  <label className="page-modal-label">Country</label>
                  <input className="page-modal-input" value={form.country} onChange={e => set("country", e.target.value)} placeholder="India" />
                </div>
              </div>

              {/* Section: Business Details */}
              <div className="vnd-form-section-title">Business Details</div>
              <div className="vnd-form-grid">
                <div className="page-modal-field">
                  <label className="page-modal-label">GST Number</label>
                  <input className="page-modal-input" value={form.gstNumber} onChange={e => set("gstNumber", e.target.value)} placeholder="22AAAAA0000A1Z5" />
                </div>
                <div className="page-modal-field">
                  <label className="page-modal-label">PAN Number</label>
                  <input className="page-modal-input" value={form.panNumber} onChange={e => set("panNumber", e.target.value)} placeholder="AAAAA0000A" />
                </div>
                <div className="page-modal-field">
                  <label className="page-modal-label">Payment Terms</label>
                  <select className="page-modal-input" value={form.paymentTerms} onChange={e => set("paymentTerms", e.target.value)}>
                    <option value="">— Select Terms —</option>
                    {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="page-modal-field">
                  <label className="page-modal-label">Status</label>
                  <select className="page-modal-input" value={form.status} onChange={e => set("status", e.target.value)}>
                    {VENDOR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="page-modal-field">
                  <label className="page-modal-label">Rating (1–5)</label>
                  <select className="page-modal-input" value={form.rating} onChange={e => set("rating", e.target.value)}>
                    <option value="">— Not rated —</option>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} ★</option>)}
                  </select>
                </div>
                <div className="page-modal-field vnd-full">
                  <label className="page-modal-label">Notes</label>
                  <textarea className="page-modal-input vnd-textarea" rows={3} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any additional notes about this vendor…" />
                </div>
              </div>

              <div className="page-modal-footer">
                <button type="button" className="vnd-cancel-btn" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="vnd-save-btn" disabled={saving}>
                  {saving ? "Saving…" : editTarget ? "Save Changes" : "Add Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ────────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Vendor"
        message={`Are you sure you want to delete vendor "${deleteConfirm.vendor?.name}"? This action cannot be undone.`}
        confirmText={deleting ? "Deleting…" : "Delete"}
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, vendor: null })}
      />

    </PageLayout>
  );
}
