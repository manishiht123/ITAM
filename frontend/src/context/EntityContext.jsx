import { createContext, useContext, useState } from "react";

const EntityContext = createContext(null);

const getInitialEntity = () => {
  try {
    const stored = localStorage.getItem("authUser");
    if (!stored) return "ALL";
    const user = JSON.parse(stored);
    const role = String(user.role || "").trim().toLowerCase();
    if (["admin", "superadmin", "administrator"].includes(role)) return "ALL";
    const allowed = Array.isArray(user.allowedEntities) ? user.allowedEntities.filter(Boolean) : [];
    if (allowed.length === 1) return allowed[0];
    // Non-admin with multiple entities — default to first entity (not "ALL")
    // so X-Entity-Code header is always sent for non-admins
    if (allowed.length > 1) return allowed[0];
    return "ALL";
  } catch (err) {
    return "ALL";
  }
};

export const EntityProvider = ({ children }) => {
  const [entity, setEntity] = useState(getInitialEntity());

  return (
    <EntityContext.Provider value={{ entity, setEntity }}>
      {children}
    </EntityContext.Provider>
  );
};

export const useEntity = () => {
  const context = useContext(EntityContext);
  if (!context) {
    throw new Error("useEntity must be used within EntityProvider");
  }
  return context;
};
