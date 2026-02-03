import { useState, useEffect, useMemo } from "react";
import "./Assets.css";
import api from "../services/api";
import { useEntity } from "../context/EntityContext";

export default function Departments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { entity } = useEntity();

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
            alert("Department name and location are required.");
            return;
        }

        try {
            if (editingDept) {
                const updated = await api.updateDepartmentCommon(editingDept.id, newDept);
                setDepartments(prev => prev.map(dept => (dept.id === editingDept.id ? updated : dept)));
            } else {
                const added = await api.addDepartmentCommon(newDept);
                setDepartments(prev => [...prev, added]);
            }
            setShowModal(false);
            setEditingDept(null);
            setNewDept({ name: "", location: "" });
        } catch (error) {
            alert(error.message);
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
                    <button
                        onClick={() => setShowModal(true)}
                        className="asset-action-btn primary"
                    >
                        + Add Department
                    </button>
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
                                        backgroundColor: "#eff6ff",
                                        color: "#1d4ed8",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontWeight: 600
                                    }}>
                                        {employeeCounts[dept.name] || 0}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className="asset-action-btn secondary"
                                        onClick={() => {
                                            setEditingDept(dept);
                                            setNewDept({ name: dept.name || "", location: dept.location || "" });
                                            setShowModal(true);
                                        }}
                                    >
                                        Edit
                                    </button>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            {editingDept ? "Edit Department" : "Add New Department"}
                        </h2>

                        <form onSubmit={handleAddDept} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={newDept.name}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="e.g. Marketing"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <select
                                    name="location"
                                    value={newDept.location}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                >
                                    <option value="">Select Location...</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingDept(null);
                                        setNewDept({ name: "", location: "" });
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="asset-action-btn primary"
                                >
                                    {editingDept ? "Save Changes" : "Add Department"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
