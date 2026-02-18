import { useState, useEffect, useRef } from "react";
import "./Assets.css";
import api from "../services/api";
import { Button, LoadingOverlay, ConfirmDialog } from "../components/ui";
import { FaPen, FaTrash } from "react-icons/fa";
import { useToast } from "../context/ToastContext";
import INDIAN_CITIES from "../data/indianCities";

function CityDropdown({ value, onChange, placeholder = "Search & select city..." }) {
    const [search, setSearch] = useState(value || "");
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        setSearch(value || "");
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filtered = INDIAN_CITIES.filter(city =>
        city.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 50);

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <input
                type="text"
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setOpen(true);
                    if (!e.target.value) onChange("");
                }}
                onFocus={() => setOpen(true)}
                className="page-modal-input"
                placeholder={placeholder}
                autoComplete="off"
            />
            {open && filtered.length > 0 && (
                <ul className="city-dropdown-list">
                    {filtered.map((city) => (
                        <li
                            key={city}
                            className={`city-dropdown-item${city === value ? " selected" : ""}`}
                            onClick={() => {
                                onChange(city);
                                setSearch(city);
                                setOpen(false);
                            }}
                        >
                            {city}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function Locations() {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    const [showModal, setShowModal] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [newLocation, setNewLocation] = useState({
        city: "",
        country: "India",
        address: "",
    });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });

    useEffect(() => {
        loadLocations();
    }, []);

    const loadLocations = async () => {
        try {
            const data = await api.getLocationsCommon();
            setLocations(data);
        } catch (error) {
            console.error("Error fetching locations:", error);
            toast.error("Failed to load locations");
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
            setNewLocation({ city: "", country: "India", address: "" });
        } catch (error) {
            toast.error(error.message || "Failed to save location");
        }
    };

    const confirmDelete = async () => {
        const { item } = deleteConfirm;
        setDeleteConfirm({ open: false, item: null });
        try {
            await api.deleteLocationCommon(item.id);
            setLocations(prev => prev.filter(l => l.id !== item.id));
            toast.success(`Location "${item.city}" deleted successfully`);
        } catch (error) {
            toast.error(error?.message || "Failed to delete location");
        }
    };

    if (loading) return <LoadingOverlay visible />;

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
                                        backgroundColor: "var(--bg-muted)",
                                        color: "var(--text-secondary)",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontWeight: 600
                                    }}>
                                        {loc.headcount}
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
                                                setEditingLocation(loc);
                                                setNewLocation({
                                                    city: loc.city || "",
                                                    country: loc.country || "India",
                                                    address: loc.address || ""
                                                });
                                                setShowModal(true);
                                            }}
                                        />
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            iconOnly
                                            icon={<FaTrash />}
                                            title="Delete"
                                            onClick={() => setDeleteConfirm({ open: true, item: loc })}
                                        />
                                    </div>
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

            <ConfirmDialog
                open={deleteConfirm.open}
                title="Delete Location"
                message={`Are you sure you want to delete "${deleteConfirm.item?.city || ""}"? This action cannot be undone.`}
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
                                <h2>{editingLocation ? "Edit Location" : "Add New Location"}</h2>
                            </div>
                            <button className="page-modal-close" onClick={() => { setShowModal(false); setEditingLocation(null); setNewLocation({ city: "", country: "India", address: "" }); }}>✕</button>
                        </div>

                        <form onSubmit={handleAddLocation} className="page-modal-body">
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-lg)", marginBottom: "var(--space-lg)" }}>
                                <div>
                                    <label className="page-modal-label">City *</label>
                                    <CityDropdown
                                        value={newLocation.city}
                                        onChange={(city) => setNewLocation(prev => ({ ...prev, city }))}
                                        placeholder="Search Indian city..."
                                    />
                                </div>
                                <div>
                                    <label className="page-modal-label">Country</label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={newLocation.country}
                                        onChange={handleInputChange}
                                        className="page-modal-input"
                                        placeholder="e.g. India"
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: "var(--space-lg)" }}>
                                <label className="page-modal-label">Address</label>
                                <textarea
                                    name="address"
                                    value={newLocation.address}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="page-modal-input"
                                    style={{ resize: "none" }}
                                    placeholder="Full address..."
                                />
                            </div>

                            <div className="page-modal-footer">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingLocation(null);
                                        setNewLocation({ city: "", country: "India", address: "" });
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
