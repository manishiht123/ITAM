import { useState, useEffect } from "react";
import api from "../../services/api";
import { Button, LoadingOverlay, ConfirmDialog } from "../../components/ui";
import { useToast } from "../../context/ToastContext";
import {
    FaUserShield, FaUserTie, FaUserCheck, FaUser,
    FaPlus, FaEdit, FaTrash, FaTimes, FaShieldAlt,
    FaBoxOpen, FaUsers, FaChartBar, FaCog, FaBell, FaStar
} from "react-icons/fa";
import "./UsersRoles.css";

const BUILT_IN_ROLES = [
    {
        id: "admin",
        name: "Administrator",
        description: "Full access to configuration, users, and system settings.",
        permissions: ["All Assets", "User Management", "Settings", "Reports"],
        icon: FaUserShield,
        color: "var(--danger)"
    },
    {
        id: "manager",
        name: "IT Manager",
        description: "Manage assets, allocations, and compliance reporting.",
        permissions: ["Assets", "Allocations", "Reports"],
        icon: FaUserTie,
        color: "var(--primary)"
    },
    {
        id: "auditor",
        name: "Auditor",
        description: "Read-only access to logs, inventory, and compliance.",
        permissions: ["Read-only", "Audit Logs", "Reports"],
        icon: FaUserCheck,
        color: "#b45309"
    },
    {
        id: "employee",
        name: "Employee",
        description: "View assigned assets and raise requests.",
        permissions: ["View Assets", "Requests"],
        icon: FaUser,
        color: "var(--text-secondary)"
    }
];

const MODULES = [
    { id: "assets",        label: "Assets",        icon: FaBoxOpen },
    { id: "employees",     label: "Employees",     icon: FaUsers },
    { id: "reports",       label: "Reports",       icon: FaChartBar },
    { id: "settings",      label: "Settings",      icon: FaCog },
    { id: "notifications", label: "Notifications", icon: FaBell }
];

export default function UsersRoles() {
    const toast = useToast();

    const [users, setUsers] = useState([]);
    const [customRoles, setCustomRoles] = useState([]);
    const [entities, setEntities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [userDrawerOpen, setUserDrawerOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: "", email: "", role: "employee", status: "Active",
        password: "", allowedEntities: [], entityPermissions: {}
    });

    const [roleDrawerOpen, setRoleDrawerOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleForm, setRoleForm] = useState({ name: "", description: "", permissions: [], entityPermissions: {} });

    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, role: null });

    useEffect(() => {
        loadUsers();
        loadEntities();
        loadRoles();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const loadEntities = async () => {
        try {
            const data = await api.getEntities();
            setEntities(data || []);
        } catch {
            toast.error("Failed to load entities");
        }
    };

    const loadRoles = async () => {
        try {
            const data = await api.getRoles();
            setCustomRoles(data || []);
        } catch {
            toast.error("Failed to load roles");
        }
    };

    // Custom roles store their NAME as the user.role value (not a prefixed ID)
    const allRolesForSelect = [
        ...BUILT_IN_ROLES,
        ...customRoles.map((r) => ({ id: r.name, name: r.name, isCustom: true, dbId: r.id }))
    ];

    const getRoleLabel = (roleValue) => {
        if (!roleValue) return "—";
        const match = allRolesForSelect.find((r) => r.id === roleValue || r.name === roleValue);
        return match?.name || roleValue;
    };

    const isCustomRole = (roleValue) => customRoles.some((r) => r.name === roleValue);

    // ── User drawer ──────────────────────────────────────────────────────────
    const buildDefaultPermissions = () =>
        MODULES.reduce((acc, m) => { acc[m.id] = true; return acc; }, {});

    const openAddUser = () => {
        setEditingUser(null);
        setFormData({ name: "", email: "", role: "employee", status: "Active", password: "", allowedEntities: [], entityPermissions: {} });
        setUserDrawerOpen(true);
    };

    const openEditUser = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name || "", email: user.email || "",
            role: user.role || "employee", status: user.status || "Active",
            password: "", allowedEntities: user.allowedEntities || [],
            entityPermissions: user.entityPermissions || {}
        });
        setUserDrawerOpen(true);
    };

    const handleSaveUser = async () => {
        if (!formData.name || !formData.email || !formData.role) {
            toast.warning("Name, Email, and Role are required.");
            return;
        }
        try {
            if (editingUser) {
                const payload = { ...formData };
                if (!payload.password) delete payload.password;
                await api.updateUser(editingUser.id, payload);
                toast.success("User updated successfully.");
            } else {
                if (!formData.password) { toast.warning("Password is required for new users."); return; }
                await api.addUser(formData);
                toast.success("User added successfully.");
            }
            setUserDrawerOpen(false);
            loadUsers();
        } catch (err) {
            toast.error(err?.message || "Failed to save user.");
        }
    };

    const toggleEntity = (code) => {
        setFormData((prev) => {
            const isSelected = prev.allowedEntities.includes(code);
            const nextEntities = isSelected
                ? prev.allowedEntities.filter((e) => e !== code)
                : [...prev.allowedEntities, code];
            const nextPerms = { ...prev.entityPermissions };
            if (!isSelected && !nextPerms[code]) nextPerms[code] = buildDefaultPermissions();
            if (isSelected) delete nextPerms[code];
            return { ...prev, allowedEntities: nextEntities, entityPermissions: nextPerms };
        });
    };

    const toggleModulePerm = (code, moduleId) => {
        setFormData((prev) => ({
            ...prev,
            entityPermissions: {
                ...prev.entityPermissions,
                [code]: { ...(prev.entityPermissions[code] || {}), [moduleId]: !prev.entityPermissions[code]?.[moduleId] }
            }
        }));
    };

    // ── Role drawer ──────────────────────────────────────────────────────────
    const openAddRole = () => {
        setEditingRole(null);
        setRoleForm({ name: "", description: "", permissions: [], entityPermissions: {} });
        setRoleDrawerOpen(true);
    };

    const openEditRole = (role) => {
        setEditingRole(role);
        setRoleForm({
            name: role.name,
            description: role.description || "",
            permissions: Array.isArray(role.permissions) ? role.permissions : [],
            entityPermissions: role.entityPermissions && typeof role.entityPermissions === "object" ? role.entityPermissions : {}
        });
        setRoleDrawerOpen(true);
    };

    const toggleRolePerm = (moduleId) => {
        setRoleForm((prev) => ({
            ...prev,
            permissions: prev.permissions.includes(moduleId)
                ? prev.permissions.filter((p) => p !== moduleId)
                : [...prev.permissions, moduleId]
        }));
    };

    const toggleRoleEntity = (code) => {
        setRoleForm((prev) => {
            const isSelected = Boolean(prev.entityPermissions[code]);
            const next = { ...prev.entityPermissions };
            if (isSelected) {
                delete next[code];
            } else {
                next[code] = MODULES.reduce((acc, m) => { acc[m.id] = true; return acc; }, {});
            }
            return { ...prev, entityPermissions: next };
        });
    };

    const toggleRoleEntityModule = (code, moduleId) => {
        setRoleForm((prev) => ({
            ...prev,
            entityPermissions: {
                ...prev.entityPermissions,
                [code]: { ...(prev.entityPermissions[code] || {}), [moduleId]: !prev.entityPermissions[code]?.[moduleId] }
            }
        }));
    };

    const handleSaveRole = async () => {
        if (!roleForm.name.trim()) { toast.warning("Role name is required."); return; }
        try {
            if (editingRole) {
                await api.updateRole(editingRole.id, {
                    name: roleForm.name.trim(),
                    description: roleForm.description,
                    permissions: roleForm.permissions,
                    entityPermissions: roleForm.entityPermissions
                });
                toast.success("Role updated successfully.");
            } else {
                await api.addRole({
                    name: roleForm.name.trim(),
                    description: roleForm.description,
                    permissions: roleForm.permissions,
                    entityPermissions: roleForm.entityPermissions
                });
                toast.success("Custom role created.");
            }
            setRoleDrawerOpen(false);
            loadRoles();
        } catch (err) {
            toast.error(err?.message || "Failed to save role.");
        }
    };

    const handleDeleteRole = async () => {
        if (!deleteConfirm.role) return;
        try {
            await api.deleteRole(deleteConfirm.role.id);
            toast.success(`Role "${deleteConfirm.role.name}" deleted.`);
            setDeleteConfirm({ open: false, role: null });
            loadRoles();
        } catch (err) {
            toast.error(err?.message || "Failed to delete role.");
        }
    };

    const filteredUsers = users.filter((u) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
    });

    if (loading) return <LoadingOverlay visible message="Loading users & roles..." />;

    return (
        <div className="users-roles-page">
            <div className="users-roles-header">
                <div>
                    <h1>Users &amp; Roles</h1>
                    <p className="users-roles-subtitle">Manage access, roles, and permissions for the ITAM platform.</p>
                </div>
                <Button variant="primary" onClick={openAddUser}>
                    <FaPlus style={{ marginRight: 6 }} /> Add User
                </Button>
            </div>

            <div className="users-roles-grid">
                {/* ── User Directory ─────────────────────────── */}
                <div className="panel-card">
                    <div className="toolbar">
                        <h3 className="panel-title">User Directory</h3>
                        <input
                            className="search-input"
                            placeholder="Search by name, email or role..."
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
                                            <div className="avatar-circle">{user.name?.charAt(0)?.toUpperCase() || "U"}</div>
                                            <div>
                                                <div className="user-name">{user.name}</div>
                                                <div className="user-id">ID #{user.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`role-chip${isCustomRole(user.role) ? " custom" : ""}`}>
                                            {getRoleLabel(user.role)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-pill ${user.status === "Active" ? "active" : "inactive"}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td>
                                        {user.allowedEntities?.length ? (
                                            <div className="entity-chips">
                                                {user.allowedEntities.map((code) => (
                                                    <span key={code} className="perm-chip">{code}</span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="all-entities-label">All</span>
                                        )}
                                    </td>
                                    <td>
                                        <button className="action-link" onClick={() => openEditUser(user)}>
                                            <FaEdit style={{ marginRight: 4 }} />Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="empty-row">No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Roles & Permissions ────────────────────── */}
                <div className="panel-card">
                    <div className="panel-header">
                        <h3 className="panel-title">Roles &amp; Permissions</h3>
                        <Button variant="primary" size="sm" onClick={openAddRole}>
                            <FaPlus style={{ marginRight: 5 }} /> Add Role
                        </Button>
                    </div>

                    <div className="roles-list">
                        <div className="roles-section-label">Built-in Roles</div>
                        {BUILT_IN_ROLES.map((role) => {
                            const Icon = role.icon;
                            return (
                                <div className="role-card" key={role.id}>
                                    <div className="role-card-header">
                                        <div className="role-card-title">
                                            <span className="role-icon-wrap" style={{ color: role.color }}><Icon /></span>
                                            <h4>{role.name}</h4>
                                        </div>
                                        <span className="role-badge builtin">Built-in</span>
                                    </div>
                                    <p>{role.description}</p>
                                    <div className="role-perms">
                                        {role.permissions.map((perm) => (
                                            <span className="perm-chip" key={perm}>{perm}</span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {customRoles.length > 0 && (
                            <div className="roles-section-label" style={{ marginTop: 12 }}>Custom Roles</div>
                        )}
                        {customRoles.map((role) => (
                            <div className="role-card custom-role-card" key={`custom-${role.id}`}>
                                <div className="role-card-header">
                                    <div className="role-card-title">
                                        <span className="role-icon-wrap" style={{ color: "var(--primary)" }}><FaStar /></span>
                                        <h4>{role.name}</h4>
                                    </div>
                                    <div className="role-card-actions">
                                        <span className="role-badge custom">Custom</span>
                                        <button className="role-action-btn edit" title="Edit role" onClick={() => openEditRole(role)}>
                                            <FaEdit />
                                        </button>
                                        <button className="role-action-btn delete" title="Delete role" onClick={() => setDeleteConfirm({ open: true, role })}>
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                                <p>{role.description || "Custom role"}</p>
                                <div className="role-perms">
                                    {(role.permissions || []).length === 0 && !Object.keys(role.entityPermissions || {}).length && (
                                        <span className="no-perms-hint">No modules assigned</span>
                                    )}
                                    {(role.permissions || []).map((perm) => {
                                        const mod = MODULES.find((m) => m.id === perm);
                                        return <span className="perm-chip" key={`${role.id}-${perm}`}>{mod?.label || perm}</span>;
                                    })}
                                </div>
                                {Object.keys(role.entityPermissions || {}).length > 0 && (
                                    <div className="role-entity-perms">
                                        {Object.entries(role.entityPermissions).map(([code, perms]) => {
                                            const activeModules = MODULES.filter((m) => perms[m.id]);
                                            return (
                                                <div className="role-entity-perm-row" key={code}>
                                                    <span className="perm-chip role-entity-code">{code}</span>
                                                    <div className="role-perms" style={{ flex: 1 }}>
                                                        {activeModules.length === 0
                                                            ? <span className="no-perms-hint">No access</span>
                                                            : activeModules.map((m) => (
                                                                <span className="perm-chip" key={`${role.id}-${code}-${m.id}`}>{m.label}</span>
                                                            ))
                                                        }
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}

                        {customRoles.length === 0 && (
                            <div className="no-custom-roles">
                                <FaShieldAlt />
                                <p>No custom roles yet.<br />Create one to define specific access levels.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ══ User Drawer ══════════════════════════════════ */}
            {userDrawerOpen && (
                <>
                    <div className="drawer-overlay" onClick={() => setUserDrawerOpen(false)} />
                    <div className="drawer-panel">
                        <div className="drawer-header">
                            <h3>{editingUser ? "Edit User" : "Add User"}</h3>
                            <button className="drawer-close-btn" onClick={() => setUserDrawerOpen(false)}><FaTimes /></button>
                        </div>
                        <div className="drawer-body">
                            <div className="ur-section-title">Identity</div>
                            <div className="form-group">
                                <label>Full Name <span className="required-star">*</span></label>
                                <input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="Full name" />
                            </div>
                            <div className="form-group">
                                <label>Email Address <span className="required-star">*</span></label>
                                <input type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} placeholder="email@company.com" />
                            </div>

                            <div className="ur-divider" />
                            <div className="ur-section-title">Role &amp; Status</div>
                            <div className="ur-row">
                                <div className="form-group">
                                    <label>Role <span className="required-star">*</span></label>
                                    <select value={formData.role} onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}>
                                        <optgroup label="Built-in Roles">
                                            {BUILT_IN_ROLES.map((r) => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </optgroup>
                                        {customRoles.length > 0 && (
                                            <optgroup label="Custom Roles">
                                                {customRoles.map((r) => (
                                                    <option key={r.id} value={r.name}>{r.name}</option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={formData.status} onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="ur-divider" />
                            <div className="ur-section-title">Entity Access</div>
                            <div className="entity-checkbox-grid">
                                {entities.map((entity) => (
                                    <label key={entity.code} className={`entity-checkbox-item ${formData.allowedEntities.includes(entity.code) ? "selected" : ""}`}>
                                        <input type="checkbox" checked={formData.allowedEntities.includes(entity.code)} onChange={() => toggleEntity(entity.code)} />
                                        <span className="entity-check-label">
                                            <strong>{entity.code}</strong>
                                            <small>{entity.name}</small>
                                        </span>
                                    </label>
                                ))}
                                {entities.length === 0 && <span className="ur-hint">No entities configured.</span>}
                            </div>

                            {formData.allowedEntities.length > 0 && (
                                <>
                                    <div className="ur-divider" />
                                    <div className="ur-section-title">Module Permissions</div>
                                    {formData.allowedEntities.map((code) => {
                                        const entityObj = entities.find((e) => e.code === code);
                                        return (
                                            <div className="entity-perm-block" key={code}>
                                                <div className="entity-perm-title">
                                                    <span className="perm-chip">{code}</span>
                                                    {entityObj?.name && <span className="entity-perm-name">{entityObj.name}</span>}
                                                </div>
                                                <div className="module-perm-grid">
                                                    {MODULES.map((mod) => {
                                                        const Icon = mod.icon;
                                                        const checked = Boolean(formData.entityPermissions?.[code]?.[mod.id]);
                                                        return (
                                                            <label key={mod.id} className={`module-perm-toggle ${checked ? "on" : ""}`}>
                                                                <input type="checkbox" checked={checked} onChange={() => toggleModulePerm(code, mod.id)} />
                                                                <Icon className="module-perm-icon" />
                                                                <span>{mod.label}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}

                            <div className="ur-divider" />
                            <div className="ur-section-title">Security</div>
                            <div className="form-group">
                                <label>{editingUser ? "Reset Password (optional)" : "Temporary Password *"}</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                                    placeholder={editingUser ? "Leave blank to keep current" : "Set a temporary password"}
                                />
                            </div>
                        </div>
                        <div className="drawer-footer">
                            <Button variant="ghost" onClick={() => setUserDrawerOpen(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleSaveUser}>
                                {editingUser ? "Save Changes" : "Add User"}
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* ══ Role Drawer ══════════════════════════════════ */}
            {roleDrawerOpen && (
                <>
                    <div className="drawer-overlay" onClick={() => setRoleDrawerOpen(false)} />
                    <div className="drawer-panel role-drawer">
                        <div className="drawer-header">
                            <div className="drawer-header-left">
                                <FaShieldAlt className="drawer-header-icon" />
                                <h3>{editingRole ? "Edit Role" : "Create Custom Role"}</h3>
                            </div>
                            <button className="drawer-close-btn" onClick={() => setRoleDrawerOpen(false)}><FaTimes /></button>
                        </div>
                        <div className="drawer-body">
                            <div className="ur-section-title">Role Details</div>
                            <div className="form-group">
                                <label>Role Name <span className="required-star">*</span></label>
                                <input value={roleForm.name} onChange={(e) => setRoleForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Procurement Manager" />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    className="role-textarea"
                                    value={roleForm.description}
                                    onChange={(e) => setRoleForm((p) => ({ ...p, description: e.target.value }))}
                                    placeholder="What can this role access? (optional)"
                                    rows={2}
                                />
                            </div>

                            <div className="ur-divider" />
                            <div className="ur-section-title">
                                Module Access
                                <span className="ur-section-count">{roleForm.permissions.length}/{MODULES.length} selected</span>
                            </div>
                            <div className="role-module-grid">
                                {MODULES.map((mod) => {
                                    const Icon = mod.icon;
                                    const active = roleForm.permissions.includes(mod.id);
                                    return (
                                        <button key={mod.id} type="button" className={`role-module-tile ${active ? "active" : ""}`} onClick={() => toggleRolePerm(mod.id)}>
                                            <Icon className="role-module-icon" />
                                            <span>{mod.label}</span>
                                            {active && <span className="role-module-check">✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="role-module-actions">
                                <button type="button" className="ur-text-btn" onClick={() => setRoleForm((p) => ({ ...p, permissions: MODULES.map((m) => m.id) }))}>Select All</button>
                                <button type="button" className="ur-text-btn" onClick={() => setRoleForm((p) => ({ ...p, permissions: [] }))}>Clear All</button>
                            </div>

                            {roleForm.permissions.length > 0 && (
                                <div className="role-perm-preview">
                                    <div className="ur-section-title" style={{ marginBottom: 8 }}>Global Access Summary</div>
                                    <div className="role-perms">
                                        {roleForm.permissions.map((pid) => {
                                            const mod = MODULES.find((m) => m.id === pid);
                                            return <span key={pid} className="perm-chip">{mod?.label || pid}</span>;
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="ur-divider" />
                            <div className="ur-section-title">
                                Entity-wise Permissions
                                <span className="ur-section-count">{Object.keys(roleForm.entityPermissions).length} entities</span>
                            </div>
                            <p className="ur-hint" style={{ marginTop: 0 }}>
                                Select entities and override module access per entity. Leave unselected to inherit global permissions.
                            </p>
                            <div className="entity-checkbox-grid">
                                {entities.map((entity) => {
                                    const isSelected = Boolean(roleForm.entityPermissions[entity.code]);
                                    return (
                                        <label key={entity.code} className={`entity-checkbox-item ${isSelected ? "selected" : ""}`}>
                                            <input type="checkbox" checked={isSelected} onChange={() => toggleRoleEntity(entity.code)} />
                                            <span className="entity-check-label">
                                                <strong>{entity.code}</strong>
                                                <small>{entity.name}</small>
                                            </span>
                                        </label>
                                    );
                                })}
                                {entities.length === 0 && <span className="ur-hint">No entities configured.</span>}
                            </div>

                            {Object.keys(roleForm.entityPermissions).map((code) => {
                                const entityObj = entities.find((e) => e.code === code);
                                return (
                                    <div className="entity-perm-block" key={code}>
                                        <div className="entity-perm-title">
                                            <span className="perm-chip">{code}</span>
                                            {entityObj?.name && <span className="entity-perm-name">{entityObj.name}</span>}
                                        </div>
                                        <div className="module-perm-grid">
                                            {MODULES.map((mod) => {
                                                const Icon = mod.icon;
                                                const checked = Boolean(roleForm.entityPermissions[code]?.[mod.id]);
                                                return (
                                                    <label key={mod.id} className={`module-perm-toggle ${checked ? "on" : ""}`}>
                                                        <input type="checkbox" checked={checked} onChange={() => toggleRoleEntityModule(code, mod.id)} />
                                                        <Icon className="module-perm-icon" />
                                                        <span>{mod.label}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="drawer-footer">
                            <Button variant="ghost" onClick={() => setRoleDrawerOpen(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleSaveRole}>
                                {editingRole ? "Save Changes" : "Create Role"}
                            </Button>
                        </div>
                    </div>
                </>
            )}

            <ConfirmDialog
                open={deleteConfirm.open}
                title="Delete Role"
                message={`Are you sure you want to delete "${deleteConfirm.role?.name}"? Users assigned to this role will need to be reassigned.`}
                confirmText="Delete"
                variant="danger"
                onConfirm={handleDeleteRole}
                onCancel={() => setDeleteConfirm({ open: false, role: null })}
            />
        </div>
    );
}
