import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBoxOpen,
  FaUsers,
  FaCog,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaSignOutAlt,
  FaLayerGroup,
  FaRobot,
  FaSitemap,
  FaRecycle,
  FaStore,
  FaChartLine,
  FaExclamationTriangle,
  FaShieldAlt,
  FaTasks,
  FaPuzzlePiece,
  FaClipboardCheck
} from "react-icons/fa";

import "../../styles/sidebar.css";
import { useAuth } from "../../context/AuthContext";
import { useEntity } from "../../context/EntityContext";
import api from "../../services/api";
import ofbSidebarLogo from "../../assets/logos/default-dark.svg";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(window.innerWidth <= 768);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    const handleToggle = () => setCollapsed(prev => !prev);
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);
  const navigate = useNavigate();
  const { user, isAdmin, canAccess, hasRole } = useAuth();
  const { entity } = useEntity();

  // Fetch pending approval count for managers/admins
  useEffect(() => {
    if (!isAdmin && !hasRole("manager")) return;
    api.getPendingApprovalCount(entity)
      .then((r) => setPendingApprovals(r?.count || 0))
      .catch(() => {});
  }, [entity, isAdmin]);

  const userName = user?.name || user?.email || "User";
  const roleLabel = isAdmin
    ? "Administrator"
    : (user?.role || "User").charAt(0).toUpperCase() + (user?.role || "user").slice(1);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const showAssets = isAdmin || canAccess("assets");
  const showEmployees = isAdmin || canAccess("employees");
  const showReports = isAdmin || canAccess("reports");
  const showSettings = isAdmin;

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* ================= HEADER ================= */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          {!collapsed && (
            <img src={ofbSidebarLogo} alt="OFBusiness" className="sidebar-logo-img" />
          )}
        </div>
        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>

      {!collapsed && (
        <div className="sidebar-user-info">
          <span className="sidebar-user-avatar">
            {userName?.charAt(0)?.toUpperCase() || "U"}
          </span>
          <div className="sidebar-user-details">
            <span className="sidebar-user-name">{userName}</span>
            <span className="sidebar-user-role">{roleLabel}</span>
          </div>
        </div>
      )}

      {/* ================= MENU ================= */}
      <nav className="sidebar-menu">
        <NavLink to="/dashboard" className="menu-item">
          <FaTachometerAlt />
          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        {showAssets && (
          <NavLink to="/assets" className="menu-item">
            <FaBoxOpen />
            {!collapsed && <span>Assets</span>}
          </NavLink>
        )}

        {showAssets && (
          <NavLink to="/software" className="menu-item">
            <FaLayerGroup />
            {!collapsed && <span>Software</span>}
          </NavLink>
        )}

        {showEmployees && (
          <NavLink to="/employees" className="menu-item">
            <FaUsers />
            {!collapsed && <span>Employees</span>}
          </NavLink>
        )}

        {showAssets && (
          <NavLink to="/assets/disposals" className="menu-item">
            <FaRecycle />
            {!collapsed && <span>Disposals</span>}
          </NavLink>
        )}

        {showAssets && (
          <NavLink to="/assets/depreciation" className="menu-item">
            <FaChartLine />
            {!collapsed && <span>Depreciation</span>}
          </NavLink>
        )}

        {showAssets && (
          <NavLink to="/assets/faulty-report" className="menu-item">
            <FaExclamationTriangle />
            {!collapsed && <span>Faulty Assets</span>}
          </NavLink>
        )}

        <NavLink to="/approvals" className="menu-item" style={{ position: "relative" }}>
          <FaTasks />
          {!collapsed && (
            <span>
              Approvals
              {pendingApprovals > 0 && (
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  minWidth: "18px", height: "18px", padding: "0 5px", borderRadius: "9px",
                  fontSize: "10px", fontWeight: 700, background: "var(--danger)", color: "#fff",
                  marginLeft: "6px", lineHeight: 1
                }}>{pendingApprovals}</span>
              )}
            </span>
          )}
          {collapsed && pendingApprovals > 0 && (
            <span style={{
              position: "absolute", top: "6px", right: "6px",
              minWidth: "14px", height: "14px", borderRadius: "7px",
              fontSize: "9px", fontWeight: 700, background: "var(--danger)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px"
            }}>{pendingApprovals}</span>
          )}
        </NavLink>
        

        {showAssets && (
          <NavLink to="/assets/warranty-alerts" className="menu-item">
            <FaShieldAlt />
            {!collapsed && <span>Warranty Alerts</span>}
          </NavLink>
        )}

        {showAssets && (
          <NavLink to="/assets/audit" className="menu-item">
            <FaClipboardCheck />
            {!collapsed && <span>Physical Audit</span>}
          </NavLink>
        )}

        {showAssets && (
          <NavLink to="/org-settings" className="menu-item">
            <FaSitemap />
            {!collapsed && <span>Configuration</span>}
          </NavLink>
        )}

        <NavLink to="/ai-intelligence" className="menu-item ai-menu-item">
          <FaRobot />
          {!collapsed && <span>AI Intelligence</span>}
        </NavLink>

        {/* ========== SETTINGS (admin only) ========== */}
        {showSettings && (
          <>
            <div
              className={`menu-item settings ${settingsOpen ? "open" : ""}`}
              onClick={() => setSettingsOpen(!settingsOpen)}
            >
              <FaCog />
              {!collapsed && <span>Settings</span>}
              {!collapsed && <FaChevronDown className="chevron" />}
            </div>

            {!collapsed && settingsOpen && (
              <div className="submenu">
                <NavLink to="/settings/entities">Organization & Entities</NavLink>
                <NavLink to="/settings/users">Users & Roles</NavLink>
                <NavLink to="/settings/asset-config">Asset Configuration</NavLink>
                <NavLink to="/settings/licenses">Licenses & Compliance</NavLink>
                <NavLink to="/settings/assignments">Assignments & Ownership</NavLink>
                <NavLink to="/settings/notifications">Notifications</NavLink>
                <NavLink to="/settings/security">Security & Audit</NavLink>
                <NavLink to="/settings/reports">Reports & Scheduling</NavLink>
                <NavLink to="/settings/system">System Preferences</NavLink>
                <NavLink to="/settings/password">Password Policy</NavLink>
                <NavLink to="/settings/backup">Backup &amp; Restore</NavLink>
                <NavLink to="/settings/vendors">
                  <FaStore style={{ marginRight: 6, fontSize: 11 }} />Vendors
                </NavLink>
                <NavLink to="/settings/custom-fields">
                  <FaPuzzlePiece style={{ marginRight: 6, fontSize: 11 }} />Custom Fields
                </NavLink>
              </div>
            )}
          </>
        )}

        {/* Reports link for managers/auditors (non-admin) */}
        {!isAdmin && showReports && (
          <NavLink to="/settings/reports" className="menu-item">
            <FaCog />
            {!collapsed && <span>Reports</span>}
          </NavLink>
        )}
      </nav>

      {/* ================= FOOTER ================= */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
