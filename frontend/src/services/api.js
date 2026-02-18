const resolvedHost = window.location.hostname || "localhost";
const BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    `http://${resolvedHost}:5000/api`;

const handleResponse = async (res) => {
    if (res.status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        if (!window.location.pathname.includes("/login")) {
            window.location.reload(); // Force refresh to redirect via guard or layout
        }
    }
    if (!res.ok) {
        let errorMessage = "API request failed";
        try {
            const text = await res.text();
            try {
                const json = JSON.parse(text);
                errorMessage = json.error || json.message || errorMessage;
            } catch {
                // Use raw text if not JSON (e.g. HTML error page), truncated
                errorMessage = `Error ${res.status}: ${text.slice(0, 100).replace(/<[^>]*>/g, "")}`;
            }
        } catch {
            errorMessage = `Error ${res.status}`;
        }
        throw new Error(errorMessage);
    }
    return res.json();
};

const getAuthToken = () => {
    return (
        localStorage.getItem("authToken") ||
        localStorage.getItem("token") ||
        ""
    );
};

const normalizeEntityCode = (entityCode) => {
    if (!entityCode) return null;
    const cleaned = String(entityCode).trim();
    if (!cleaned) return null;
    if (cleaned.toUpperCase() === "ALL" || cleaned.toUpperCase() === "ALL ENTITIES") {
        return null;
    }
    return cleaned;
};

const buildHeaders = (entityCode, extra = {}) => ({
    ...extra,
    ...(normalizeEntityCode(entityCode) ? { "X-Entity-Code": normalizeEntityCode(entityCode) } : {}),
    ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {})
});

const api = {
    // --- LOCATIONS ---
    getLocations: async (entityCode) => handleResponse(await fetch(`${BASE_URL}/locations`, {
        headers: buildHeaders(entityCode)
    })),
    getLocationsCommon: async () => handleResponse(await fetch(`${BASE_URL}/locations`, {
        headers: buildHeaders()
    })),
    addLocation: async (location, entityCode) => {
        return handleResponse(await fetch(`${BASE_URL}/locations`, {
            method: "POST",
            headers: buildHeaders(entityCode, { "Content-Type": "application/json" }),
            body: JSON.stringify(location),
        }));
    },
    addLocationCommon: async (location) => {
        return handleResponse(await fetch(`${BASE_URL}/locations`, {
            method: "POST",
            headers: buildHeaders(null, { "Content-Type": "application/json" }),
            body: JSON.stringify(location),
        }));
    },
    updateLocationCommon: async (id, location) => {
        return handleResponse(await fetch(`${BASE_URL}/locations/${id}`, {
            method: "PUT",
            headers: buildHeaders(null, { "Content-Type": "application/json" }),
            body: JSON.stringify(location),
        }));
    },
    deleteLocationCommon: async (id) => {
        return handleResponse(await fetch(`${BASE_URL}/locations/${id}`, {
            method: "DELETE",
            headers: buildHeaders()
        }));
    },

    // --- DEPARTMENTS ---
    getDepartments: async (entityCode) => handleResponse(await fetch(`${BASE_URL}/departments`, {
        headers: buildHeaders(entityCode)
    })),
    getDepartmentsCommon: async () => handleResponse(await fetch(`${BASE_URL}/departments`, {
        headers: buildHeaders()
    })),
    addDepartment: async (department, entityCode) => {
        return handleResponse(await fetch(`${BASE_URL}/departments`, {
            method: "POST",
            headers: buildHeaders(entityCode, { "Content-Type": "application/json" }),
            body: JSON.stringify(department),
        }));
    },
    addDepartmentCommon: async (department) => {
        return handleResponse(await fetch(`${BASE_URL}/departments`, {
            method: "POST",
            headers: buildHeaders(null, { "Content-Type": "application/json" }),
            body: JSON.stringify(department),
        }));
    },
    updateDepartmentCommon: async (id, department) => {
        return handleResponse(await fetch(`${BASE_URL}/departments/${id}`, {
            method: "PUT",
            headers: buildHeaders(null, { "Content-Type": "application/json" }),
            body: JSON.stringify(department),
        }));
    },
    deleteDepartmentCommon: async (id) => {
        return handleResponse(await fetch(`${BASE_URL}/departments/${id}`, {
            method: "DELETE",
            headers: buildHeaders()
        }));
    },

    // --- ASSETS ---
    getAssets: async (entityCode) => handleResponse(await fetch(`${BASE_URL}/assets`, {
        headers: buildHeaders(entityCode)
    })),
    exportAssets: async (entityCode, format = "csv") => {
        const res = await fetch(`${BASE_URL}/assets/export?format=${format}`, {
            headers: buildHeaders(entityCode)
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Export failed");
        }
        return res.blob();
    },
    importAssets: async (file, entityCode) => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${BASE_URL}/assets/import`, {
            method: "POST",
            headers: buildHeaders(entityCode),
            body: formData
        });
        return handleResponse(res);
    },
    addAsset: async (asset, entityCode) => {
        return handleResponse(await fetch(`${BASE_URL}/assets`, {
            method: "POST",
            headers: buildHeaders(entityCode, { "Content-Type": "application/json" }),
            body: JSON.stringify(asset),
        }));
    },
    updateAsset: async (id, updates, entityCode) => {
        return handleResponse(await fetch(`${BASE_URL}/assets/${id}`, {
            method: "PUT",
            headers: buildHeaders(entityCode, { "Content-Type": "application/json" }),
            body: JSON.stringify(updates),
        }));
    },
    deleteAsset: async (id, entityCode) => {
        return handleResponse(await fetch(`${BASE_URL}/assets/${id}`, {
            method: "DELETE",
            headers: buildHeaders(entityCode)
        }));
    },

    // --- ASSET CATEGORIES ---
    getAssetCategories: async (entityCode) => handleResponse(await fetch(`${BASE_URL}/asset-categories`, {
        headers: buildHeaders(entityCode)
    })),
    getAssetCategoriesCommon: async () => handleResponse(await fetch(`${BASE_URL}/asset-categories`, {
        headers: buildHeaders()
    })),
    addAssetCategory: async (category, entityCode) => {
        return handleResponse(await fetch(`${BASE_URL}/asset-categories`, {
            method: "POST",
            headers: buildHeaders(entityCode, { "Content-Type": "application/json" }),
            body: JSON.stringify(category),
        }));
    },
    addAssetCategoryCommon: async (category) => {
        return handleResponse(await fetch(`${BASE_URL}/asset-categories`, {
            method: "POST",
            headers: buildHeaders(null, { "Content-Type": "application/json" }),
            body: JSON.stringify(category),
        }));
    },
    updateAssetCategoryCommon: async (id, category) => {
        return handleResponse(await fetch(`${BASE_URL}/asset-categories/${id}`, {
            method: "PUT",
            headers: buildHeaders(null, { "Content-Type": "application/json" }),
            body: JSON.stringify(category),
        }));
    },
    deleteAssetCategoryCommon: async (id) => {
        return handleResponse(await fetch(`${BASE_URL}/asset-categories/${id}`, {
            method: "DELETE",
            headers: buildHeaders()
        }));
    },

    // --- USERS ---
    getUsers: async () => handleResponse(await fetch(`${BASE_URL}/users`, {
        headers: buildHeaders()
    })),
    addUser: async (user) => {
        return handleResponse(await fetch(`${BASE_URL}/users`, {
            method: "POST",
            headers: buildHeaders(null, { "Content-Type": "application/json" }),
            body: JSON.stringify(user),
        }));
    },
    updateUser: async (id, updates) => {
        return handleResponse(await fetch(`${BASE_URL}/users/${id}`, {
            method: "PUT",
            headers: buildHeaders(null, { "Content-Type": "application/json" }),
            body: JSON.stringify(updates),
        }));
    },

    // --- ROLES ---
    getRoles: async () => handleResponse(await fetch(`${BASE_URL}/roles`, {
        headers: buildHeaders()
    })),
    addRole: async (role) => {
        return handleResponse(await fetch(`${BASE_URL}/roles`, {
            method: "POST",
            headers: buildHeaders(null, { "Content-Type": "application/json" }),
            body: JSON.stringify(role),
        }));
    },
    updateRole: async (id, role) => {
        return handleResponse(await fetch(`${BASE_URL}/roles/${id}`, {
            method: "PUT",
            headers: buildHeaders(null, { "Content-Type": "application/json" }),
            body: JSON.stringify(role),
        }));
    },
    deleteRole: async (id) => {
        return handleResponse(await fetch(`${BASE_URL}/roles/${id}`, {
            method: "DELETE",
            headers: buildHeaders()
        }));
    },

    // --- EMPLOYEES ---
    getEmployees: async (entityCode) => handleResponse(await fetch(`${BASE_URL}/employees`, {
        headers: buildHeaders(entityCode)
    })),
    addEmployee: async (employee, entityCode) => {
        return handleResponse(await fetch(`${BASE_URL}/employees`, {
            method: "POST",
            headers: buildHeaders(entityCode, { "Content-Type": "application/json" }),
            body: JSON.stringify(employee),
        }));
    },
    updateEmployee: async (id, updates, entityCode) => {
        return handleResponse(await fetch(`${BASE_URL}/employees/${id}`, {
            method: "PUT",
            headers: buildHeaders(entityCode, { "Content-Type": "application/json" }),
            body: JSON.stringify(updates),
        }));
    },
    deleteEmployee: async (id, entityCode) => {
        return handleResponse(await fetch(`${BASE_URL}/employees/${id}`, {
            method: "DELETE",
            headers: buildHeaders(entityCode)
        }));
    },
    exportEmployees: async (entityCode) => {
        const res = await fetch(`${BASE_URL}/employees/export`, {
            headers: buildHeaders(entityCode)
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Export failed");
        }
        return res.blob();
    },
    importEmployees: async (file, entityCode) => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${BASE_URL}/employees/import`, {
            method: "POST",
            headers: buildHeaders(entityCode),
            body: formData
        });
        return handleResponse(res);
    },

    // --- ORGANIZATION ---
    getOrganization: async () => handleResponse(await fetch(`${BASE_URL}/organization`, {
        headers: buildHeaders()
    })),
    updateOrganization: async (data) => {
        return handleResponse(await fetch(`${BASE_URL}/organization`, {
            method: "POST",
            headers: buildHeaders(null, { "Content-Type": "application/json" }),
            body: JSON.stringify(data),
        }));
    },

    // --- ENTITIES ---
    getEntities: async () => handleResponse(await fetch(`${BASE_URL}/entities`, {
        headers: buildHeaders()
    })),
    addEntity: async (entity) => {
        return handleResponse(await fetch(`${BASE_URL}/entities`, {
            method: "POST",
            headers: buildHeaders(null, { "Content-Type": "application/json" }),
            body: JSON.stringify(entity),
        }));
    },
    updateEntity: async (id, entity) => {
        return handleResponse(await fetch(`${BASE_URL}/entities/${id}`, {
            method: "PUT",
            headers: buildHeaders(null, { "Content-Type": "application/json" }),
            body: JSON.stringify(entity),
        }));
    },
    deleteEntity: async (id) => {
        return handleResponse(await fetch(`${BASE_URL}/entities/${id}`, {
            method: "DELETE",
            headers: buildHeaders()
        }));
    },

    // --- NOTIFICATIONS ---
    getNotifications: async () => handleResponse(await fetch(`${BASE_URL}/notifications`, {
        headers: buildHeaders()
    })),
    updateNotifications: async (data) => {
        return handleResponse(await fetch(`${BASE_URL}/notifications`, {
            method: "POST",
            headers: buildHeaders(null, { "Content-Type": "application/json" }),
            body: JSON.stringify(data),
        }));
    },

    // --- EMAIL SETTINGS ---
    getEmailSettings: async (entityCode) => handleResponse(await fetch(`${BASE_URL}/email-settings`, {
        headers: buildHeaders(entityCode)
    })),
    updateEmailSettings: async (data, entityCode) => {
        return handleResponse(await fetch(`${BASE_URL}/email-settings`, {
            method: "POST",
            headers: buildHeaders(entityCode, { "Content-Type": "application/json" }),
            body: JSON.stringify(data),
        }));
    },

    // --- SYSTEM PREFERENCES ---
    getSystemPreferences: async () => handleResponse(await fetch(`${BASE_URL}/system-preferences`, {
        headers: buildHeaders()
    })),
    updateSystemPreferences: async (data) => {
        return handleResponse(await fetch(`${BASE_URL}/system-preferences`, {
            method: "POST",
            headers: buildHeaders(null, { "Content-Type": "application/json" }),
            body: JSON.stringify(data),
        }));
    },

    // --- BACKUPS ---
    runBackup: async (data) => {
        return handleResponse(await fetch(`${BASE_URL}/backups/run`, {
            method: "POST",
            headers: buildHeaders(null, { "Content-Type": "application/json" }),
            body: JSON.stringify(data || {}),
        }));
    },
    getBackups: async () => handleResponse(await fetch(`${BASE_URL}/backups`, {
        headers: buildHeaders()
    })),
    deleteBackup: async (filename) => {
        return handleResponse(await fetch(`${BASE_URL}/backups/${encodeURIComponent(filename)}`, {
            method: "DELETE",
            headers: buildHeaders()
        }));
    },

    // --- AUDIT ---
    getAuditLogs: async () => handleResponse(await fetch(`${BASE_URL}/params/audit`, {
        headers: buildHeaders()
    })),

    // --- ALERT RULES ---
    getAlertRules: async () => handleResponse(await fetch(`${BASE_URL}/alert-rules`, {
        headers: buildHeaders()
    })),
    createAlertRule: async (data) => {
        return handleResponse(await fetch(`${BASE_URL}/alert-rules`, {
            method: "POST",
            headers: buildHeaders(null, { "Content-Type": "application/json" }),
            body: JSON.stringify(data),
        }));
    },
    updateAlertRule: async (id, data) => {
        return handleResponse(await fetch(`${BASE_URL}/alert-rules/${id}`, {
            method: "PUT",
            headers: buildHeaders(null, { "Content-Type": "application/json" }),
            body: JSON.stringify(data),
        }));
    },
    deleteAlertRule: async (id) => {
        return handleResponse(await fetch(`${BASE_URL}/alert-rules/${id}`, {
            method: "DELETE",
            headers: buildHeaders()
        }));
    },

    // --- LICENSES ---
    getLicenses: async (entityCode) => handleResponse(await fetch(`${BASE_URL}/licenses`, {
        headers: buildHeaders(entityCode)
    })),
    addLicense: async (license, entityCode) => {
        return handleResponse(await fetch(`${BASE_URL}/licenses`, {
            method: "POST",
            headers: buildHeaders(entityCode, { "Content-Type": "application/json" }),
            body: JSON.stringify(license),
        }));
    },

    // --- SOFTWARE INVENTORY ---
    getSoftwareInventory: async (entityCode) => handleResponse(await fetch(`${BASE_URL}/software`, {
        headers: buildHeaders(entityCode)
    })),
    addSoftwareLicense: async (payload, entityCode) => {
        return handleResponse(await fetch(`${BASE_URL}/software/licenses`, {
            method: "POST",
            headers: buildHeaders(entityCode, { "Content-Type": "application/json" }),
            body: JSON.stringify(payload),
        }));
    },
    updateSoftwareLicense: async (id, payload, entityCode) => {
        return handleResponse(await fetch(`${BASE_URL}/software/licenses/${id}`, {
            method: "PUT",
            headers: buildHeaders(entityCode, { "Content-Type": "application/json" }),
            body: JSON.stringify(payload),
        }));
    },
    addSoftwareAssignment: async (payload, entityCode) => {
        return handleResponse(await fetch(`${BASE_URL}/software/assignments`, {
            method: "POST",
            headers: buildHeaders(entityCode, { "Content-Type": "application/json" }),
            body: JSON.stringify(payload),
        }));
    },
    updateSoftwareAssignment: async (id, payload, entityCode) => {
        return handleResponse(await fetch(`${BASE_URL}/software/assignments/${id}`, {
            method: "PUT",
            headers: buildHeaders(entityCode, { "Content-Type": "application/json" }),
            body: JSON.stringify(payload),
        }));
    },
    deleteSoftwareLicense: async (id, entityCode) => {
        return handleResponse(await fetch(`${BASE_URL}/software/licenses/${id}`, {
            method: "DELETE",
            headers: buildHeaders(entityCode)
        }));
    },
    deleteSoftwareAssignment: async (id, entityCode) => {
        return handleResponse(await fetch(`${BASE_URL}/software/assignments/${id}`, {
            method: "DELETE",
            headers: buildHeaders(entityCode)
        }));
    },

    // --- PROFILE ---
    updateProfile: async (data) => {
        return handleResponse(await fetch(`${BASE_URL}/users/profile`, {
            method: "PUT",
            headers: buildHeaders(null, { "Content-Type": "application/json" }),
            body: JSON.stringify(data),
        }));
    },

    // --- AUTH ---
    login: async (payload) => handleResponse(await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: buildHeaders(null, { "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
    })),

    // --- AI ENGINE ---
    getAIInsights: async (entityCode) => handleResponse(await fetch(`${BASE_URL}/ai/insights`, {
        headers: buildHeaders(entityCode)
    })),
    getHealthScores: async (entityCode) => handleResponse(await fetch(`${BASE_URL}/ai/health`, {
        headers: buildHeaders(entityCode)
    })),
    smartSearch: async (query, entityCode) => {
        return handleResponse(await fetch(`${BASE_URL}/ai/search`, {
            method: "POST",
            headers: buildHeaders(entityCode, { "Content-Type": "application/json" }),
            body: JSON.stringify({ query }),
        }));
    },
    getAnomalies: async (entityCode) => handleResponse(await fetch(`${BASE_URL}/ai/anomalies`, {
        headers: buildHeaders(entityCode)
    })),
    getBudgetForecast: async (entityCode) => handleResponse(await fetch(`${BASE_URL}/ai/forecast`, {
        headers: buildHeaders(entityCode)
    })),
    autoCategorizeBulk: async (names, entityCode) => {
        return handleResponse(await fetch(`${BASE_URL}/ai/categorize`, {
            method: "POST",
            headers: buildHeaders(entityCode, { "Content-Type": "application/json" }),
            body: JSON.stringify({ names }),
        }));
    },
    getAllocationSuggestions: async (employeeId, entityCode) => handleResponse(await fetch(`${BASE_URL}/ai/suggest-allocation/${employeeId}`, {
        headers: buildHeaders(entityCode)
    }))
};

export default api;
