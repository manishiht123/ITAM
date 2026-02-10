import { useState, useEffect, useMemo } from "react";
import "./Assets.css";
import api from "../services/api";
import { useEntity } from "../context/EntityContext";
import { Button, ConfirmDialog } from "../components/ui";
import { FaPen, FaTrash } from "react-icons/fa";
import { useToast } from "../context/ToastContext";

export default function Departments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { entity } = useEntity();
    const toast = useToast();

    const [showModal, setShowModal] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [newDept, setNewDept] = useState({
        name: "",
        location: "",
    });

    const [locations, setLocations] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });

    useEffect(() => {
        loadData();
    }, [entity]);

    const loadData = async () => {
        try {
            const [deptData, locData] = await Promise.all([
                api.getDepartmentsCommon(),
                api.getLocationsCommon()
            ]);
            setDepartments(deptData);
            setLocations(locData);

            if (entity === "ALL") {
                const entities = await api.getEntities();
                const codes = (entities || []).map((e) => e.code).filter(Boolean);
                const results = await Promise.allSettled(
                    codes.map((code) => api.getEmployees(code))
                );
                const combined = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
                setEmployees(combined);
            } else {
                const data = await api.getEmployees(entity);
                setEmployees(data || []);
            }
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Failed to load departments data");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewDept(prev => ({ ...prev, [name]: value }));
    };

    const handleAddDept = async (e) => {
        e.preventDefault();
        if (!newDept.name || !newDept.location) {
            toast.warning("Department name and location are required");
            return;
        }

        try {
            if (editingDept) {
                const updated = await api.updateDepartmentCommon(editingDept.id, newDept);
                setDepartments(prev => prev.map(dept => (dept.id === editingDept.id ? updated : dept)));
                toast.success("Department updated successfully");
            } else {
                const added = await api.addDepartmentCommon(newDept);
                setDepartments(prev => [...prev, added]);
                toast.success("Department added successfully");
            }
            setShowModal(false);
            setEditingDept(null);
            setNewDept({ name: "", location: "" });
        } catch (error) {
            toast.error(error.message || "Failed to save department");
        }
    };

    const confirmDelete = async () => {
        const { item } = deleteConfirm;
        setDeleteConfirm({ open: false, item: null });
        try {
            await api.deleteDepartmentCommon(item.id);
            setDepartments(prev => prev.filter(d => d.id !== item.id));
            toast.success(`Department "${item.name}" deleted successfully`);
        } catch (error) {
            toast.error(error?.message || "Failed to delete department");
        }
    };

    const employeeCounts = useMemo(() => {
        const counts = {};
        (employees || []).forEach((emp) => {
            const deptName = emp.department || emp.dept || emp.departmentName || "";
            if (!deptName) return;
            counts[deptName] = (counts[deptName] || 0) + 1;
        });
        return counts;
    }, [employees]);

    return (
        <div className="assets-page">
            <div className="assets-header">
                <div>
                    <h1>Departments</h1>
                    <p className="assets-subtitle">Manage organizational structure</p>
                </div>
                <div className="asset-actions">
                    <Button
                        variant="primary"
                        onClick={() => setShowModal(true)}
                    >
                        + Add Department
                    </Button>
                </div>
            </div>

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
                        {departments.map((dept) => (
                            <tr key={dept.id}>
                                <td>{dept.name}</td>
                                <td>{dept.location}</td>
                                <td>
                                    <span className="status-badge" style={{
                                        backgroundColor: "var(--primary-soft)",
                                        color: "var(--primary-700)",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontWeight: 600
                                    }}>
                                        {employeeCounts[dept.name] || 0}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            iconOnly
                                            icon={<FaPen />}
                                            title="Edit"
                                            onClick={() => {
                                                setEditingDept(dept);
                                                setNewDept({ name: dept.name || "", location: dept.location || "" });
                                                setShowModal(true);
                                            }}
                                        />
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            iconOnly
                                            icon={<FaTrash />}
                                            title="Delete"
                                            onClick={() => setDeleteConfirm({ open: true, item: dept })}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {departments.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                                    No departments found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog
                open={deleteConfirm.open}
                title="Delete Department"
                message={`Are you sure you want to delete "${deleteConfirm.item?.name || ""}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm({ open: false, item: null })}
            />

            {/* MODAL */}
            {showModal && (
                <div className="page-modal-overlay">
                    <div className="page-modal page-modal-md">
                        <div className="page-modal-header">
                            <div>
                                <h2>{editingDept ? "Edit Department" : "Add New Department"}</h2>
                            </div>
                            <button className="page-modal-close" onClick={() => { setShowModal(false); setEditingDept(null); setNewDept({ name: "", location: "" }); }}>✕</button>
                        </div>

                        <form onSubmit={handleAddDept} className="page-modal-body">
                            <div style={{ marginBottom: "var(--space-lg)" }}>
                                <label className="page-modal-label">Department Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={newDept.name}
                                    onChange={handleInputChange}
                                    className="page-modal-input"
                                    placeholder="e.g. Marketing"
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: "var(--space-lg)" }}>
                                <label className="page-modal-label">Location</label>
                                <select
                                    name="location"
                                    value={newDept.location}
                                    onChange={handleInputChange}
                                    className="page-modal-input"
                                >
                                    <option value="">Select Location...</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="page-modal-footer">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingDept(null);
                                        setNewDept({ name: "", location: "" });
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    type="submit"
                                >
                                    {editingDept ? "Save Changes" : "Add Department"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
