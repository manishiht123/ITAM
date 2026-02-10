import { useState, useEffect } from "react";
import api from "../../services/api";
import { Button, LoadingOverlay } from "../../components/ui";
import { useToast } from "../../context/ToastContext";
import "./UsersRoles.css";

export default function UsersRoles() {
    const toast = useToast();
    const rolesCatalog = [
        {
            id: "admin",
            name: "Administrator",
            description: "Full access to configuration, users, and system settings.",
            permissions: ["All assets", "User management", "Settings", "Reports"]
        },
        {
            id: "manager",
            name: "IT Manager",
            description: "Manage assets, allocations, and compliance reporting.",
            permissions: ["Assets", "Allocations", "Reports"]
        },
        {
            id: "auditor",
            name: "Auditor",
            description: "Read-only access to logs, inventory, and compliance.",
            permissions: ["Read-only", "Audit logs", "Reports"]
        },
        {
            id: "employee",
            name: "Employee",
            description: "View assigned assets and raise requests.",
            permissions: ["View assets", "Requests"]
        }
    ];
    const modulesCatalog = [
        { id: "assets", label: "Assets" },
        { id: "employees", label: "Employees" },
        { id: "reports", label: "Reports" },
        { id: "settings", label: "Settings" },
        { id: "notifications", label: "Notifications" }
    ];

    const [users, setUsers] = useState([]);
    const [customRoles, setCustomRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [roleDrawerOpen, setRoleDrawerOpen] = useState(false);
    const [entities, setEntities] = useState([]);
    const [roleForm, setRoleForm] = useState({
        name: "",
        description: "",
        permissions: []
    });
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "employee",
        status: "Active",
        password: "",
        allowedEntities: [],
        entityPermissions: {}
    });

    useEffect(() => {
        loadUsers();
        loadEntities();
        loadRoles();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const loadEntities = async () => {
        try {
            const data = await api.getEntities();
            setEntities(data);
        } catch (error) {
            console.error("Error fetching entities:", error);
            toast.error("Failed to load entities");
        }
    };

    const loadRoles = async () => {
        try {
            const data = await api.getRoles();
            setCustomRoles(data || []);
        } catch (error) {
            console.error("Error fetching roles:", error);
            toast.error("Failed to load roles");
        }
    };

    const buildDefaultPermissions = () =>
        modulesCatalog.reduce((acc, module) => {
            acc[module.id] = true;
            return acc;
        }, {});

    const openAdd = () => {
        setEditingUser(null);
        setFormData({
            name: "",
            email: "",
            role: "employee",
            status: "Active",
            password: "",
            allowedEntities: [],
            entityPermissions: {}
        });
        setDrawerOpen(true);
    };

    const openEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name || "",
            email: user.email || "",
            role: user.role || "employee",
            status: user.status || "Active",
            password: "",
            allowedEntities: user.allowedEntities || [],
            entityPermissions: user.entityPermissions || {}
        });
        setDrawerOpen(true);
    };

    const handleSave = async () => {
        try {
            if (!formData.name || !formData.email || !formData.role) {
                toast.warning("Name, Email, and Role are required.");
                return;
            }

            if (editingUser) {
                const payload = { ...formData };
                if (!payload.password) delete payload.password;
                await api.updateUser(editingUser.id, payload);
            } else {
                if (!formData.password) {
                    toast.warning("Password is required for new users.");
                    return;
                }
                await api.addUser(formData);
            }

            setDrawerOpen(false);
            loadUsers();
        } catch (error) {
            toast.error(error?.message || "Failed to save user.");
        }
    };

    const toggleEntity = (code) => {
        setFormData((prev) => {
            const isSelected = prev.allowedEntities.includes(code);
            const nextEntities = isSelected
                ? prev.allowedEntities.filter((ent) => ent !== code)
                : [...prev.allowedEntities, code];

            const nextPermissions = { ...prev.entityPermissions };
            if (!isSelected && !nextPermissions[code]) {
                nextPermissions[code] = buildDefaultPermissions();
            }
            if (isSelected) {
                delete nextPermissions[code];
            }

            return {
                ...prev,
                allowedEntities: nextEntities,
                entityPermissions: nextPermissions
            };
        });
    };

    const toggleModulePermission = (code, moduleId) => {
        setFormData((prev) => {
            const entityPerms = prev.entityPermissions[code] || {};
            return {
                ...prev,
                entityPermissions: {
                    ...prev.entityPermissions,
                    [code]: {
                        ...entityPerms,
                        [moduleId]: !entityPerms[moduleId]
                    }
                }
            };
        });
    };

    const filteredUsers = users.filter((user) => {
        if (!search) return true;
        const needle = search.toLowerCase();
        return (
            user.name?.toLowerCase().includes(needle) ||
            user.email?.toLowerCase().includes(needle) ||
            user.role?.toLowerCase().includes(needle)
        );
    });

    const allRoles = [
        ...rolesCatalog,
        ...customRoles.map((role) => ({
            id: `custom_${role.id}`,
            name: role.name,
            description: role.description,
            permissions: Array.isArray(role.permissions) ? role.permissions : []
        }))
    ];

    const getRoleLabel = (roleId) => {
        const match = allRoles.find((r) => r.id === roleId || r.name === roleId);
        return match?.name || roleId;
    };

    const toggleRolePermission = (moduleId) => {
        setRoleForm((prev) => {
            const exists = prev.permissions.includes(moduleId);
            return {
                ...prev,
                permissions: exists ? prev.permissions.filter((p) => p !== moduleId) : [...prev.permissions, moduleId]
            };
        });
    };

    const openAddRole = () => {
        setRoleForm({
            name: "",
            description: "",
            permissions: []
        });
        setRoleDrawerOpen(true);
    };

    const handleSaveRole = async () => {
        try {
            if (!roleForm.name.trim()) {
                toast.warning("Role name is required.");
                return;
            }
            await api.addRole({
                name: roleForm.name,
                description: roleForm.description,
                permissions: roleForm.permissions
            });
            setRoleDrawerOpen(false);
            loadRoles();
        } catch (error) {
            toast.error(error?.message || "Failed to create role.");
        }
    };

    if (loading) return <LoadingOverlay visible message="Loading users..." />;

    return (
        <div className="users-roles-page">
            <div className="users-roles-header">
                <div>
                    <h1>Users & Roles</h1>
                    <p className="users-roles-subtitle">Manage access, roles, and permissions for the ITAM platform.</p>
                </div>
                <Button variant="primary" onClick={openAdd}>
                    + Add User
                </Button>
            </div>

            <div className="users-roles-grid">
                <div className="panel-card">
                    <div className="toolbar">
                        <h3 className="panel-title">User Directory</h3>
                        <input
                            className="search-input"
                            placeholder="Search users, roles, or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Entities</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                <div className="user-cell">
                                            <div className="avatar-circle">
                                                {user.name?.charAt(0) || "U"}
                                            </div>
                                            <div>
                                                <div>{user.name}</div>
                                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                                    ID #{user.id}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className="role-chip">{getRoleLabel(user.role)}</span>
                                    </td>
                                    <td>
                                        <span className={`status-pill ${user.status === "Active" ? "active" : "inactive"}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td>
                                        {user.allowedEntities?.length ? (
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                                {user.allowedEntities.map((code) => (
                                                    <span key={code} className="perm-chip">
                                                        {code}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>All</span>
                                        )}
                                    </td>
                                    <td>
                                        <button className="action-link" onClick={() => openEdit(user)}>
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "16px" }}>
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="panel-card">
                    <div className="panel-header">
                        <h3 className="panel-title">Roles & Permissions</h3>
                        <Button variant="primary" onClick={openAddRole}>
                            + Add Role
                        </Button>
                    </div>
                    <div className="roles-list">
                        {rolesCatalog.map((role) => (
                            <div className="role-card" key={role.id}>
                                <h4>{role.name}</h4>
                                <p>{role.description}</p>
                                <div className="role-perms">
                                    {role.permissions.map((perm) => (
                                        <span className="perm-chip" key={perm}>{perm}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {customRoles.map((role) => (
                            <div className="role-card" key={`custom-${role.id}`}>
                                <div className="role-card-header">
                                    <h4>{role.name}</h4>
                                    <span className="role-tag">Custom</span>
                                </div>
                                <p>{role.description || "Custom role"}</p>
                                <div className="role-perms">
                                    {(role.permissions || []).map((perm) => {
                                        const label = modulesCatalog.find((m) => m.id === perm)?.label || perm;
                                        return <span className="perm-chip" key={`${role.id}-${perm}`}>{label}</span>;
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {drawerOpen && (
                <>
                    <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
                    <div className="drawer-panel">
                        <div className="drawer-header">
                            <h3>{editingUser ? "Edit User" : "Add User"}</h3>
                            <button className="action-link" onClick={() => setDrawerOpen(false)}>Close</button>
                        </div>
                        <div className="drawer-body">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    value={formData.name}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="Full name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    value={formData.email}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                                    placeholder="email@company.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                                >
                                    {allRoles.map((role) => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Entities (Multi-select)</label>
                                <div style={{ display: "grid", gap: 6 }}>
                                    {entities.map((entity) => (
                                        <label key={entity.code} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.allowedEntities.includes(entity.code)}
                                                onChange={() => toggleEntity(entity.code)}
                                            />
                                            <span>{entity.name} ({entity.code})</span>
                                        </label>
                                    ))}
                                    {entities.length === 0 && (
                                        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                                            No entities available.
                                        </span>
                                    )}
                                </div>
                            </div>

                            {formData.allowedEntities.length > 0 && (
                                <div className="form-group">
                                    <label>Entity Module Permissions</label>
                                    <div style={{ display: "grid", gap: 10 }}>
                                        {formData.allowedEntities.map((code) => (
                                            <div key={code} className="role-card">
                                                <h4 style={{ marginBottom: 6 }}>Entity {code}</h4>
                                                <div className="role-perms">
                                                    {modulesCatalog.map((module) => (
                                                        <label key={module.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={Boolean(formData.entityPermissions?.[code]?.[module.id])}
                                                                onChange={() => toggleModulePermission(code, module.id)}
                                                            />
                                                            <span style={{ fontSize: 12 }}>{module.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="form-group">
                                <label>{editingUser ? "Reset Password (optional)" : "Temporary Password"}</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                                    placeholder={editingUser ? "Leave blank to keep" : "Set a temporary password"}
                                />
                            </div>
                        </div>
                        <div className="drawer-footer">
                            <button className="btn-secondary" onClick={() => setDrawerOpen(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleSave}>
                                Save User
                            </button>
                        </div>
                    </div>
                </>
            )}

            {roleDrawerOpen && (
                <>
                    <div className="drawer-overlay" onClick={() => setRoleDrawerOpen(false)} />
                    <div className="drawer-panel role-drawer">
                        <div className="drawer-header">
                            <h3>Create Role</h3>
                            <button className="action-link" onClick={() => setRoleDrawerOpen(false)}>Close</button>
                        </div>
                        <div className="drawer-body">
                            <div className="form-group">
                                <label>Role Name</label>
                                <input
                                    value={roleForm.name}
                                    onChange={(e) => setRoleForm((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Procurement Manager"
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    value={roleForm.description}
                                    onChange={(e) => setRoleForm((prev) => ({ ...prev, description: e.target.value }))}
                                    placeholder="Short description"
                                />
                            </div>
                            <div className="form-group">
                                <label>Permissions</label>
                                <div className="role-perms">
                                    {modulesCatalog.map((module) => (
                                        <label key={module.id} className="perm-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={roleForm.permissions.includes(module.id)}
                                                onChange={() => toggleRolePermission(module.id)}
                                            />
                                            <span>{module.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="drawer-footer">
                            <button className="btn-secondary" onClick={() => setRoleDrawerOpen(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleSaveRole}>
                                Save Role
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
