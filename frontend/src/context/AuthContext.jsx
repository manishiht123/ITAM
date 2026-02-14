import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

const ADMIN_ROLES = ["admin", "superadmin", "administrator"];

const ROLE_DEFAULTS = {
  manager: ["assets", "employees", "reports"],
  auditor: ["reports"],
  employee: []
};

const readUser = () => {
  try {
    const stored = localStorage.getItem("authUser");
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readUser);

  const refresh = useCallback(() => setUser(readUser()), []);

  const role = String(user?.role || "").trim().toLowerCase();
  const isAdmin = ADMIN_ROLES.includes(role);

  const hasRole = useCallback(
    (...roles) => roles.map((r) => r.toLowerCase()).includes(role),
    [role]
  );

  const canAccess = useCallback(
    (module) => {
      if (isAdmin) return true;

      // Check actual entityPermissions from the user object
      const perms = user?.entityPermissions || {};
      const entities = Object.keys(perms);

      if (entities.length > 0) {
        // User has entity-level permissions configured — check if ANY entity grants this module
        return entities.some((entityCode) => {
          const entityPerms = perms[entityCode];
          return entityPerms && entityPerms[module] === true;
        });
      }

      // Fallback to role-based defaults if no entityPermissions configured
      const defaults = ROLE_DEFAULTS[role] || [];
      return defaults.includes(module);
    },
    [isAdmin, role, user?.entityPermissions]
  );

  return (
    <AuthContext.Provider value={{ user, role, isAdmin, hasRole, canAccess, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
