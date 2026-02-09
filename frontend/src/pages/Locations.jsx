import { useState, useEffect } from "react";
import "./Assets.css";
import api from "../services/api";
import { Button } from "../components/ui";
import { useToast } from "../context/ToastContext";

export default function Locations() {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    const [showModal, setShowModal] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [newLocation, setNewLocation] = useState({
        city: "",
        country: "",
        address: "",
    });

    useEffect(() => {
        loadLocations();
    }, []);

    const loadLocations = async () => {
        try {
            const data = await api.getLocationsCommon();
            setLocations(data);
        } catch (error) {
            console.error("Error fetching locations:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewLocation(prev => ({ ...prev, [name]: value }));
    };

    const handleAddLocation = async (e) => {
        e.preventDefault();
        if (!newLocation.city) {
            toast.warning("City is required");
            return;
        }

        try {
            const payload = { ...newLocation, name: newLocation.city };
            if (editingLocation) {
                const updated = await api.updateLocationCommon(editingLocation.id, payload);
                setLocations(prev => prev.map(loc => (loc.id === editingLocation.id ? updated : loc)));
                toast.success("Location updated successfully");
            } else {
                const added = await api.addLocationCommon(payload);
                setLocations(prev => [...prev, added]);
                toast.success("Location added successfully");
            }
            setShowModal(false);
            setEditingLocation(null);
            setNewLocation({ city: "", country: "", address: "" });
        } catch (error) {
            toast.error(error.message || "Failed to save location");
        }
    };

    return (
        <div className="assets-page">
            <div className="assets-header">
                <div>
                    <h1>Locations</h1>
                    <p className="assets-subtitle">Manage physical offices and sites</p>
                </div>
                <div className="asset-actions">
                    <Button
                        variant="primary"
                        onClick={() => setShowModal(true)}
                    >
                        + Add Location
                    </Button>
                </div>
            </div>

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
                        {locations.map((loc) => (
                            <tr key={loc.id}>
                                <td>{loc.city}</td>
                                <td>{loc.country}</td>
                                <td>{loc.address}</td>
                                <td>
                                    <span className="status-badge" style={{
                                        backgroundColor: "#f3f4f6",
                                        color: "#374151",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontWeight: 600
                                    }}>
                                        {loc.headcount}
                                    </span>
                                </td>
                                <td>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            setEditingLocation(loc);
                                            setNewLocation({
                                                city: loc.city || "",
                                                country: loc.country || "",
                                                address: loc.address || ""
                                            });
                                            setShowModal(true);
                                        }}
                                    >
                                        Edit
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {locations.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                                    No locations found. Add your first one!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL (Keep basic Tailwind for modal as Assets.css doesn't have modal styles yet, or reuse generic) */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            {editingLocation ? "Edit Location" : "Add New Location"}
                        </h2>

                        <form onSubmit={handleAddLocation} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={newLocation.city}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="e.g. New York"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={newLocation.country}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="e.g. USA"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea
                                    name="address"
                                    value={newLocation.address}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                    placeholder="Full address..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingLocation(null);
                                        setNewLocation({ city: "", country: "", address: "" });
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    type="submit"
                                >
                                    {editingLocation ? "Save Changes" : "Add Location"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
