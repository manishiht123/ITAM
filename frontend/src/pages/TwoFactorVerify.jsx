import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaShieldAlt, FaMobileAlt, FaEnvelope, FaCheckCircle, FaSync } from "react-icons/fa";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./TwoFactorVerify.css";

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
    <div className="tfv-otp-row">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className={`tfv-otp-box${d ? " filled" : ""}`}
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

// ── Main component ────────────────────────────────────────────────────────────
export default function TwoFactorVerify() {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const preAuthToken = sessionStorage.getItem("preAuthToken") || "";
  const method       = sessionStorage.getItem("2faMethod") || "totp";

  useEffect(() => {
    if (!preAuthToken) { navigate("/login"); return; }
    try {
      const raw = JSON.parse(atob(preAuthToken.split(".")[1]));
      if (!raw.twoFactorPending) navigate("/login");
    } catch { navigate("/login"); }
    if (method === "email") setOtpSent(true);
  }, [preAuthToken, method, navigate]);

  const handleResend = useCallback(async () => {
    setError("");
    setSending(true);
    try {
      await api.sendOtp(preAuthToken);
      setOtpSent(true);
      setCode("");
    } catch (err) {
      setError(err.message || "Failed to resend code.");
    } finally { setSending(false); }
  }, [preAuthToken]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length < 6) { setError("Please enter the 6-digit code."); return; }
    setError("");
    setLoading(true);
    try {
      const data = await api.verify2FA(preAuthToken, code);
      sessionStorage.removeItem("preAuthToken");
      sessionStorage.removeItem("2faMethod");
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("authUser", JSON.stringify(data.user));
      refresh();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid or expired code. Please try again.");
      setCode("");
    } finally { setLoading(false); }
  };

  const isEmail = method === "email";
  const chipClass = isEmail ? "green" : "blue";

  return (
    <div className="tfv-page">
      {/* Background decorations */}
      <div className="tfv-glow tfv-glow-1" />
      <div className="tfv-glow tfv-glow-2" />
      <div className="tfv-dotgrid" />

      <div className="tfv-card">
        {/* Header */}
        <div className="tfv-header">
          <div className={`tfv-icon-wrap ${chipClass}`}>
            {isEmail ? <FaEnvelope /> : <FaMobileAlt />}
          </div>
          <h1 className="tfv-title">Two-Factor Verification</h1>
          <p className="tfv-subtitle">
            {isEmail
              ? "Check your email for a verification code."
              : "Open your authenticator app and enter the code."}
          </p>
          <span className={`tfv-method-chip ${chipClass}`}>
            {isEmail ? <FaEnvelope size={10} /> : <FaMobileAlt size={10} />}
            {isEmail ? "Email OTP" : "Authenticator App"}
          </span>
        </div>

        {/* Error banner */}
        {error && (
          <div className="tfv-error">
            <span className="tfv-error-icon">!</span>
            {error}
          </div>
        )}

        {/* Success / sent banner */}
        {isEmail && otpSent && !error && (
          <div className="tfv-info">
            <FaCheckCircle />
            Code sent! Check your inbox (and spam folder).
          </div>
        )}

        {/* Form */}
        <form className="tfv-form" onSubmit={handleVerify}>
          <div className="tfv-label">
            Enter your {isEmail ? "email" : "authenticator"} code
          </div>

          <OtpBoxes value={code} onChange={setCode} />

          <button
            className="tfv-btn tfv-btn-primary"
            type="submit"
            disabled={loading || code.length < 6}
          >
            {loading ? "Verifying…" : <><FaCheckCircle /> Verify</>}
          </button>

          {isEmail && (
            <button
              type="button"
              className="tfv-btn tfv-btn-ghost"
              onClick={handleResend}
              disabled={sending}
            >
              <FaSync className={sending ? "tfv-spin" : ""} />
              {sending ? "Sending…" : "Resend code"}
            </button>
          )}
        </form>

        {/* Hint box */}
        <div className="tfv-hint">
          <FaShieldAlt className="tfv-hint-icon" />
          <p>
            {isEmail
              ? "Codes expire in 10 minutes. Request a new code if it doesn't arrive."
              : "The code rotates every 30 seconds. Make sure your phone's clock is accurate."}
          </p>
        </div>

        {/* Back link */}
        <button
          className="tfv-back"
          onClick={() => {
            sessionStorage.removeItem("preAuthToken");
            sessionStorage.removeItem("2faMethod");
            navigate("/login");
          }}
        >
          ← Back to Login
        </button>
      </div>
    </div>
  );
}
