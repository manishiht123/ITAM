import { useState, useEffect } from "react";
import "../Assets.css";
import api from "../../services/api";
import { Button, LoadingOverlay, ConfirmDialog } from "../../components/ui";
import { useToast } from "../../context/ToastContext";

export default function OrganizationEntities() {
    const toast = useToast();
    const [entities, setEntities] = useState([]);
    const [loading, setLoading] = useState(true);

    // Entity Modal State
    const [showEntityModal, setShowEntityModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
    const [editingEntityId, setEditingEntityId] = useState(null); // If set, we are editing
    const [entityForm, setEntityForm] = useState({
        name: "",
        code: "",
        taxId: "",
        address: "",
        logo: ""
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const entitiesData = await api.getEntities();
            setEntities(entitiesData);
        } catch (err) {
            console.error("Failed to load settings", err);
        } finally {
            setLoading(false);
        }
    };

    // --- ENTITY ACTIONS ---
    const handleEntityChange = (e) => {
        const { name, value } = e.target;
        setEntityForm(prev => ({ ...prev, [name]: value }));
    };

    const openAddModal = () => {
        setEditingEntityId(null);
        setEntityForm({ name: "", code: "", taxId: "", address: "", logo: "" });
        setShowEntityModal(true);
    };

    const openEditModal = (entity) => {
        setEditingEntityId(entity.id);
        setEntityForm({
            name: entity.name,
            code: entity.code,
            taxId: entity.taxId || "",
            address: entity.address || "",
            logo: entity.logo || ""
        });
        setShowEntityModal(true);
    };

    const handleSaveEntity = async (e) => {
        e.preventDefault();
        try {
            if (editingEntityId) {
                // Update
                await api.updateEntity(editingEntityId, entityForm);
                toast.success("Entity updated successfully!");
            } else {
                // Create
                await api.addEntity(entityForm);
                toast.success("Entity added successfully!");
            }
            setShowEntityModal(false);

            // Refresh list
            const updatedEntities = await api.getEntities();
            setEntities(updatedEntities);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleLogoFile = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            setEntityForm((prev) => ({ ...prev, logo: evt.target.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteEntity = (id) => {
        setDeleteConfirm({ open: true, id });
    };

    const confirmDelete = async () => {
        const id = deleteConfirm.id;
        setDeleteConfirm({ open: false, id: null });
        try {
            await api.deleteEntity(id);
            setEntities(prev => prev.filter(ent => ent.id !== id));
            toast.success("Entity deleted successfully");
        } catch (err) {
            toast.error("Failed to delete entity");
        }
    };

    if (loading) return <LoadingOverlay visible message="Loading settings..." />;

    return (
        <div className="assets-page">
            <div className="assets-header">
                <div>
                    <h1>Business Entities</h1>
                    <p className="assets-subtitle">Manage distinct legal entities, subsidiaries, and billing units</p>
                </div>
            </div>

            {/* ENTITIES CONTENT */}
            <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
                    <Button variant="primary" onClick={openAddModal}>
                        + Add Entity
                    </Button>
                </div>

                <div className="asset-table-wrapper" style={{ boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                    {entities.length > 0 ? (
                        <table className="assets-table">
                            <thead>
                                <tr>
                                    <th>Entity Name</th>
                                    <th>Logo</th>
                                    <th>Code</th>
                                    <th>Tax ID</th>
                                    <th>Address</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entities.map(entity => (
                                    <tr key={entity.id}>
                                        <td>
                                            {entity.name}
                                        </td>
                                        <td>
                                            {entity.logo ? (
                                                <img
                                                    src={entity.logo}
                                                    alt={`${entity.name} logo`}
                                                    style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }}
                                                />
                                            ) : (
                                                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{ background: "var(--primary-soft)", color: "var(--primary-700)", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
                                                {entity.code}
                                            </span>
                                        </td>
                                        <td>{entity.taxId || "-"}</td>
                                        <td>
                                            {entity.address || "-"}
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                                                <button
                                                    onClick={() => openEditModal(entity)}
                                                    title="Edit Entity"
                                                    style={{
                                                        border: "none", background: "transparent", cursor: "pointer",
                                                        padding: "8px", borderRadius: "50%", transition: "all 0.2s"
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--primary-soft)"; e.currentTarget.querySelector('svg').style.color = "var(--primary)"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.querySelector('svg').style.color = "var(--text-muted)"; }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "20px", color: "var(--text-muted)", transition: "color 0.2s" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEntity(entity.id)}
                                                    title="Delete Entity"
                                                    style={{
                                                        border: "none", background: "transparent", cursor: "pointer",
                                                        padding: "8px", borderRadius: "50%", transition: "all 0.2s"
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--feedback-danger-bg)"; e.currentTarget.querySelector('svg').style.color = "var(--danger)"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.querySelector('svg').style.color = "var(--text-muted)"; }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "20px", color: "var(--text-muted)", transition: "color 0.2s" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        <div style={{ padding: "60px", textAlign: "center", color: "var(--text-secondary)" }}>
                            <div style={{ fontSize: "2.5rem", marginBottom: "16px", opacity: 0.3 }}>🏢</div>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text-primary)" }}>No Entities Found</h3>
                            <p style={{ marginTop: "8px" }}>Click <strong>+ Add Entity</strong> to get started.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ADD ENTITY MODAL */}
            {showEntityModal && (
                <div className="page-modal-overlay">
                    <div className="page-modal page-modal-lg">
                        <div className="page-modal-header">
                            <div>
                                <h2>{editingEntityId ? "Edit Entity" : "New Entity"}</h2>
                                <p>
                                    {editingEntityId ? "Update details for this business unit." : "Register a new subsidiary or billing unit."}
                                </p>
                            </div>
                            <button className="page-modal-close" onClick={() => setShowEntityModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSaveEntity} className="page-modal-body">
                            <div style={{ marginBottom: "24px" }}>
                                <label className="page-modal-label">Entity Name <span className="required">*</span></label>
                                <input
                                    name="name"
                                    value={entityForm.name}
                                    onChange={handleEntityChange}
                                    className="page-modal-input"
                                    required
                                    placeholder="e.g. OXYZO Financial Services Ltd"
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                                <div>
                                    <label className="page-modal-label">Code <span className="required">*</span></label>
                                    <input
                                        name="code"
                                        value={entityForm.code}
                                        onChange={handleEntityChange}
                                        className="page-modal-input"
                                        required
                                        placeholder="e.g. OXY"
                                    />
                                </div>
                                <div>
                                    <label className="page-modal-label">Tax ID / GSTIN</label>
                                    <input
                                        name="taxId"
                                        value={entityForm.taxId}
                                        onChange={handleEntityChange}
                                        className="page-modal-input"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: "32px" }}>
                                <label className="page-modal-label">Registered Address</label>
                                <textarea
                                    name="address"
                                    value={entityForm.address}
                                    onChange={handleEntityChange}
                                    rows="3"
                                    className="page-modal-input"
                                    style={{ resize: "none" }}
                                    placeholder="Full registered office address..."
                                ></textarea>
                            </div>

                            <div style={{ marginBottom: "32px" }}>
                                <label className="page-modal-label">Entity Logo</label>
                                <div style={{ display: "grid", gap: "12px" }}>
                                    <input
                                        type="text"
                                        name="logo"
                                        value={entityForm.logo}
                                        onChange={handleEntityChange}
                                        className="page-modal-input"
                                        placeholder="Paste logo URL (optional)"
                                    />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleLogoFile(e.target.files[0])}
                                    />
                                    {entityForm.logo && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <img
                                                src={entityForm.logo}
                                                alt="Entity logo preview"
                                                style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", border: "1px solid var(--border)" }}
                                            />
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setEntityForm((prev) => ({ ...prev, logo: "" }))}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="page-modal-footer">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setShowEntityModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                >
                                    {editingEntityId ? "Save Changes" : "Create Entity"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRM */}
            <ConfirmDialog
                open={deleteConfirm.open}
                title="Delete Entity"
                message="Are you sure you want to delete this entity? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm({ open: false, id: null })}
            />
        </div>
    );
}
