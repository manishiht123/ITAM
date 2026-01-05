import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { EntityProvider } from "./context/EntityContext";
import "./index.css";
import "./styles/dashboard.css";
import "./styles/global.css";
import "./styles/sidebar.css";
import "./styles/topbar.css";
import "./styles/layout.css";
import "./styles/theme.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { ThemeProvider } from "./context/ThemeContext";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
	<EntityProvider>
          <App />
	</EntityProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

