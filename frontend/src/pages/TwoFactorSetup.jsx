import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaShieldAlt, FaMobileAlt, FaEnvelope, FaCheckCircle, FaArrowLeft } from "react-icons/fa";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./TwoFactorSetup.css";

export default function TwoFactorSetup() {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [step, setStep]         = useState("choose"); // choose | totp-qr | totp-verify | email-sent | email-verify
  const [method, setMethod]     = useState(null);
  const [qrCode, setQrCode]     = useState(null);
  const [manualCode, setManualCode] = useState(null);
  const [code, setCode]         = useState("");
  const [preAuthToken, setPreAuthToken] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const setupToken = sessionStorage.getItem("setupToken") || "";

  useEffect(() => {
    if (!setupToken) {
      navigate("/login");
      return;
    }
    try {
      const raw = JSON.parse(atob(setupToken.split(".")[1]));
      if (!raw.setupRequired) navigate("/login");
    } catch {
      navigate("/login");
    }
    const user = sessionStorage.getItem("setupUser");
    if (user) {
      try { setUserEmail(JSON.parse(user).email || ""); } catch (_) {}
    }
  }, [setupToken, navigate]);

  // ── Select TOTP ──────────────────────────────────────────────────────────────
  const handleSelectTotp = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await api.totpGenerate(setupToken);
      setQrCode(data.qrCode);
      setManualCode(data.manualCode);
      setMethod("totp");
      setStep("totp-qr");
    } catch (err) {
      setError(err.message || "Failed to generate QR code.");
    } finally {
      setLoading(false);
    }
  };

  // ── TOTP verify ──────────────────────────────────────────────────────────────
  const handleTotpEnable = async (e) => {
    e.preventDefault();
    if (!code || code.length < 6) {
      setError("Please enter a 6-digit code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await api.totpEnable(setupToken, code);
      sessionStorage.removeItem("setupToken");
      sessionStorage.removeItem("setupUser");
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("authUser", JSON.stringify(data.user));
      refresh();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Select Email OTP ─────────────────────────────────────────────────────────
  const handleSelectEmail = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await api.emailSetup(setupToken);
      setPreAuthToken(data.preAuthToken);
      setMethod("email");
      setStep("email-verify");
    } catch (err) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ── Email OTP enable ─────────────────────────────────────────────────────────
  const handleEmailEnable = async (e) => {
    e.preventDefault();
    if (!code || code.length < 6) {
      setError("Please enter the 6-digit code from your email.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await api.emailEnable(preAuthToken, code);
      sessionStorage.removeItem("setupToken");
      sessionStorage.removeItem("setupUser");
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("authUser", JSON.stringify(data.user));
      refresh();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeInput = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(val);
  };

  return (
    <div className="tfs-page">
      <div className="tfs-card">
        <div className="tfs-header">
          <div className="tfs-shield-icon">
            <FaShieldAlt />
          </div>
          <h1 className="tfs-title">Secure Your Account</h1>
          <p className="tfs-subtitle">
            Set up two-factor authentication to protect your ITAM account.
            {userEmail && <><br /><span className="tfs-email">{userEmail}</span></>}
          </p>
        </div>

        {error && (
          <div className="tfs-error">
            <span>!</span> {error}
          </div>
        )}

        {/* ── Step: Choose method ── */}
        {step === "choose" && (
          <div className="tfs-methods">
            <p className="tfs-methods-label">Choose your verification method:</p>
            <button
              className="tfs-method-card"
              onClick={handleSelectTotp}
              disabled={loading}
            >
              <div className="tfs-method-icon tfs-method-icon-blue">
                <FaMobileAlt />
              </div>
              <div className="tfs-method-body">
                <span className="tfs-method-name">Authenticator App</span>
                <span className="tfs-method-desc">Use Google Authenticator, Authy, or any TOTP app. Works offline.</span>
              </div>
              <span className="tfs-method-arrow">→</span>
            </button>
            <button
              className="tfs-method-card"
              onClick={handleSelectEmail}
              disabled={loading}
            >
              <div className="tfs-method-icon tfs-method-icon-green">
                <FaEnvelope />
              </div>
              <div className="tfs-method-body">
                <span className="tfs-method-name">Email OTP</span>
                <span className="tfs-method-desc">Get a one-time code sent to your registered email address.</span>
              </div>
              <span className="tfs-method-arrow">→</span>
            </button>
          </div>
        )}

        {/* ── Step: TOTP QR code ── */}
        {step === "totp-qr" && (
          <div className="tfs-totp">
            <ol className="tfs-steps">
              <li>Install <strong>Google Authenticator</strong>, <strong>Authy</strong>, or any TOTP app on your phone.</li>
              <li>Tap <strong>Add account</strong> → <strong>Scan QR code</strong>.</li>
              <li>Scan the code below, then enter the 6-digit code shown in the app.</li>
            </ol>
            {qrCode && (
              <div className="tfs-qr-wrap">
                <img src={qrCode} alt="TOTP QR Code" className="tfs-qr-img" />
              </div>
            )}
            {manualCode && (
              <div className="tfs-manual-code">
                <span className="tfs-manual-label">Manual entry key:</span>
                <code className="tfs-manual-value">{manualCode}</code>
              </div>
            )}
            <button className="tfs-btn tfs-btn-primary" onClick={() => setStep("totp-verify")}>
              I've scanned the code →
            </button>
            <button className="tfs-btn tfs-btn-ghost" onClick={() => { setStep("choose"); setCode(""); setError(""); }}>
              <FaArrowLeft /> Back
            </button>
          </div>
        )}

        {/* ── Step: TOTP verify ── */}
        {step === "totp-verify" && (
          <form className="tfs-verify" onSubmit={handleTotpEnable}>
            <p className="tfs-verify-hint">Enter the 6-digit code shown in your authenticator app:</p>
            <input
              className="tfs-code-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="000000"
              value={code}
              onChange={handleCodeInput}
              autoFocus
              maxLength={6}
            />
            <button className="tfs-btn tfs-btn-primary" type="submit" disabled={loading || code.length < 6}>
              {loading ? "Verifying…" : <><FaCheckCircle /> Verify &amp; Enable</>}
            </button>
            <button type="button" className="tfs-btn tfs-btn-ghost" onClick={() => { setStep("totp-qr"); setCode(""); setError(""); }}>
              <FaArrowLeft /> Back
            </button>
          </form>
        )}

        {/* ── Step: Email OTP verify ── */}
        {step === "email-verify" && (
          <form className="tfs-verify" onSubmit={handleEmailEnable}>
            <p className="tfs-verify-hint">
              A verification code was sent to <strong>{userEmail}</strong>.<br />
              Enter the 6-digit code from your email:
            </p>
            <input
              className="tfs-code-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="000000"
              value={code}
              onChange={handleCodeInput}
              autoFocus
              maxLength={6}
            />
            <button className="tfs-btn tfs-btn-primary" type="submit" disabled={loading || code.length < 6}>
              {loading ? "Verifying…" : <><FaCheckCircle /> Verify &amp; Enable</>}
            </button>
            <button
              type="button"
              className="tfs-btn tfs-btn-ghost"
              disabled={loading}
              onClick={() => { setStep("choose"); setCode(""); setError(""); }}
            >
              <FaArrowLeft /> Back
            </button>
          </form>
        )}

        <p className="tfs-footer">
          Two-factor authentication is required for all accounts.
        </p>
      </div>
    </div>
  );
}
