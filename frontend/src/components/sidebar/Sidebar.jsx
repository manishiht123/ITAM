import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBoxOpen,
  FaTags,
  FaUsers,
  FaCog,
  FaChevronDown,
  FaSignOutAlt,
  FaBars,
  FaBuilding,
  FaLayerGroup
} from "react-icons/fa";

import "../../styles/sidebar.css";
import { FaLocationPin } from "react-icons/fa6";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const userName = useMemo(() => {
    try {
      const stored = localStorage.getItem("authUser");
      if (!stored) return "User";
      const user = JSON.parse(stored);
      return user.name || user.email || "User";
    } catch (err) {
      return "User";
    }
  }, []);

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

      {!collapsed && (
        <div className="sidebar-user-info">
          <span className="sidebar-user-avatar">
            {userName?.charAt(0)?.toUpperCase() || "U"}
          </span>
          <div className="sidebar-user-details">
            <span className="sidebar-user-name">{userName}</span>
            <span className="sidebar-user-role">Administrator</span>
          </div>
        </div>
      )}

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

        <NavLink to="/software" className="menu-item">
          <FaLayerGroup />
          {!collapsed && <span>Software</span>}
        </NavLink>

        <NavLink to="/employees" className="menu-item">
          <FaUsers />
          {!collapsed && <span>Employees</span>}
        </NavLink>

        <NavLink to="/departments" className="menu-item">
          <FaBuilding />
          {!collapsed && <span>Department</span>}
        </NavLink>

        <NavLink to="/locations" className="menu-item">
          <FaLocationPin />
          {!collapsed && <span>Locations</span>}
        </NavLink>

        <NavLink to="/asset-categories" className="menu-item">
          <FaTags />
          {!collapsed && <span>Asset Category</span>}
        </NavLink>  

        {/* ========== SETTINGS ========== */}
        <div
          className={`menu-item settings ${settingsOpen ? "open" : ""
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
            <NavLink to="/settings/licenses">Licenses & Compliance</NavLink>
            <NavLink to="/settings/assignments">Assignments & Ownership</NavLink>
            <NavLink to="/settings/notifications">Notifications</NavLink>
            <NavLink to="/settings/security">Security & Audit</NavLink>
            <NavLink to="/settings/reports">Reports</NavLink>
            <NavLink to="/settings/finance">Financial Settings</NavLink>
            <NavLink to="/settings/system">System Preferences</NavLink>
            <NavLink to="/settings/password">Password Policy</NavLink>
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
