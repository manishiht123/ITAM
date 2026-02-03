import { FaBell, FaArrowLeft, FaChevronDown, FaUserCircle, FaKey, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useEntity } from "../../context/EntityContext";
import { getEntityLogo } from "../../config/entityLogos";
//import { useTheme } from "../../context/ThemeContext";
import "../../styles/topbar.css";

export default function Topbar({ theme, toggleTheme }) {
  const { entity, setEntity } = useEntity();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const getUserName = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("authUser") || "{}");
      return stored?.name || stored?.email || "User";
    } catch (err) {
      return "User";
    }
  };
  const [userName, setUserName] = useState(getUserName);

  useEffect(() => {
    const handler = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const syncUser = () => setUserName(getUserName());
    window.addEventListener("storage", syncUser);
    window.addEventListener("authUserUpdated", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("authUserUpdated", syncUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <header className="topbar">
      {/* LEFT : LOGO */}
      <div className="topbar-left">
        <button className="icon-btn" onClick={() => navigate(-1)} title="Go Back">
          <FaArrowLeft />
        </button>
        <img
          src={getEntityLogo(entity)}
          alt={`${entity} logo`}
          className="topbar-logo"
        />
        <span className="product-name"></span>
      </div>

      {/* RIGHT : ACTIONS */}
      <div className="topbar-right">
        {/* ENTITY SWITCHER */}
        <select
          className="entity-switcher"
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
        >
          <option value="ALL">All Entities</option>
          <option value="OFB">OFB</option>
          <option value="OXYZO">OXYZO</option>
        </select>

        {/* THEME */}
        {toggleTheme && (
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        )}

        {/* NOTIFICATIONS */}
        <button className="icon-btn">
          <FaBell />
        </button>

        {/* USER */}
        <div className="user-menu" ref={menuRef}>
          <button
            className="user-trigger"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span className="user-avatar">
              {userName?.charAt(0)?.toUpperCase() || "U"}
            </span>
            <span className="user-name">{userName}</span>
            <FaChevronDown className={`user-caret ${menuOpen ? "open" : ""}`} />
          </button>

          {menuOpen && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">
                <FaUserCircle />
                <div>
                  <div className="user-dropdown-name">{userName}</div>
                  <div className="user-dropdown-sub">Account</div>
                </div>
              </div>
              <button
                className="user-dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/profile");
                }}
              >
                <FaUserCircle /> My Profile
              </button>
              <button
                className="user-dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/profile/password");
                }}
              >
                <FaKey /> Change Password
              </button>
              <button
                className="user-dropdown-item danger"
                onClick={handleLogout}
              >
                <FaSignOutAlt /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
