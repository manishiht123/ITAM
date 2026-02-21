import { useState, useEffect } from "react";
import "../Assets.css";
import api from "../../services/api";
import { Button, LoadingOverlay, ConfirmDialog } from "../../components/ui";
import { useToast } from "../../context/ToastContext";

export default function AssetConfiguration() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [prefixes, setPrefixes] = useState([]);
    const [entities, setEntities] = useState([]);
    const [categories, setCategories] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ entityCode: "", categoryName: "", shortCode: "" });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [prefixData, entityData, catData] = await Promise.all([
                api.getAssetIdPrefixes(),
                api.getEntities(),
                api.getAssetCategoriesCommon().catch(() => [])
            ]);
            setPrefixes(prefixData);
            setEntities(entityData);
            setCategories(catData);
        } catch (err) {
            toast.error("Failed to load configuration");
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingId(null);
        setForm({ entityCode: entities[0]?.code || "", categoryName: "", shortCode: "" });
        setShowModal(true);
    };

    const openEditModal = (prefix) => {
        setEditingId(prefix.id);
        setForm({
            entityCode: prefix.entityCode,
            categoryName: prefix.categoryName,
            shortCode: prefix.shortCode
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.entityCode || !form.categoryName || !form.shortCode) {
            toast.error("All fields are required");
            return;
        }
        try {
            await api.upsertAssetIdPrefix(form);
            toast.success(editingId ? "Prefix updated!" : "Prefix added!");
            setShowModal(false);
            await loadData();
        } catch (err) {
            toast.error(err.message || "Failed to save prefix");
        }
    };

    const handleDelete = (id) => {
        setDeleteConfirm({ open: true, id });
    };

    const confirmDelete = async () => {
        const id = deleteConfirm.id;
        setDeleteConfirm({ open: false, id: null });
        try {
            await api.deleteAssetIdPrefix(id);
            setPrefixes(prev => prev.filter(p => p.id !== id));
            toast.success("Prefix deleted");
        } catch (err) {
            toast.error("Failed to delete prefix");
        }
    };

    // Derive category options: API categories + any hardcoded fallbacks
    const categoryOptions = categories.length > 0
        ? categories.map(c => c.name || c)
        : ["Laptop", "Desktop", "Printer", "Peripheral", "Server", "Networking", "Mobile"];

    if (loading) return <LoadingOverlay visible message="Loading configuration..." />;

    return (
        <div className="assets-page">
            <div className="assets-header">
                <div>
                    <h1>Asset Configuration</h1>
                    <p className="assets-subtitle">Configure Asset ID prefixes per entity and category</p>
                </div>
            </div>

            {/* ASSET ID PREFIX SECTION */}
            <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
                {/* Info Banner */}
                <div style={{
                    background: "var(--primary-soft)",
                    border: "1px solid var(--primary-200, #c7d7f5)",
                    borderRadius: 10,
                    padding: "14px 20px",
                    marginBottom: 20,
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start"
                }}>
                    <span style={{ fontSize: 20 }}>💡</span>
                    <div>
                        <strong style={{ color: "var(--primary-700)" }}>Asset ID Prefixes</strong>
                        <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: 13 }}>
                            Define short codes per entity &amp; category. Asset IDs will be auto-generated as&nbsp;
                            <code style={{ background: "var(--surface)", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>
                                ENTITY/CODE/001
                            </code>
                            &nbsp;(e.g., <strong>OFB/ITL/001</strong> for a Laptop in OFB).
                            When an asset is transferred, a new ID is automatically assigned using the target entity's prefix.
                        </p>
                    </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
                    <Button variant="primary" onClick={openAddModal}>+ Add Prefix</Button>
                </div>

                <div className="asset-table-wrapper" style={{ boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    {prefixes.length > 0 ? (
                        <table className="assets-table">
                            <thead>
                                <tr>
                                    <th>Entity</th>
                                    <th>Category</th>
                                    <th>Short Code</th>
                                    <th>Preview</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prefixes.map(prefix => (
                                    <tr key={prefix.id}>
                                        <td>
                                            <span style={{
                                                background: "var(--primary-soft)", color: "var(--primary-700)",
                                                padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700
                                            }}>
                                                {prefix.entityCode}
                                            </span>
                                        </td>
                                        <td>{prefix.categoryName}</td>
                                        <td>
                                            <code style={{ background: "var(--surface)", padding: "3px 8px", borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
                                                {prefix.shortCode}
                                            </code>
                                        </td>
                                        <td>
                                            <span style={{ color: "var(--text-secondary)", fontSize: 13, fontFamily: "monospace" }}>
                                                {prefix.entityCode}/{prefix.shortCode}/001, /002, ...
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                                                <button
                                                    onClick={() => openEditModal(prefix)}
                                                    title="Edit Prefix"
                                                    style={{ border: "none", background: "transparent", cursor: "pointer", padding: 8, borderRadius: "50%", transition: "all 0.2s" }}
                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--primary-soft)"; e.currentTarget.querySelector("svg").style.color = "var(--primary)"; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.querySelector("svg").style.color = "var(--text-muted)"; }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 20, height: 20, color: "var(--text-muted)", transition: "color 0.2s" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(prefix.id)}
                                                    title="Delete Prefix"
                                                    style={{ border: "none", background: "transparent", cursor: "pointer", padding: 8, borderRadius: "50%", transition: "all 0.2s" }}
                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--feedback-danger-bg)"; e.currentTarget.querySelector("svg").style.color = "var(--danger)"; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.querySelector("svg").style.color = "var(--text-muted)"; }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 20, height: 20, color: "var(--text-muted)", transition: "color 0.2s" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ padding: 60, textAlign: "center", color: "var(--text-secondary)" }}>
                            <div style={{ fontSize: "2.5rem", marginBottom: 16, opacity: 0.3 }}>🏷️</div>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)" }}>No Prefixes Configured</h3>
                            <p style={{ marginTop: 8 }}>
                                Click <strong>+ Add Prefix</strong> to configure an Asset ID format for an entity and category.
                                Without a prefix, assets will receive a random ID on creation.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ADD / EDIT MODAL */}
            {showModal && (
                <div className="page-modal-overlay">
                    <div className="page-modal page-modal-md">
                        <div className="page-modal-header">
                            <div>
                                <h2>{editingId ? "Edit Prefix" : "New Asset ID Prefix"}</h2>
                                <p>{editingId ? "Update the short code for this combination." : "Map an entity + category to a short code for auto-generated IDs."}</p>
                            </div>
                            <button className="page-modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSave} className="page-modal-body">
                            <div style={{ marginBottom: 24 }}>
                                <label className="page-modal-label">Entity <span className="required">*</span></label>
                                <select
                                    className="page-modal-input"
                                    value={form.entityCode}
                                    onChange={e => setForm(prev => ({ ...prev, entityCode: e.target.value }))}
                                    required
                                    disabled={!!editingId}
                                >
                                    <option value="">-- Select Entity --</option>
                                    {entities.map(ent => (
                                        <option key={ent.id} value={ent.code}>{ent.name} ({ent.code})</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label className="page-modal-label">Asset Category <span className="required">*</span></label>
                                <select
                                    className="page-modal-input"
                                    value={form.categoryName}
                                    onChange={e => setForm(prev => ({ ...prev, categoryName: e.target.value }))}
                                    required
                                    disabled={!!editingId}
                                >
                                    <option value="">-- Select Category --</option>
                                    {categoryOptions.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: 32 }}>
                                <label className="page-modal-label">Short Code <span className="required">*</span></label>
                                <input
                                    className="page-modal-input"
                                    value={form.shortCode}
                                    onChange={e => setForm(prev => ({ ...prev, shortCode: e.target.value.toUpperCase() }))}
                                    placeholder="e.g. ITL for Laptop, ITP for Printer"
                                    maxLength={10}
                                    required
                                />
                                {form.entityCode && form.categoryName && form.shortCode && (
                                    <p style={{ marginTop: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                                        Preview: <strong style={{ fontFamily: "monospace", color: "var(--primary)" }}>
                                            {form.entityCode}/{form.shortCode}/001
                                        </strong>
                                    </p>
                                )}
                            </div>

                            <div className="page-modal-footer">
                                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit" variant="primary">
                                    {editingId ? "Save Changes" : "Add Prefix"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={deleteConfirm.open}
                title="Delete Prefix"
                message="Are you sure you want to delete this prefix? Future assets in this entity+category will receive random IDs."
                confirmText="Delete"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm({ open: false, id: null })}
            />
        </div>
    );
}
