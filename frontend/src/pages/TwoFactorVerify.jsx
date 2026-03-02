import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaShieldAlt, FaMobileAlt, FaEnvelope, FaCheckCircle, FaSync } from "react-icons/fa";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./TwoFactorVerify.css";

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
    if (!preAuthToken) {
      navigate("/login");
      return;
    }
    try {
      const raw = JSON.parse(atob(preAuthToken.split(".")[1]));
      if (!raw.twoFactorPending) navigate("/login");
    } catch {
      navigate("/login");
    }
    // For email method, OTP was auto-sent by the login endpoint
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
    } finally {
      setSending(false);
    }
  }, [preAuthToken]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code || code.length < 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
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
    } finally {
      setLoading(false);
    }
  };

  const handleCodeInput = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(val);
  };

  return (
    <div className="tfv-page">
      <div className="tfv-card">
        <div className="tfv-header">
          <div className={`tfv-icon ${method === "email" ? "tfv-icon-green" : "tfv-icon-blue"}`}>
            {method === "email" ? <FaEnvelope /> : <FaMobileAlt />}
          </div>
          <h1 className="tfv-title">Two-Factor Verification</h1>
          <p className="tfv-subtitle">
            {method === "email"
              ? "A verification code was sent to your registered email address."
              : "Open your authenticator app and enter the 6-digit code."}
          </p>
        </div>

        {error && (
          <div className="tfv-error">
            <span>!</span> {error}
          </div>
        )}

        {method === "email" && otpSent && !error && (
          <div className="tfv-info">
            <FaCheckCircle /> Code sent to your email. Check your inbox (and spam folder).
          </div>
        )}

        <form className="tfv-form" onSubmit={handleVerify}>
          <label className="tfv-label">
            {method === "email" ? "Email verification code" : "Authenticator code"}
          </label>
          <input
            className="tfv-code-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="000000"
            value={code}
            onChange={handleCodeInput}
            autoFocus
            maxLength={6}
          />

          <button
            className="tfv-btn tfv-btn-primary"
            type="submit"
            disabled={loading || code.length < 6}
          >
            {loading ? "Verifying…" : <><FaCheckCircle /> Verify</>}
          </button>

          {method === "email" && (
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

        <div className="tfv-hint">
          <div className="tfv-hint-icon">
            <FaShieldAlt />
          </div>
          <p>
            {method === "totp"
              ? "The code rotates every 30 seconds. Make sure your phone's clock is accurate."
              : "Codes expire in 10 minutes. Request a new code if it doesn't arrive."}
          </p>
        </div>

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
