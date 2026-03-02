import { useEffect, useState } from "react";
import { PageLayout, Card, Spinner, ConfirmDialog } from "../../components/ui";
import { FaPuzzlePiece, FaPlus, FaEdit, FaTrashAlt, FaTimes, FaGripVertical, FaToggleOn, FaToggleOff } from "react-icons/fa";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useEscClose } from "../../hooks/useEscClose";
import "./CustomFields.css";

const BLANK_FORM = {
  fieldName: "",
  fieldType: "text",
  options: "",
  required: false,
  sortOrder: 0,
  active: true,
};

const FIELD_TYPES = [
  { value: "text",   label: "Text",   desc: "Single-line text input" },
  { value: "number", label: "Number", desc: "Numeric input" },
  { value: "date",   label: "Date",   desc: "Date picker" },
  { value: "select", label: "Select", desc: "Dropdown list (define options below)" },
];

const TYPE_COLORS = {
  text:   { bg: "rgba(37,99,235,0.10)",   color: "#2563eb" },
  number: { bg: "rgba(22,163,74,0.10)",   color: "#16a34a" },
  date:   { bg: "rgba(245,158,11,0.10)",  color: "#d97706" },
  select: { bg: "rgba(124,58,237,0.10)",  color: "#7c3aed" },
};

export default function CustomFields() {
  const toast = useToast();

  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEscClose(drawerOpen, () => setDrawerOpen(false));

  const loadFields = async () => {
    setLoading(true);
    try {
      const data = await api.getCustomFields();
      setFields(data);
    } catch (err) {
      toast.error("Failed to load custom fields: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFields(); }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...BLANK_FORM, sortOrder: fields.length });
    setDrawerOpen(true);
  };

  const openEdit = (field) => {
    setEditTarget(field);
    setForm({
      fieldName: field.fieldName,
      fieldType: field.fieldType,
      options: Array.isArray(field.options) ? field.options.join("\n") : "",
      required: field.required,
      sortOrder: field.sortOrder,
      active: field.active,
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditTarget(null);
    setForm(BLANK_FORM);
  };

  const handleSave = async () => {
    if (!form.fieldName.trim()) {
      toast.error("Field name is required.");
      return;
    }
    if (form.fieldType === "select" && !form.options.trim()) {
      toast.error("Provide at least one option for a select field.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        fieldName: form.fieldName.trim(),
        fieldType: form.fieldType,
        options: form.fieldType === "select"
          ? form.options.split("\n").map(o => o.trim()).filter(Boolean)
          : null,
        required: form.required,
        sortOrder: Number(form.sortOrder) || 0,
        active: form.active,
      };
      if (editTarget) {
        await api.updateCustomField(editTarget.id, payload);
        toast.success("Custom field updated.");
      } else {
        await api.createCustomField(payload);
        toast.success("Custom field created.");
      }
      closeDrawer();
      loadFields();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (field) => {
    try {
      await api.updateCustomField(field.id, { active: !field.active });
      setFields(prev => prev.map(f => f.id === field.id ? { ...f, active: !f.active } : f));
    } catch (err) {
      toast.error("Failed to toggle field: " + err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteCustomField(deleteTarget.id);
      toast.success(`"${deleteTarget.fieldName}" deleted.`);
      setDeleteTarget(null);
      loadFields();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <PageLayout
      title="Custom Fields"
      icon={<FaPuzzlePiece />}
      subtitle="Define org-specific fields that appear on every asset form."
      actions={
        <button className="cf-add-btn" onClick={openAdd}>
          <FaPlus /> Add Custom Field
        </button>
      }
    >
      {/* Intro notice */}
      <div className="cf-notice">
        <FaPuzzlePiece />
        <span>
          Custom fields let you capture data unique to your organization — e.g. Contract
          Number, PO Number, CIA Level, AMC Expiry — without any code changes. Fields
          appear in the Asset Add/Edit form and are stored with each asset.
        </span>
      </div>

      <Card>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}><Spinner /></div>
        ) : fields.length === 0 ? (
          <div className="cf-empty">
            <FaPuzzlePiece className="cf-empty-icon" />
            <p>No custom fields defined yet.</p>
            <button className="cf-add-btn" onClick={openAdd}>
              <FaPlus /> Add Your First Custom Field
            </button>
          </div>
        ) : (
          <div className="cf-table-wrap">
            <table className="cf-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}></th>
                  <th>Field Name</th>
                  <th>Type</th>
                  <th>Options</th>
                  <th>Required</th>
                  <th>Order</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field) => {
                  const tc = TYPE_COLORS[field.fieldType] || TYPE_COLORS.text;
                  return (
                    <tr key={field.id} className={field.active ? "" : "cf-row-inactive"}>
                      <td className="cf-drag-handle"><FaGripVertical /></td>
                      <td className="cf-field-name">{field.fieldName}</td>
                      <td>
                        <span className="cf-type-badge" style={{ background: tc.bg, color: tc.color }}>
                          {field.fieldType}
                        </span>
                      </td>
                      <td className="cf-options-cell">
                        {field.fieldType === "select" && Array.isArray(field.options) && field.options.length > 0
                          ? field.options.slice(0, 3).join(", ") + (field.options.length > 3 ? ` +${field.options.length - 3}` : "")
                          : <span className="cf-muted">—</span>
                        }
                      </td>
                      <td>
                        {field.required
                          ? <span className="cf-badge-req">Required</span>
                          : <span className="cf-muted">Optional</span>
                        }
                      </td>
                      <td className="cf-muted">{field.sortOrder}</td>
                      <td>
                        <button
                          className={`cf-toggle-btn ${field.active ? "cf-toggle-on" : "cf-toggle-off"}`}
                          title={field.active ? "Deactivate" : "Activate"}
                          onClick={() => handleToggleActive(field)}
                        >
                          {field.active ? <FaToggleOn /> : <FaToggleOff />}
                          {field.active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td>
                        <div className="cf-actions">
                          <button className="cf-action-btn cf-edit" title="Edit" onClick={() => openEdit(field)}>
                            <FaEdit />
                          </button>
                          <button className="cf-action-btn cf-delete" title="Delete" onClick={() => setDeleteTarget(field)}>
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
      </Card>

      {/* Add/Edit Drawer */}
      {drawerOpen && (
        <div className="cf-drawer-overlay" onClick={closeDrawer}>
          <div className="cf-drawer" onClick={e => e.stopPropagation()}>
            <div className="cf-drawer-header">
              <span>{editTarget ? "Edit Custom Field" : "Add Custom Field"}</span>
              <button className="cf-drawer-close" onClick={closeDrawer}><FaTimes /></button>
            </div>
            <div className="cf-drawer-body">

              <div className="cf-form-group">
                <label>Field Name <span className="cf-req-star">*</span></label>
                <input
                  type="text"
                  value={form.fieldName}
                  onChange={e => setField("fieldName", e.target.value)}
                  placeholder="e.g. Contract Number, PO Number, CIA Level"
                />
                {form.fieldName.trim() && (
                  <small className="cf-hint">
                    Stored as key: <code>{toSlug(form.fieldName)}</code>
                  </small>
                )}
              </div>

              <div className="cf-form-group">
                <label>Field Type <span className="cf-req-star">*</span></label>
                <div className="cf-type-grid">
                  {FIELD_TYPES.map(t => (
                    <div
                      key={t.value}
                      className={`cf-type-card ${form.fieldType === t.value ? "cf-type-selected" : ""}`}
                      onClick={() => setField("fieldType", t.value)}
                    >
                      <span className="cf-type-label">{t.label}</span>
                      <span className="cf-type-desc">{t.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {form.fieldType === "select" && (
                <div className="cf-form-group">
                  <label>Options <span className="cf-req-star">*</span></label>
                  <textarea
                    value={form.options}
                    onChange={e => setField("options", e.target.value)}
                    rows={5}
                    placeholder={"One option per line:\nLow\nMedium\nHigh"}
                  />
                  <small className="cf-hint">Enter one option per line.</small>
                </div>
              )}

              <div className="cf-form-row">
                <div className="cf-form-group cf-form-group-half">
                  <label>Sort Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={e => setField("sortOrder", e.target.value)}
                    min={0}
                  />
                </div>
                <div className="cf-form-group cf-form-group-half cf-toggle-group">
                  <label>Required</label>
                  <label className="cf-switch">
                    <input type="checkbox" checked={form.required} onChange={e => setField("required", e.target.checked)} />
                    <span className="cf-slider" />
                  </label>
                </div>
              </div>

              {editTarget && (
                <div className="cf-form-group cf-toggle-group">
                  <label>Active</label>
                  <label className="cf-switch">
                    <input type="checkbox" checked={form.active} onChange={e => setField("active", e.target.checked)} />
                    <span className="cf-slider" />
                  </label>
                </div>
              )}
            </div>

            <div className="cf-drawer-footer">
              <button className="cf-cancel-btn" onClick={closeDrawer} disabled={saving}>Cancel</button>
              <button className="cf-save-btn" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : (editTarget ? "Update Field" : "Create Field")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Custom Field"
        message={
          <>
            Delete <strong>"{deleteTarget?.fieldName}"</strong>? Existing asset data for this
            field will be preserved but no longer displayed.
          </>
        }
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </PageLayout>
  );
}

// Helper used in the component (no import needed, defined locally)
function toSlug(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
    || "field";
}
