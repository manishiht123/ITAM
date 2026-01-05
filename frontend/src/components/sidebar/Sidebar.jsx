import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBoxOpen,
  FaUsers,
  FaCog,
  FaChevronDown,
  FaSignOutAlt,
  FaBars
} from "react-icons/fa";

import "../../styles/sidebar.css";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* ================= HEADER ================= */}
      <div className="sidebar-header">
        <div className="entity-name">
          {!collapsed ? "OfBusiness" : "ITAM"}
        </div>

        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          <FaBars />
        </button>
      </div>

      {/* ================= MENU ================= */}
      <nav className="sidebar-menu">
        <NavLink to="/dashboard" className="menu-item">
          <FaTachometerAlt />
          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        <NavLink to="/assets" className="menu-item">
          <FaBoxOpen />
          {!collapsed && <span>Assets</span>}
        </NavLink>

        <NavLink to="/employees" className="menu-item">
          <FaUsers />
          {!collapsed && <span>Employees</span>}
        </NavLink>

        {/* ========== SETTINGS ========== */}
        <div
          className={`menu-item settings ${
            settingsOpen ? "open" : ""
          }`}
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
            <NavLink to="/settings/assets">Asset Configuration</NavLink>
            <NavLink to="/settings/licenses">Licenses & Compliance</NavLink>
            <NavLink to="/settings/assignments">Assignments & Ownership</NavLink>
            <NavLink to="/settings/notifications">Notifications</NavLink>
            <NavLink to="/settings/security">Security & Audit</NavLink>
            <NavLink to="/settings/finance">Financial Settings</NavLink>
            <NavLink to="/settings/system">System Preferences</NavLink>
          </div>
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

