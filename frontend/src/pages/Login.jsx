import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginCard from "../components/ui/LoginCard";
import "../styles/login.css";
import CompanyLogo from "../assets/logos/default.svg";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    try {
      const data = await api.login({ email, password });
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("authUser", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err?.message || "Login failed");
    }
  };

  return (
    <div className="login-page">
      <LoginCard>
        {/* Brand Accent (color comes from CSS variable) */}
        <div className="login-accent" />

        <div style={{ padding: 24 }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <img
              src={CompanyLogo}
              alt="Company Logo"
              style={{ height: 48, marginBottom: 12 }}
            />
            <h3 style={{ margin: 0, fontWeight: 600 }}>
              IT Asset Management
            </h3>
          </div>

          <p
            style={{
              marginBottom: 24,
              color: "#6b7280",
              fontSize: 14,
              textAlign: "center"
            }}
          >
            Login to continue
          </p>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, display: "block", marginBottom: 4 }}>
              Email Address
            </label>
            <input
              type="email"
              className="login-input"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 14, display: "block", marginBottom: 4 }}>
              Password
            </label>
            <input
              type="password"
              className="login-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14
              }}
            />
          </div>

          {/* Login Button */}
          <button className="login-button" onClick={handleLogin}>
            Login
          </button>
          {error && (
            <p style={{ marginTop: 12, color: "#dc2626", fontSize: 12, textAlign: "center" }}>
              {error}
            </p>
          )}

          <p
            style={{
              marginTop: 24,
              fontSize: 12,
              color: "#9ca3af",
              textAlign: "center"
            }}
          >
            © 2025 IT Asset Management System
          </p>
        </div>
      </LoginCard>
    </div>
  );
}
