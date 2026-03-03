import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEnvelope, FaLock, FaEye, FaEyeSlash,
  FaLaptop, FaShieldAlt, FaChartBar, FaCheckCircle,
  FaServer, FaDesktop, FaMobileAlt, FaHdd,
  FaNetworkWired, FaTabletAlt, FaDatabase,
  FaMicrochip, FaQrcode, FaPrint, FaBarcode, FaWifi,
  FaCloud, FaCog, FaKey
} from "react-icons/fa";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import "../styles/login.css";
import OfbLogo   from "../assets/logos/default-dark.svg";
import OxyzaLogo from "../assets/logos/oxyzo1.svg";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

/* ── Background logo watermarks ──────────────────────────── */
const BG_LOGOS = [
  /* ── Top row ── */
  { src: "ofb",   top:  "1%",  left:  "1%",   width: 300, rotate:  -8 },
  { src: "oxyzo", top:  "2%",  left: "36%",   width: 260, rotate:   5 },
  { src: "ofb",   top:  "1%",  left: "70%",   width: 320, rotate:  11 },
  /* ── Upper-middle row ── */
  { src: "oxyzo", top: "24%",  left:  "6%",   width: 240, rotate:  -5 },
  { src: "ofb",   top: "22%",  left: "52%",   width: 280, rotate:   7 },
  { src: "oxyzo", top: "25%",  left: "84%",   width: 210, rotate:  -4 },
  /* ── Mid row ── */
  { src: "ofb",   top: "46%",  left: "0%",    width: 260, rotate:   6 },
  { src: "oxyzo", top: "44%",  left: "32%",   width: 300, rotate: -10 },
  { src: "ofb",   top: "47%",  left: "72%",   width: 230, rotate:   4 },
  /* ── Lower-middle row ── */
  { src: "oxyzo", top: "66%",  left: "10%",   width: 280, rotate:  -7 },
  { src: "ofb",   top: "64%",  left: "48%",   width: 220, rotate:   3 },
  { src: "oxyzo", top: "67%",  left: "80%",   width: 310, rotate:  -5 },
  /* ── Bottom row ── */
  { src: "ofb",   top: "84%",  left:  "2%",   width: 250, rotate:   9 },
  { src: "oxyzo", top: "83%",  left: "40%",   width: 270, rotate: -11 },
  { src: "ofb",   top: "85%",  left: "76%",   width: 240, rotate:   6 },
];

/* ── Floating background asset icons ─────────────────────── */
const BG_ICONS = [
  { Icon: FaServer,       size: 32, top:  "5%",  left:  "4%",  delay: 0,  dur: 14 },
  { Icon: FaLaptop,       size: 36, top:  "7%",  left: "88%",  delay: 2,  dur: 18 },
  { Icon: FaNetworkWired, size: 34, top: "20%",  left: "10%",  delay: 7,  dur: 22 },
  { Icon: FaDesktop,      size: 30, top: "18%",  left: "82%",  delay: 5,  dur: 16 },
  { Icon: FaHdd,          size: 28, top: "34%",  left:  "5%",  delay: 6,  dur: 19 },
  { Icon: FaCog,          size: 32, top: "32%",  left: "88%",  delay: 9,  dur: 13 },
  { Icon: FaMobileAlt,    size: 28, top: "50%",  left:  "2%",  delay: 1,  dur: 20 },
  { Icon: FaCloud,        size: 34, top: "48%",  left: "90%",  delay: 3,  dur: 15 },
  { Icon: FaKey,          size: 28, top: "63%",  left:  "8%",  delay: 2,  dur: 16 },
  { Icon: FaWifi,         size: 30, top: "61%",  left: "84%",  delay: 5,  dur: 22 },
  { Icon: FaDatabase,     size: 28, top: "76%",  left:  "6%",  delay: 6,  dur: 19 },
  { Icon: FaShieldAlt,    size: 34, top: "74%",  left: "86%",  delay: 1,  dur: 20 },
  { Icon: FaMicrochip,    size: 36, top: "88%",  left: "18%",  delay: 2,  dur: 13 },
  { Icon: FaTabletAlt,    size: 30, top: "86%",  left: "74%",  delay: 4,  dur: 17 },
  { Icon: FaQrcode,       size: 30, top: "25%",  left: "44%",  delay: 8,  dur: 21 },
  { Icon: FaBarcode,      size: 32, top: "58%",  left: "46%",  delay: 9,  dur: 18 },
  { Icon: FaChartBar,     size: 30, top: "10%",  left: "46%",  delay: 4,  dur: 17 },
  { Icon: FaPrint,        size: 28, top: "78%",  left: "46%",  delay: 0,  dur: 18 },
];

export default function Login() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch Google Client ID from backend (so no .env file is needed on the frontend)
  const [googleClientId, setGoogleClientId] = useState(import.meta.env.VITE_GOOGLE_CLIENT_ID || "");
  const [googleConfigLoaded, setGoogleConfigLoaded] = useState(!!import.meta.env.VITE_GOOGLE_CLIENT_ID);
  useEffect(() => {
    if (googleClientId) { setGoogleConfigLoaded(true); return; }
    api.getAuthConfig()
      .then((cfg) => { if (cfg?.googleClientId) setGoogleClientId(cfg.googleClientId); })
      .catch(() => {})
      .finally(() => setGoogleConfigLoaded(true));
  }, []);

  // Responsive Google button — measure wrapper width so iframe never overflows on mobile
  const googleWrapRef = useRef(null);
  const [googleBtnWidth, setGoogleBtnWidth] = useState(376);
  useEffect(() => {
    if (!googleWrapRef.current) return;
    const obs = new ResizeObserver(([e]) => setGoogleBtnWidth(Math.floor(e.contentRect.width)));
    obs.observe(googleWrapRef.current);
    return () => obs.disconnect();
  }, []);

  const handle2FAResponse = (data) => {
    if (data.setupRequired) {
      sessionStorage.setItem("setupToken", data.setupToken);
      sessionStorage.setItem("setupUser", JSON.stringify(data.user));
      navigate("/2fa-setup");
    } else if (data.twoFactorPending) {
      sessionStorage.setItem("preAuthToken", data.preAuthToken);
      sessionStorage.setItem("2faMethod", data.method);
      navigate("/2fa-verify");
    } else if (data.token) {
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("authUser", JSON.stringify(data.user));
      refresh();
      navigate("/dashboard");
    }
  };

  const handleGoogleSuccess = async (googleResponse) => {
    setError("");
    setLoading(true);
    try {
      const data = await api.googleLogin(googleResponse.credential);
      handle2FAResponse(data);
    } catch (err) {
      setError(err?.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await api.login({ email, password });
      handle2FAResponse(data);
    } catch (err) {
      setError(err?.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* Background glow accents */}
      <div className="login-glow login-glow-1" aria-hidden="true" />
      <div className="login-glow login-glow-2" aria-hidden="true" />
      <div className="login-glow login-glow-3" aria-hidden="true" />

      {/* Dot-grid texture */}
      <div className="login-dotgrid" aria-hidden="true" />

      {/* Background logo watermarks */}
      <div className="login-bg-logos" aria-hidden="true">
        {BG_LOGOS.map(({ src, top, left, width, rotate }, i) => (
          <img
            key={i}
            src={src === "ofb" ? OfbLogo : OxyzaLogo}
            alt=""
            className="login-bg-logo"
            style={{
              top, left,
              width: `${width}px`,
              transform: `rotate(${rotate}deg)`,
            }}
          />
        ))}
      </div>

      {/* Floating asset icons */}
      <div className="login-icon-bg" aria-hidden="true">
        {BG_ICONS.map(({ Icon, size, top, left, delay, dur }, i) => (
          <div
            key={i}
            className="login-icon-card"
            style={{
              top, left,
              "--delay": `${delay}s`,
              "--dur": `${dur}s`,
              "--sz": `${size}px`
            }}
          >
            <Icon style={{ fontSize: size }} />
          </div>
        ))}
      </div>

      {/* ── Centered content ── */}
      <div className="login-center">

        {/* Logos + badge above card */}
        <div className="login-brand-top">
          <div className="login-top-logos">
            <img src={OfbLogo}   alt="OFB"   className="login-top-logo login-top-logo-ofb" />
            <span className="login-top-logo-sep" />
            <img src={OxyzaLogo} alt="Oxyzo" className="login-top-logo login-top-logo-oxyzo" />
          </div>
          <span className="login-top-badge">Enterprise IT Management</span>
        </div>

        {/* Login Card */}
        <div className="login-card">
          <div className="login-accent" />

          <div className="login-card-body">
            <div className="login-brand">
              <h1 className="login-title">Welcome back</h1>
              <p className="login-subtitle">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="login-error">
                <span className="login-error-icon">!</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="login-form" noValidate>
              <div className="login-field">
                <label className="login-label" htmlFor="login-email">
                  Email Address
                </label>
                <div className="login-input-wrapper">
                  <FaEnvelope className="login-input-icon" />
                  <input
                    id="login-email"
                    type="email"
                    className="login-input"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="login-password">
                  Password
                </label>
                <div className="login-input-wrapper">
                  <FaLock className="login-input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    className="login-input login-input-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={`login-button ${loading ? "login-button-loading" : ""}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="login-spinner" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="login-divider">
              <span className="login-divider-line" />
              <span className="login-divider-text">or continue with</span>
              <span className="login-divider-line" />
            </div>

            <div className="login-google-wrap" ref={googleWrapRef}>
              {googleClientId ? (
                <GoogleOAuthProvider clientId={googleClientId}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError("Google sign-in failed. Please try again.")}
                    theme="filled_black"
                    size="large"
                    width={String(googleBtnWidth)}
                    text="signin_with_google"
                    shape="rectangular"
                  />
                </GoogleOAuthProvider>
              ) : (
                <button
                  type="button"
                  className="login-google-fallback"
                  onClick={() => setError(
                    googleConfigLoaded
                      ? "Google Sign-In is not configured. Please contact your administrator to set up Google OAuth in Settings → Password Policy."
                      : "Loading…"
                  )}
                  disabled={!googleConfigLoaded}
                >
                  <svg className="login-google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {googleConfigLoaded ? "Sign in with Google" : "Loading…"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Features row */}
        <div className="login-features-row">
          {[
            { icon: FaLaptop,    label: "Full Asset Lifecycle" },
            { icon: FaShieldAlt, label: "License Compliance" },
            { icon: FaChartBar,  label: "Reports & Analytics" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="login-feat-item">
              <FaCheckCircle className="login-feat-check" />
              <Icon className="login-feat-icon" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Trust pills */}
        <div className="login-trust-row">
          <span className="login-trust-pill">Multi-tenant</span>
          <span className="login-trust-pill">Role-based Access</span>
          <span className="login-trust-pill">Audit Logs</span>
        </div>

        <p className="login-footer">
          &copy; {new Date().getFullYear()} IT Asset Management System
        </p>

      </div>
    </div>
  );
}
