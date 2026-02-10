import { useState, useEffect, useMemo } from "react";
import "./Assets.css";
import api from "../services/api";
import { useEntity } from "../context/EntityContext";
import { Button } from "../components/ui";
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
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            setEditingDept(dept);
                                            setNewDept({ name: dept.name || "", location: dept.location || "" });
                                            setShowModal(true);
                                        }}
                                    >
                                        Edit
                                    </Button>
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
