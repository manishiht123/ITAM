import { useState, useEffect } from "react";
import "../Assets.css";
import api from "../../services/api";

export default function OrganizationEntities() {
    const [entities, setEntities] = useState([]);
    const [loading, setLoading] = useState(true);

    // Entity Modal State
    const [showEntityModal, setShowEntityModal] = useState(false);
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
                alert("Entity updated successfully!");
            } else {
                // Create
                await api.addEntity(entityForm);
                alert("Entity added successfully!");
            }
            setShowEntityModal(false);

            // Refresh list
            const updatedEntities = await api.getEntities();
            setEntities(updatedEntities);
        } catch (err) {
            alert(err.message);
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

    const handleDeleteEntity = async (id) => {
        if (!window.confirm("Are you sure you want to delete this entity?")) return;
        try {
            await api.deleteEntity(id);
            setEntities(prev => prev.filter(ent => ent.id !== id));
        } catch (err) {
            alert("Failed to delete entity");
        }
    };

    if (loading) return <div className="p-8">Loading settings...</div>;

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
                    <button className="asset-action-btn primary" onClick={openAddModal} style={{ boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)" }}>
                        + Add Entity
                    </button>
                </div>

                <div className="asset-table-wrapper" style={{ boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)", borderRadius: "12px", border: "1px solid #f3f4f6" }}>
                    {entities.length > 0 ? (
                        <table style={{ minWidth: "100%" }}>
                            <thead style={{ background: "var(--bg-muted)" }}>
                                <tr>
                                    <th style={{ textAlign: "left", padding: "16px 24px", color: "var(--text-secondary)", fontWeight: "600", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Entity Name</th>
                                    <th style={{ textAlign: "left", padding: "16px", color: "var(--text-secondary)", fontWeight: "600", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Logo</th>
                                    <th style={{ padding: "16px", color: "var(--text-secondary)", fontWeight: "600", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Code</th>
                                    <th style={{ padding: "16px", color: "var(--text-secondary)", fontWeight: "600", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tax ID</th>
                                    <th style={{ textAlign: "left", padding: "16px", color: "var(--text-secondary)", fontWeight: "600", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Address</th>
                                    <th style={{ padding: "16px", color: "var(--text-secondary)", fontWeight: "600", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {entities.map(entity => (
                                    <tr key={entity.id} style={{ transition: "background-color 0.2s" }} className="hover:bg-gray-50">
                                        <td style={{ textAlign: "left", padding: "16px 24px", fontWeight: "600", color: "var(--text-primary)" }}>
                                            {entity.name}
                                        </td>
                                        <td style={{ textAlign: "left", padding: "16px" }}>
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
                                        <td style={{ textAlign: "center", padding: "16px" }}>
                                            <span style={{ background: "#ede9fe", color: "#6d28d9", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
                                                {entity.code}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: "center", padding: "16px", fontFamily: "monospace", fontSize: "13px", color: "var(--text-secondary)" }}>{entity.taxId || "-"}</td>
                                        <td style={{ textAlign: "left", padding: "16px", fontSize: "13px", color: "var(--text-secondary)", maxWidth: "250px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {entity.address || "-"}
                                        </td>
                                        <td style={{ padding: "16px" }}>
                                            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                                                <button
                                                    onClick={() => openEditModal(entity)}
                                                    title="Edit Entity"
                                                    style={{
                                                        border: "none", background: "transparent", cursor: "pointer",
                                                        padding: "8px", borderRadius: "50%", transition: "all 0.2s"
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#ede9fe"; e.currentTarget.querySelector('svg').style.color = "#7c3aed"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.querySelector('svg').style.color = "#9ca3af"; }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "20px", color: "#9ca3af", transition: "color 0.2s" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fee2e2"; e.currentTarget.querySelector('svg').style.color = "#dc2626"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.querySelector('svg').style.color = "#9ca3af"; }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "20px", color: "#9ca3af", transition: "color 0.2s" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 9999, padding: "20px"
                }}>
                    <div className="bg-white rounded-2xl shadow-2xl animate-scale-up" style={{
                        width: "100%", maxWidth: "550px",
                        maxHeight: "90vh", overflowY: "auto",
                        background: "white", borderRadius: "20px",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                    }}>
                        <div style={{
                            background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                            padding: "24px 32px",
                            color: "white",
                            display: "flex", justifyContent: "space-between", alignItems: "start"
                        }}>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">{editingEntityId ? "Edit Entity" : "New Entity"}</h2>
                                <p style={{ opacity: 0.9, fontSize: "0.9rem", marginTop: "4px", fontWeight: "400" }}>
                                    {editingEntityId ? "Update details for this business unit." : "Register a new subsidiary or billing unit."}
                                </p>
                            </div>
                            <button onClick={() => setShowEntityModal(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.3)"} onMouseLeave={(e) => e.target.style.background = "rgba(255,255,255,0.2)"}>✕</button>
                        </div>

                        <form onSubmit={handleSaveEntity} style={{ padding: "32px" }}>
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Entity Name <span className="text-red-500">*</span></label>
                                <input
                                    name="name"
                                    value={entityForm.name}
                                    onChange={handleEntityChange}
                                    className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all text-gray-700 font-medium placeholder-gray-300"
                                    required
                                    placeholder="e.g. OXYZO Financial Services Ltd"
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Code <span className="text-red-500">*</span></label>
                                    <input
                                        name="code"
                                        value={entityForm.code}
                                        onChange={handleEntityChange}
                                        className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all text-gray-700 font-medium placeholder-gray-300"
                                        required
                                        placeholder="e.g. OXY"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tax ID / GSTIN</label>
                                    <input
                                        name="taxId"
                                        value={entityForm.taxId}
                                        onChange={handleEntityChange}
                                        className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all text-gray-700 font-medium placeholder-gray-300"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div className="mb-8">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Registered Address</label>
                                <textarea
                                    name="address"
                                    value={entityForm.address}
                                    onChange={handleEntityChange}
                                    rows="3"
                                    className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all text-gray-700 font-medium placeholder-gray-300 resize-none"
                                    placeholder="Full registered office address..."
                                ></textarea>
                            </div>

                            <div className="mb-8">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Entity Logo</label>
                                <div style={{ display: "grid", gap: "12px" }}>
                                    <input
                                        type="url"
                                        name="logo"
                                        value={entityForm.logo}
                                        onChange={handleEntityChange}
                                        className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all text-gray-700 font-medium placeholder-gray-300"
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
                                                style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", border: "1px solid #e5e7eb" }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setEntityForm((prev) => ({ ...prev, logo: "" }))}
                                                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-500"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-50">
                                <button
                                    type="button"
                                    onClick={() => setShowEntityModal(false)}
                                    className="px-6 py-3 rounded-xl text-gray-500 font-semibold hover:bg-gray-50 hover:text-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 transition-all hover:-translate-y-0.5"
                                >
                                    {editingEntityId ? "Save Changes" : "Create Entity"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
