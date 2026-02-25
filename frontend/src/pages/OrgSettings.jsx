import { useState, useEffect, useMemo, useRef } from "react";
import "./Assets.css";
import "./OrgSettings.css";
import api from "../services/api";
import { useEntity } from "../context/EntityContext";
import { Button, ConfirmDialog, LoadingOverlay } from "../components/ui";
import { FaPen, FaTrash, FaBuilding, FaLocationArrow, FaTags } from "react-icons/fa";
import { useToast } from "../context/ToastContext";
import INDIAN_CITIES from "../data/indianCities";

// ── Shared city autocomplete dropdown ────────────────────────────────────────
function CityDropdown({ value, onChange, placeholder = "Search & select city..." }) {
    const [search, setSearch] = useState(value || "");
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => { setSearch(value || ""); }, [value]);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filtered = INDIAN_CITIES.filter(c => c.toLowerCase().includes(search.toLowerCase())).slice(0, 50);

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setOpen(true); if (!e.target.value) onChange(""); }}
                onFocus={() => setOpen(true)}
                className="page-modal-input"
                placeholder={placeholder}
                autoComplete="off"
            />
            {open && filtered.length > 0 && (
                <ul className="city-dropdown-list">
                    {filtered.map(city => (
                        <li key={city}
                            className={`city-dropdown-item${city === value ? " selected" : ""}`}
                            onClick={() => { onChange(city); setSearch(city); setOpen(false); }}
                        >{city}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
    { key: "departments", label: "Departments",     icon: <FaBuilding /> },
    { key: "locations",   label: "Locations",       icon: <FaLocationArrow /> },
    { key: "categories",  label: "Asset Categories", icon: <FaTags /> },
];

export default function OrgSettings() {
    const { entity } = useEntity();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState("departments");

    // ── Departments state ─────────────────────────────────────────────────────
    const [departments, setDepartments]       = useState([]);
    const [employees,   setEmployees]         = useState([]);
    const [deptLoading, setDeptLoading]       = useState(true);
    const [deptModal,   setDeptModal]         = useState(false);
    const [editingDept, setEditingDept]       = useState(null);
    const [deptForm,    setDeptForm]          = useState({ name: "", location: "" });
    const [deptDelConfirm, setDeptDelConfirm] = useState({ open: false, item: null });

    // ── Locations state ───────────────────────────────────────────────────────
    const [locations,   setLocations]         = useState([]);
    const [locLoading,  setLocLoading]        = useState(true);
    const [locModal,    setLocModal]          = useState(false);
    const [editingLoc,  setEditingLoc]        = useState(null);
    const [locForm,     setLocForm]           = useState({ city: "", country: "India", address: "" });
    const [locDelConfirm, setLocDelConfirm]   = useState({ open: false, item: null });

    // ── Categories state ──────────────────────────────────────────────────────
    const [categories,  setCategories]        = useState([]);
    const [assets,      setAssets]            = useState([]);
    const [catLoading,  setCatLoading]        = useState(true);
    const [catModal,    setCatModal]          = useState(false);
    const [editingCat,  setEditingCat]        = useState(null);
    const [catForm,     setCatForm]           = useState({ name: "", description: "" });
    const [catSearch,   setCatSearch]         = useState("");
    const [catDelConfirm, setCatDelConfirm]   = useState({ open: false, item: null });

    // ── Load all data on mount / entity change ────────────────────────────────
    useEffect(() => {
        loadDepartments();
        loadLocations();
        loadCategories();
    }, [entity]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Departments API ───────────────────────────────────────────────────────
    const loadDepartments = async () => {
        setDeptLoading(true);
        try {
            const deptData = await api.getDepartmentsCommon();
            setDepartments(deptData);

            if (entity === "ALL") {
                const entities = await api.getEntities();
                const codes = (entities || []).map(e => e.code).filter(Boolean);
                const results = await Promise.allSettled(codes.map(c => api.getEmployees(c)));
                setEmployees(results.flatMap(r => r.status === "fulfilled" ? r.value : []));
            } else {
                setEmployees(await api.getEmployees(entity) || []);
            }
        } catch { toast.error("Failed to load departments"); }
        finally   { setDeptLoading(false); }
    };

    const saveDept = async (e) => {
        e.preventDefault();
        if (!deptForm.name) { toast.warning("Department name is required"); return; }
        try {
            if (editingDept) {
                const updated = await api.updateDepartmentCommon(editingDept.id, deptForm);
                setDepartments(prev => prev.map(d => d.id === editingDept.id ? updated : d));
                toast.success("Department updated");
            } else {
                const added = await api.addDepartmentCommon(deptForm);
                setDepartments(prev => [...prev, added]);
                toast.success("Department added");
            }
            closeDeptModal();
        } catch (err) { toast.error(err.message || "Failed to save department"); }
    };

    const deleteDept = async () => {
        const { item } = deptDelConfirm;
        setDeptDelConfirm({ open: false, item: null });
        try {
            await api.deleteDepartmentCommon(item.id);
            setDepartments(prev => prev.filter(d => d.id !== item.id));
            toast.success(`"${item.name}" deleted`);
        } catch (err) { toast.error(err?.message || "Failed to delete department"); }
    };

    const closeDeptModal = () => { setDeptModal(false); setEditingDept(null); setDeptForm({ name: "", location: "" }); };

    const employeeCounts = useMemo(() => {
        const counts = {};
        (employees || []).forEach(emp => {
            const d = emp.department || emp.dept || emp.departmentName || "";
            if (d) counts[d] = (counts[d] || 0) + 1;
        });
        return counts;
    }, [employees]);

    // ── Locations API ─────────────────────────────────────────────────────────
    const loadLocations = async () => {
        setLocLoading(true);
        try   { setLocations(await api.getLocationsCommon()); }
        catch { toast.error("Failed to load locations"); }
        finally { setLocLoading(false); }
    };

    const saveLoc = async (e) => {
        e.preventDefault();
        if (!locForm.city) { toast.warning("City is required"); return; }
        try {
            const payload = { ...locForm, name: locForm.city };
            if (editingLoc) {
                const updated = await api.updateLocationCommon(editingLoc.id, payload);
                setLocations(prev => prev.map(l => l.id === editingLoc.id ? updated : l));
                toast.success("Location updated");
            } else {
                const added = await api.addLocationCommon(payload);
                setLocations(prev => [...prev, added]);
                toast.success("Location added");
            }
            closeLocModal();
        } catch (err) { toast.error(err.message || "Failed to save location"); }
    };

    const deleteLoc = async () => {
        const { item } = locDelConfirm;
        setLocDelConfirm({ open: false, item: null });
        try {
            await api.deleteLocationCommon(item.id);
            setLocations(prev => prev.filter(l => l.id !== item.id));
            toast.success(`"${item.city}" deleted`);
        } catch (err) { toast.error(err?.message || "Failed to delete location"); }
    };

    const closeLocModal = () => { setLocModal(false); setEditingLoc(null); setLocForm({ city: "", country: "India", address: "" }); };

    // ── Categories API ────────────────────────────────────────────────────────
    const loadCategories = async () => {
        setCatLoading(true);
        try {
            const [assetData, catData] = await Promise.all([api.getAssets(entity), api.getAssetCategoriesCommon()]);
            setAssets(assetData);
            setCategories(catData);
        } catch { toast.error("Failed to load categories"); }
        finally   { setCatLoading(false); }
    };

    const saveCat = async (e) => {
        e.preventDefault();
        if (!catForm.name.trim()) { toast.warning("Category name is required"); return; }
        try {
            if (editingCat) {
                const updated = await api.updateAssetCategoryCommon(editingCat.id, { name: catForm.name.trim(), description: catForm.description.trim() });
                setCategories(prev => prev.map(c => c.id === editingCat.id ? updated : c));
                toast.success("Category updated");
            } else {
                const added = await api.addAssetCategoryCommon({ name: catForm.name.trim(), description: catForm.description.trim() });
                setCategories(prev => [...prev, added]);
                toast.success("Category added");
            }
            closeCatModal();
        } catch (err) { toast.error(err?.message || "Failed to save category"); }
    };

    const deleteCat = async () => {
        const { item } = catDelConfirm;
        setCatDelConfirm({ open: false, item: null });
        try {
            await api.deleteAssetCategoryCommon(item.id);
            setCategories(prev => prev.filter(c => c.id !== item.id));
            toast.success(`"${item.name}" deleted`);
        } catch (err) { toast.error(err?.message || "Failed to delete category"); }
    };

    const closeCatModal = () => { setCatModal(false); setEditingCat(null); setCatForm({ name: "", description: "" }); };

    const categoryTotals = useMemo(() => {
        const map = new Map();
        assets.forEach(a => {
            const name = (a.category || "").trim() || "Uncategorized";
            const cur  = map.get(name) || { total: 0, inUse: 0, available: 0, underRepair: 0, retired: 0 };
            cur.total++;
            if (a.status === "In Use")       cur.inUse++;
            if (a.status === "Available")    cur.available++;
            if (a.status === "Under Repair") cur.underRepair++;
            if (a.status === "Retired")      cur.retired++;
            map.set(name, cur);
        });
        return map;
    }, [assets]);

    const filteredCats = useMemo(() => categories
        .filter(c => !catSearch || c.name.toLowerCase().includes(catSearch.toLowerCase()))
        .map(c => {
            const t = categoryTotals.get(c.name) || {};
            return { ...c, total: t.total || 0, inUse: t.inUse || 0, available: t.available || 0, underRepair: t.underRepair || 0, retired: t.retired || 0 };
        })
        .sort((a, b) => b.total - a.total),
    [categories, categoryTotals, catSearch]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="assets-page">
            {/* Page header */}
            <div className="assets-header">
                <div>
                    <h1>Configuration</h1>
                    <p className="assets-subtitle">Manage departments, locations and asset categories</p>
                </div>
                {activeTab === "departments" && (
                    <Button variant="primary" onClick={() => setDeptModal(true)}>+ Add Department</Button>
                )}
                {activeTab === "locations" && (
                    <Button variant="primary" onClick={() => setLocModal(true)}>+ Add Location</Button>
                )}
                {activeTab === "categories" && (
                    <Button variant="primary" onClick={() => setCatModal(true)}>+ Add Category</Button>
                )}
            </div>

            {/* Tab bar */}
            <div className="orgs-tabs">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        className={`orgs-tab${activeTab === t.key ? " active" : ""}`}
                        onClick={() => setActiveTab(t.key)}
                    >
                        {t.icon}
                        <span>{t.label}</span>
                    </button>
                ))}
            </div>

            {/* ── DEPARTMENTS TAB ──────────────────────────────────────────── */}
            {activeTab === "departments" && (
                deptLoading ? <LoadingOverlay visible /> : (
                    <div className="asset-table-wrapper">
                        <table className="assets-table">
                            <thead>
                                <tr>
                                    <th>Department Name</th>
                                    <th>Location</th>
                                    <th>Employees</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {departments.map(dept => (
                                    <tr key={dept.id}>
                                        <td>{dept.name}</td>
                                        <td>{dept.location || "—"}</td>
                                        <td>
                                            <span className="orgs-count-badge">
                                                {employeeCounts[dept.name] || 0}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="orgs-row-actions">
                                                <Button variant="ghost" size="sm" iconOnly icon={<FaPen />} title="Edit"
                                                    onClick={() => { setEditingDept(dept); setDeptForm({ name: dept.name || "", location: dept.location || "" }); setDeptModal(true); }} />
                                                <Button variant="danger" size="sm" iconOnly icon={<FaTrash />} title="Delete"
                                                    onClick={() => setDeptDelConfirm({ open: true, item: dept })} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {departments.length === 0 && (
                                    <tr><td colSpan="4" className="table-empty-cell">No departments yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {/* ── LOCATIONS TAB ────────────────────────────────────────────── */}
            {activeTab === "locations" && (
                locLoading ? <LoadingOverlay visible /> : (
                    <div className="asset-table-wrapper">
                        <table className="assets-table">
                            <thead>
                                <tr>
                                    <th>City</th>
                                    <th>Country</th>
                                    <th>Address</th>
                                    <th>Head Count</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {locations.map(loc => (
                                    <tr key={loc.id}>
                                        <td>{loc.city}</td>
                                        <td>{loc.country}</td>
                                        <td>{loc.address || "—"}</td>
                                        <td><span className="orgs-count-badge">{loc.headcount || 0}</span></td>
                                        <td>
                                            <div className="orgs-row-actions">
                                                <Button variant="ghost" size="sm" iconOnly icon={<FaPen />} title="Edit"
                                                    onClick={() => { setEditingLoc(loc); setLocForm({ city: loc.city || "", country: loc.country || "India", address: loc.address || "" }); setLocModal(true); }} />
                                                <Button variant="danger" size="sm" iconOnly icon={<FaTrash />} title="Delete"
                                                    onClick={() => setLocDelConfirm({ open: true, item: loc })} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {locations.length === 0 && (
                                    <tr><td colSpan="5" className="table-empty-cell">No locations yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {/* ── CATEGORIES TAB ───────────────────────────────────────────── */}
            {activeTab === "categories" && (
                catLoading ? <LoadingOverlay visible /> : (
                    <>
                        <div className="asset-filters">
                            <input
                                placeholder="Search categories..."
                                value={catSearch}
                                onChange={e => setCatSearch(e.target.value)}
                                className="asset-search-input"
                            />
                        </div>
                        <div className="asset-table-wrapper">
                            <table className="assets-table">
                                <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th>Description</th>
                                        <th>Total</th>
                                        <th>In Use</th>
                                        <th>Available</th>
                                        <th>Under Repair</th>
                                        <th>Retired</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCats.map(cat => (
                                        <tr key={cat.id}>
                                            <td>{cat.name}</td>
                                            <td>{cat.description || "—"}</td>
                                            <td>{cat.total}</td>
                                            <td>{cat.inUse}</td>
                                            <td>{cat.available}</td>
                                            <td>{cat.underRepair}</td>
                                            <td>{cat.retired}</td>
                                            <td>
                                                <div className="orgs-row-actions">
                                                    <Button variant="ghost" size="sm" iconOnly icon={<FaPen />} title="Edit"
                                                        onClick={() => { setEditingCat(cat); setCatForm({ name: cat.name || "", description: cat.description === "-" ? "" : cat.description || "" }); setCatModal(true); }} />
                                                    <Button variant="danger" size="sm" iconOnly icon={<FaTrash />} title="Delete"
                                                        onClick={() => setCatDelConfirm({ open: true, item: cat })} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredCats.length === 0 && (
                                        <tr><td colSpan="8" className="table-empty-cell">No categories found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )
            )}

            {/* ── MODALS ───────────────────────────────────────────────────── */}

            {/* Department modal */}
            {deptModal && (
                <div className="page-modal-overlay">
                    <div className="page-modal page-modal-md">
                        <div className="page-modal-header">
                            <h2>{editingDept ? "Edit Department" : "Add Department"}</h2>
                            <button className="page-modal-close" onClick={closeDeptModal}>✕</button>
                        </div>
                        <form onSubmit={saveDept} className="page-modal-body">
                            <div style={{ marginBottom: "var(--space-lg)" }}>
                                <label className="page-modal-label">Department Name *</label>
                                <input type="text" className="page-modal-input" placeholder="e.g. Marketing"
                                    value={deptForm.name} onChange={e => setDeptForm(p => ({ ...p, name: e.target.value }))} required />
                            </div>
                            <div style={{ marginBottom: "var(--space-lg)" }}>
                                <label className="page-modal-label">Location</label>
                                <CityDropdown value={deptForm.location}
                                    onChange={city => setDeptForm(p => ({ ...p, location: city }))}
                                    placeholder="Search Indian city..." />
                            </div>
                            <div className="page-modal-footer">
                                <Button variant="secondary" onClick={closeDeptModal}>Cancel</Button>
                                <Button variant="primary" type="submit">{editingDept ? "Save Changes" : "Add Department"}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Location modal */}
            {locModal && (
                <div className="page-modal-overlay">
                    <div className="page-modal page-modal-md">
                        <div className="page-modal-header">
                            <h2>{editingLoc ? "Edit Location" : "Add Location"}</h2>
                            <button className="page-modal-close" onClick={closeLocModal}>✕</button>
                        </div>
                        <form onSubmit={saveLoc} className="page-modal-body">
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-lg)", marginBottom: "var(--space-lg)" }}>
                                <div>
                                    <label className="page-modal-label">City *</label>
                                    <CityDropdown value={locForm.city}
                                        onChange={city => setLocForm(p => ({ ...p, city }))}
                                        placeholder="Search Indian city..." />
                                </div>
                                <div>
                                    <label className="page-modal-label">Country</label>
                                    <input type="text" name="country" className="page-modal-input" placeholder="e.g. India"
                                        value={locForm.country} onChange={e => setLocForm(p => ({ ...p, country: e.target.value }))} />
                                </div>
                            </div>
                            <div style={{ marginBottom: "var(--space-lg)" }}>
                                <label className="page-modal-label">Address</label>
                                <textarea rows="3" className="page-modal-input" style={{ resize: "none" }}
                                    placeholder="Full address..."
                                    value={locForm.address} onChange={e => setLocForm(p => ({ ...p, address: e.target.value }))} />
                            </div>
                            <div className="page-modal-footer">
                                <Button variant="secondary" onClick={closeLocModal}>Cancel</Button>
                                <Button variant="primary" type="submit">{editingLoc ? "Save Changes" : "Add Location"}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Category modal */}
            {catModal && (
                <div className="page-modal-overlay">
                    <div className="page-modal page-modal-md">
                        <div className="page-modal-header">
                            <h2>{editingCat ? "Edit Category" : "Add Category"}</h2>
                            <button className="page-modal-close" onClick={closeCatModal}>✕</button>
                        </div>
                        <form onSubmit={saveCat} className="page-modal-body">
                            <div style={{ marginBottom: "var(--space-lg)" }}>
                                <label className="page-modal-label">Category Name *</label>
                                <input type="text" className="page-modal-input" placeholder="e.g. Laptops"
                                    value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} required />
                            </div>
                            <div style={{ marginBottom: "var(--space-lg)" }}>
                                <label className="page-modal-label">Description</label>
                                <textarea rows="3" className="page-modal-input" style={{ resize: "none" }}
                                    placeholder="Optional description..."
                                    value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))} />
                            </div>
                            <div className="page-modal-footer">
                                <Button variant="secondary" onClick={closeCatModal}>Cancel</Button>
                                <Button variant="primary" type="submit">{editingCat ? "Save Changes" : "Add Category"}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm dialogs */}
            <ConfirmDialog open={deptDelConfirm.open} title="Delete Department"
                message={`Delete "${deptDelConfirm.item?.name}"? This cannot be undone.`}
                confirmText="Delete" variant="danger"
                onConfirm={deleteDept} onCancel={() => setDeptDelConfirm({ open: false, item: null })} />

            <ConfirmDialog open={locDelConfirm.open} title="Delete Location"
                message={`Delete "${locDelConfirm.item?.city}"? This cannot be undone.`}
                confirmText="Delete" variant="danger"
                onConfirm={deleteLoc} onCancel={() => setLocDelConfirm({ open: false, item: null })} />

            <ConfirmDialog open={catDelConfirm.open} title="Delete Category"
                message={`Delete "${catDelConfirm.item?.name}"? This cannot be undone.`}
                confirmText="Delete" variant="danger"
                onConfirm={deleteCat} onCancel={() => setCatDelConfirm({ open: false, item: null })} />
        </div>
    );
}
