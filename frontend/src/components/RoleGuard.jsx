import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleGuard({ module, adminOnly, children }) {
  const { isAdmin, canAccess } = useAuth();

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (module && !canAccess(module)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
