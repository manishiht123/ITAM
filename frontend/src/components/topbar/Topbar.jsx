import { FaBell, FaArrowLeft, FaChevronDown, FaUserCircle, FaKey, FaSignOutAlt, FaSun, FaMoon } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useEntity } from "../../context/EntityContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import api from "../../services/api";
import ofbLogo from "../../assets/logos/default.svg";
import ofbLogoDark from "../../assets/logos/default-dark.svg";
import { getEntityLogoForTheme } from "../../config/entityLogos";
import "../../styles/topbar.css";

export default function Topbar() {
  const { theme, setTheme } = useTheme();
  const { entity, setEntity } = useEntity();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const getUserName = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("authUser") || "{}");
      return stored?.name || stored?.email || "User";
    } catch (err) {
      return "User";
    }
  };
  const [userName, setUserName] = useState(getUserName);
  const [entityList, setEntityList] = useState([]);

  // Load entities for the switcher
  useEffect(() => {
    console.log("[Topbar] Fetching entities...");
    api.getEntities()
      .then((data) => {
        console.log("[Topbar] Entities received:", data.length);
        setEntityList(data || []);
      })
      .catch((err) => {
        console.error("[Topbar] Failed to fetch entities:", err);
        setEntityList([]);
      });
  }, []);

  // Determine which entities the user can see
  const allowedEntities = isAdmin
    ? entityList
    : entityList.filter((e) =>
      (user?.allowedEntities || []).includes(e.code)
    );

  useEffect(() => {
    const handler = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Use AI engine to act as notification source
  useEffect(() => {
    if (!entity) return;

    const loadNotifications = async () => {
      try {
        const [anomaliesRes, healthRes] = await Promise.allSettled([
          api.getAnomalies(entity),
          api.getHealthScores(entity)
        ]);

        const newNotifs = [];

        // 1. Health Alerts
        if (healthRes.status === "fulfilled" && healthRes.value?.summary) {
          const { replacementNeeded, averageScore } = healthRes.value.summary;
          if (replacementNeeded > 0) {
            newNotifs.push({
              id: "health-replace",
              title: "Assets Need Replacement",
              desc: `${replacementNeeded} assets are critical and need replacement.`,
              severity: "critical",
              time: "Action Required"
            });
          }
          if (averageScore < 50) {
            newNotifs.push({
              id: "health-score",
              title: "Low Fleet Health",
              desc: `Average fleet health is ${averageScore}%. Review maintenance plans.`,
              severity: "warning",
              time: "Today"
            });
          }
        }

        // 2. Anomalies
        if (anomaliesRes.status === "fulfilled" && anomaliesRes.value?.anomalies) {
          anomaliesRes.value.anomalies.forEach((a, idx) => {
            newNotifs.push({
              id: `anomaly-${idx}`,
              title: a.title,
              desc: a.description,
              severity: a.severity,
              time: "AI Detection"
            });
          });
        }

        setNotifications(newNotifs);
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    };

    loadNotifications();
    // Refresh every 5 minutes
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [entity]);

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
        <button className="icon-btn back-btn" onClick={() => navigate(-1)} title="Go Back">
          <FaArrowLeft />
        </button>
        {(() => {
          const entityObj = entityList.find(e => e.code === entity);
          // Tier 1: curated file-based config logo (exact entity-code match, theme-aware)
          const configLogo = getEntityLogoForTheme(entity, theme);
          // Tier 2: DB logo uploaded via settings
          const dbLogo = entityObj?.logo;
          // Tier 3: OFB default fallback
          const defaultLogo = theme === "dark" ? ofbLogoDark : ofbLogo;
          const logoSrc = configLogo || dbLogo || defaultLogo;
          const logoAlt = entityObj?.name || "OFBusiness";
          return <img src={logoSrc} alt={logoAlt} className="topbar-logo-brand" />;
        })()}
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
          {isAdmin && <option value="ALL">All Entities</option>}
          {allowedEntities.map((ent) => (
            <option key={ent.code} value={ent.code}>
              {ent.name || ent.code}
            </option>
          ))}
          {!isAdmin && allowedEntities.length === 0 && (
            <option value="ALL" disabled>No entities assigned</option>
          )}
        </select>

        {/* THEME */}
        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
        >
          {theme === "light" ? <FaMoon /> : <FaSun />}
        </button>

        {/* NOTIFICATIONS */}
        <div className="topbar-action-wrapper" ref={notifRef}>
          <button
            className="notif-btn"
            onClick={() => setNotifOpen(!notifOpen)}
            title="Notifications"
          >
            <FaBell />
            {notifications.filter(n => !readIds.has(n.id)).length > 0 && (
              <span className="notif-badge">
                {notifications.filter(n => !readIds.has(n.id)).length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <span className="notification-title">Notifications</span>
                {notifications.length > 0 && (
                  <button
                    className="notif-mark-all-btn"
                    onClick={() => setReadIds(new Set(notifications.map(n => n.id)))}
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    <FaBell style={{ fontSize: "28px", opacity: 0.25, display: "block", margin: "0 auto 8px" }} />
                    <span>All caught up!</span>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginTop: 4 }}>No new alerts at this time</span>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isRead = readIds.has(notif.id);
                    return (
                      <div
                        key={notif.id}
                        className={`notification-item ${notif.severity}${isRead ? " read" : ""}`}
                        onClick={() => {
                          setReadIds(prev => new Set([...prev, notif.id]));
                          setNotifOpen(false);
                          navigate("/ai-intelligence");
                        }}
                      >
                        <div className="notif-dot-col">
                          {!isRead && <span className={`notif-dot ${notif.severity}`} />}
                        </div>
                        <div className="notif-content-col">
                          <div className="notification-item-header">
                            <span className="notification-item-title">{notif.title}</span>
                            <span className="notification-time">{notif.time}</span>
                          </div>
                          <div className="notification-desc">{notif.desc}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

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
