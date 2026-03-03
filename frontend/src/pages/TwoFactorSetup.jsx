import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaShieldAlt, FaMobileAlt, FaEnvelope, FaCheckCircle, FaArrowLeft } from "react-icons/fa";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./TwoFactorSetup.css";

// ── Segmented OTP input ───────────────────────────────────────────────────────
function OtpBoxes({ value, onChange, autoFocus = true }) {
  const refs = useRef([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");

  const handleChange = (i, e) => {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = char;
    onChange(next.join(""));
    if (char && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      const next = [...digits];
      next[i - 1] = "";
      onChange(next.join(""));
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div className="tfs-otp-row">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className={`tfs-otp-box${d ? " filled" : ""}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          autoFocus={autoFocus && i === 0}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}

// ── Step progress indicator ───────────────────────────────────────────────────
function StepDots({ current }) {
  // steps: 0=choose, 1=setup, 2=verify
  const labels = ["Choose", "Setup", "Verify"];
  return (
    <div className="tfs-steps-dots">
      {labels.map((label, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center" }}>
          <div className="tfs-step-item">
            <div className={`tfs-step-dot ${i < current ? "done" : i === current ? "active" : ""}`}>
              {i < current ? <FaCheckCircle size={12} /> : i + 1}
            </div>
            <span className={`tfs-step-label ${i < current ? "done" : i === current ? "active" : ""}`}>
              {label}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div className={`tfs-step-line ${i < current ? "done" : ""}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TwoFactorSetup() {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [step, setStep]             = useState("choose");
  const [method, setMethod]         = useState(null);
  const [qrCode, setQrCode]         = useState(null);
  const [manualCode, setManualCode] = useState(null);
  const [code, setCode]             = useState("");
  const [preAuthToken, setPreAuthToken] = useState(null);
  const [userEmail, setUserEmail]   = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const setupToken = sessionStorage.getItem("setupToken") || "";

  useEffect(() => {
    if (!setupToken) { navigate("/login"); return; }
    try {
      const raw = JSON.parse(atob(setupToken.split(".")[1]));
      if (!raw.setupRequired) navigate("/login");
    } catch { navigate("/login"); }
    const user = sessionStorage.getItem("setupUser");
    if (user) {
      try { setUserEmail(JSON.parse(user).email || ""); } catch (_) {}
    }
  }, [setupToken, navigate]);

  // step → progress dot index
  const dotStep = step === "choose" ? 0 : step === "totp-qr" ? 1 : 2;

  const handleSelectTotp = async () => {
    setError(""); setLoading(true);
    try {
      const data = await api.totpGenerate(setupToken);
      setQrCode(data.qrCode);
      setManualCode(data.manualCode);
      setMethod("totp");
      setStep("totp-qr");
    } catch (err) {
      setError(err.message || "Failed to generate QR code.");
    } finally { setLoading(false); }
  };

  const handleTotpEnable = async (e) => {
    e.preventDefault();
    if (code.length < 6) { setError("Please enter the 6-digit code."); return; }
    setError(""); setLoading(true);
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
    } finally { setLoading(false); }
  };

  const handleSelectEmail = async () => {
    setError(""); setLoading(true);
    try {
      const data = await api.emailSetup(setupToken);
      setPreAuthToken(data.preAuthToken);
      setMethod("email");
      setStep("email-verify");
    } catch (err) {
      setError(err.message || "Failed to send OTP.");
    } finally { setLoading(false); }
  };

  const handleEmailEnable = async (e) => {
    e.preventDefault();
    if (code.length < 6) { setError("Please enter the 6-digit code from your email."); return; }
    setError(""); setLoading(true);
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
    } finally { setLoading(false); }
  };

  const goBack = (toStep) => { setStep(toStep); setCode(""); setError(""); };

  return (
    <div className="tfs-page">
      {/* Background decorations */}
      <div className="tfs-glow tfs-glow-1" />
      <div className="tfs-glow tfs-glow-2" />
      <div className="tfs-dotgrid" />

      <div className="tfs-card">
        {/* Step progress */}
        <StepDots current={dotStep} />

        {/* Header */}
        <div className="tfs-header">
          <div className="tfs-shield-wrap"><FaShieldAlt /></div>
          <h1 className="tfs-title">Secure Your Account</h1>
          <p className="tfs-subtitle">
            Two-factor authentication is required for all accounts.
            {userEmail && (
              <><br /><span className="tfs-email-chip"><FaEnvelope size={10} />{userEmail}</span></>
            )}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="tfs-error">
            <span className="tfs-error-icon">!</span>
            {error}
          </div>
        )}

        {/* ── Choose method ── */}
        {step === "choose" && (
          <div className="tfs-methods">
            <p className="tfs-methods-label">Choose your verification method</p>
            <button className="tfs-method-card blue" onClick={handleSelectTotp} disabled={loading}>
              <div className="tfs-method-icon blue"><FaMobileAlt /></div>
              <div className="tfs-method-body">
                <span className="tfs-method-name">
                  Authenticator App
                  <span className="tfs-method-badge">Recommended</span>
                </span>
                <span className="tfs-method-desc">
                  Use Google Authenticator, Authy, or any TOTP app. Works offline.
                </span>
              </div>
              <span className="tfs-method-arrow">›</span>
            </button>
            <button className="tfs-method-card green" onClick={handleSelectEmail} disabled={loading}>
              <div className="tfs-method-icon green"><FaEnvelope /></div>
              <div className="tfs-method-body">
                <span className="tfs-method-name">Email OTP</span>
                <span className="tfs-method-desc">
                  Get a one-time code sent to your registered email address.
                </span>
              </div>
              <span className="tfs-method-arrow">›</span>
            </button>
          </div>
        )}

        {/* ── TOTP QR code ── */}
        {step === "totp-qr" && (
          <div className="tfs-totp">
            <ul className="tfs-how-steps">
              <li className="tfs-how-step">
                <span className="tfs-how-num">1</span>
                Install <strong>Google Authenticator</strong>, <strong>Authy</strong>, or any TOTP app.
              </li>
              <li className="tfs-how-step">
                <span className="tfs-how-num">2</span>
                Tap <strong>Add account</strong> → <strong>Scan QR code</strong>.
              </li>
              <li className="tfs-how-step">
                <span className="tfs-how-num">3</span>
                Scan the QR below, then click <strong>I've scanned it</strong>.
              </li>
            </ul>

            {qrCode && (
              <div className="tfs-qr-wrap">
                <img src={qrCode} alt="TOTP QR Code" className="tfs-qr-img" />
              </div>
            )}

            {manualCode && (
              <div className="tfs-manual-code">
                <div className="tfs-manual-label">Or enter manually</div>
                <code className="tfs-manual-value">{manualCode}</code>
              </div>
            )}

            <button className="tfs-btn tfs-btn-primary" onClick={() => { setStep("totp-verify"); setCode(""); }}>
              <FaCheckCircle /> I've scanned it — Continue
            </button>
            <button className="tfs-btn tfs-btn-ghost" onClick={() => goBack("choose")}>
              <FaArrowLeft /> Back
            </button>
          </div>
        )}

        {/* ── TOTP verify ── */}
        {step === "totp-verify" && (
          <form className="tfs-verify" onSubmit={handleTotpEnable}>
            <p className="tfs-verify-hint">
              Enter the <strong>6-digit code</strong> shown in your authenticator app:
            </p>
            <OtpBoxes value={code} onChange={setCode} />
            <button className="tfs-btn tfs-btn-primary" type="submit" disabled={loading || code.length < 6}>
              {loading ? "Verifying…" : <><FaCheckCircle /> Verify &amp; Enable</>}
            </button>
            <button type="button" className="tfs-btn tfs-btn-ghost" onClick={() => goBack("totp-qr")}>
              <FaArrowLeft /> Back
            </button>
          </form>
        )}

        {/* ── Email OTP verify ── */}
        {step === "email-verify" && (
          <form className="tfs-verify" onSubmit={handleEmailEnable}>
            <p className="tfs-verify-hint">
              A code was sent to <strong>{userEmail}</strong>.<br />
              Enter the <strong>6-digit code</strong> from your email:
            </p>
            <OtpBoxes value={code} onChange={setCode} />
            <button className="tfs-btn tfs-btn-primary" type="submit" disabled={loading || code.length < 6}>
              {loading ? "Verifying…" : <><FaCheckCircle /> Verify &amp; Enable</>}
            </button>
            <button type="button" className="tfs-btn tfs-btn-ghost" disabled={loading} onClick={() => goBack("choose")}>
              <FaArrowLeft /> Back
            </button>
          </form>
        )}

        <p className="tfs-footer">🔒 Two-factor authentication is mandatory for all accounts.</p>
      </div>
    </div>
  );
}
