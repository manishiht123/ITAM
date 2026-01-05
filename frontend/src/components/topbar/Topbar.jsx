import { FaBell, FaMoon, FaSun } from "react-icons/fa";
import { useEntity } from "../../context/EntityContext";
import { getEntityLogo } from "../../config/entityLogos";
//import { useTheme } from "../../context/ThemeContext";
import "../../styles/topbar.css";

export default function Topbar({ theme, toggleTheme }) {
  const { entity, setEntity } = useEntity();

  return (
    <header className="topbar">
      {/* LEFT : LOGO */}
      <div className="topbar-left">
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
	  <option value="All Entities">All Entities</option>
          <option value="OfB">Ofb</option>
          <option value="OXYZO">Oxyzo</option>
        </select>

        {/* THEME */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title="Toggle theme"
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        {/* NOTIFICATIONS */}
        <button className="icon-btn">
          <FaBell />
        </button>

        {/* USER */}
        <span className="user-name">Admin</span>
      </div>
    </header>
  );
}

