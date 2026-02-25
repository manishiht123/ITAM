import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import { EntityProvider } from "./context/EntityContext";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import "./styles/dashboard.css";
import "./styles/global.css";
import "./styles/sidebar.css";
import "./styles/topbar.css";
import "./styles/layout.css";
import "./styles/theme.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { ThemeProvider } from "./context/ThemeContext";

// Set VITE_GOOGLE_CLIENT_ID in frontend/.env to enable Google Sign-In
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <ToastProvider>
          <ThemeProvider>
            <AuthProvider>
              <EntityProvider>
                <App />
              </EntityProvider>
            </AuthProvider>
          </ThemeProvider>
        </ToastProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

