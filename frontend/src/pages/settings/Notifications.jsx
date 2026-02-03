import { useState, useEffect } from "react";
import api from "../../services/api";
import { useEntity } from "../../context/EntityContext";
import "./Notifications.css";

export default function Notifications() {
    const { entity } = useEntity();
    const [settings, setSettings] = useState({
        emailAlerts: true,
        weeklyReport: false,
        securityAlerts: true,
        maintenanceReminders: true,
        assetAllocation: true,
        assetReturn: true
    });
    const [emailSettings, setEmailSettings] = useState({
        enabled: true,
        provider: "custom",
        smtpUser: "",
        smtpPass: "",
        fromName: "",
        fromEmail: "",
        host: "",
        port: 587,
        secure: false,
        notifyEmail: "",
        returnToName: "",
        returnToEmail: ""
    });
    const [hasPassword, setHasPassword] = useState(false);
    const [loading, setLoading] = useState(true);
    const [savingEmail, setSavingEmail] = useState(false);
    const [emailError, setEmailError] = useState("");

    useEffect(() => {
        loadData();
    }, [entity]);

    const loadData = async () => {
        try {
            const [prefResult, emailResult] = await Promise.allSettled([
                api.getNotifications(),
                api.getEmailSettings(entity)
            ]);

            if (prefResult.status === "fulfilled") {
                setSettings(prefResult.value);
            }

            if (emailResult.status === "fulfilled") {
                const emailData = emailResult.value;
                setEmailSettings((prev) => ({
                    ...prev,
                    ...emailData,
                    smtpPass: ""
                }));
                setHasPassword(Boolean(emailData?.hasPassword));
                setEmailError("");
            } else {
                setEmailError("Email configuration service unavailable.");
            }
        } catch (err) {
            console.error("Failed to load notifications", err);
            setEmailError("Failed to fetch");
        } finally {
            setLoading(false);
        }
    };

    const applyProviderDefaults = (provider) => {
        if (provider === "google") {
            return { host: "smtp.gmail.com", port: 587, secure: false };
        }
        if (provider === "microsoft") {
            return { host: "smtp.office365.com", port: 587, secure: false };
        }
        return { host: "", port: 587, secure: false };
    };

    const toggle = async (key) => {
        const newVal = !settings[key];
        const newSettings = { ...settings, [key]: newVal };
        setSettings(newSettings); // Optimistic update

        try {
            await api.updateNotifications(newSettings);
        } catch (err) {
            console.error("Failed to update settings", err);
            setSettings(settings); // Revert on failure
            alert("Failed to save setting");
        }
    };

    if (loading) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="settings-page">
            <div className="settings-header">
                <div>
                    <h1>Notifications</h1>
                    <p className="settings-subtitle">Configure how you want to be alerted</p>
                </div>
            </div>

            <div className="settings-grid">
            <div className="settings-card">
                <h3 className="settings-section-title">Preference Settings</h3>

                <div>
                    <div className="toggle-row">
                        <div className="toggle-label">
                            <h4>Email Alerts</h4>
                            <p>Receive emails for critical asset updates and status changes</p>
                        </div>
                        <button
                            onClick={() => toggle('emailAlerts')}
                            className={`toggle-switch ${settings.emailAlerts ? 'on' : 'off'}`}
                        >
                            <span className="toggle-thumb" />
                        </button>
                    </div>

                    <div className="toggle-row">
                        <div className="toggle-label">
                            <h4>Weekly Summary Report</h4>
                            <p>Get a summary of asset allocation and inventory every Monday</p>
                        </div>
                        <button
                            onClick={() => toggle('weeklyReport')}
                            className={`toggle-switch ${settings.weeklyReport ? 'on' : 'off'}`}
                        >
                            <span className="toggle-thumb" />
                        </button>
                    </div>

                    <div className="toggle-row">
                        <div className="toggle-label">
                            <h4>Security Alerts</h4>
                            <p>Immediate notifications for suspicious login attempts or changes</p>
                        </div>
                        <button
                            onClick={() => toggle('securityAlerts')}
                            className={`toggle-switch ${settings.securityAlerts ? 'on' : 'off'}`}
                        >
                            <span className="toggle-thumb" />
                        </button>
                    </div>

                    <div className="toggle-row">
                        <div className="toggle-label">
                            <h4>Maintenance Reminders</h4>
                            <p>Get notified when assets are due for maintenance</p>
                        </div>
                        <button
                            onClick={() => toggle('maintenanceReminders')}
                            className={`toggle-switch ${settings.maintenanceReminders ? 'on' : 'off'}`}
                        >
                            <span className="toggle-thumb" />
                        </button>
                    </div>
                </div>

            </div>

            <div className="settings-card">
                <h3 className="settings-section-title">Asset Notifications</h3>

                <div>
                    <div className="toggle-row">
                        <div className="toggle-label">
                            <h4>Asset Allocation</h4>
                            <p>Get an email at the time of allocation to the employee and IT team (predifined)</p>
                        </div>
                        <button
                            onClick={() => toggle('assetAllocation')}
                            className={`toggle-switch ${settings.assetAllocation ? 'on' : 'off'}`}
                        >
                            <span className="toggle-thumb" />
                        </button>
                    </div>

                    <div className="toggle-row">
                        <div className="toggle-label">
                            <h4>Asset Return</h4>
                            <p>Get an Email at the time of returning of asset to employee and IT Team (Predefined)</p>
                        </div>
                        <button
                            onClick={() => toggle('assetReturn')}
                            className={`toggle-switch ${settings.assetReturn ? 'on' : 'off'}`}
                        >
                            <span className="toggle-thumb" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="settings-card">
                <h3 className="settings-section-title">Email Configuration</h3>
                <p className="settings-subtext">
                    Configure any SMTP provider (Google Workspace, Microsoft 365, SendGrid, Mailgun, or custom).
                    Allocation/return emails are sent automatically to both the employee and the IT team after one-time configuration.
                </p>

                {emailError && (
                    <p className="settings-error">{emailError}</p>
                )}

                <div className="form-grid two">
                    <div className="form-group">
                        <label>Email Provider</label>
                        <select
                            name="provider"
                            value={emailSettings.provider}
                            onChange={(e) => {
                                const provider = e.target.value;
                                const defaults = applyProviderDefaults(provider);
                                setEmailSettings((prev) => ({
                                    ...prev,
                                    provider,
                                    ...defaults
                                }));
                            }}
                        >
                            <option value="custom">Custom SMTP</option>
                            <option value="google">Google Workspace / Gmail</option>
                            <option value="microsoft">Microsoft 365 / Outlook</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Enable Email Notifications</label>
                        <select
                            name="enabled"
                            value={emailSettings.enabled ? "true" : "false"}
                            onChange={(e) =>
                                setEmailSettings((prev) => ({
                                    ...prev,
                                    enabled: e.target.value === "true"
                                }))
                            }
                        >
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>SMTP Username (Sender)</label>
                        <input
                            name="smtpUser"
                            value={emailSettings.smtpUser}
                            onChange={(e) =>
                                setEmailSettings((prev) => ({
                                    ...prev,
                                    smtpUser: e.target.value
                                }))
                            }
                            placeholder="it-assets@company.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>SMTP Password / App Password</label>
                        <input
                            name="smtpPass"
                            type="password"
                            value={emailSettings.smtpPass}
                            onChange={(e) =>
                                setEmailSettings((prev) => ({
                                    ...prev,
                                    smtpPass: e.target.value
                                }))
                            }
                            placeholder={hasPassword ? "Saved (leave blank to keep)" : "SMTP password"}
                        />
                    </div>

                    <div className="form-group">
                        <label>From Name</label>
                        <input
                            name="fromName"
                            value={emailSettings.fromName}
                            onChange={(e) =>
                                setEmailSettings((prev) => ({
                                    ...prev,
                                    fromName: e.target.value
                                }))
                            }
                            placeholder="IT Asset Team"
                        />
                    </div>

                    <div className="form-group">
                        <label>From Email (Optional)</label>
                        <input
                            name="fromEmail"
                            value={emailSettings.fromEmail}
                            onChange={(e) =>
                                setEmailSettings((prev) => ({
                                    ...prev,
                                    fromEmail: e.target.value
                                }))
                            }
                            placeholder="noreply@company.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>SMTP Host</label>
                        <input
                            name="host"
                            value={emailSettings.host}
                            onChange={(e) =>
                                setEmailSettings((prev) => ({
                                    ...prev,
                                    host: e.target.value
                                }))
                            }
                            placeholder="smtp.yourprovider.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>SMTP Port</label>
                        <input
                            name="port"
                            type="number"
                            value={emailSettings.port}
                            onChange={(e) =>
                                setEmailSettings((prev) => ({
                                    ...prev,
                                    port: Number(e.target.value)
                                }))
                            }
                            placeholder="587"
                        />
                    </div>

                    <div className="form-group">
                        <label>Secure Connection (SSL/TLS)</label>
                        <select
                            name="secure"
                            value={emailSettings.secure ? "true" : "false"}
                            onChange={(e) =>
                                setEmailSettings((prev) => ({
                                    ...prev,
                                    secure: e.target.value === "true"
                                }))
                            }
                        >
                            <option value="false">STARTTLS / TLS</option>
                            <option value="true">SSL</option>
                        </select>
                    </div>
                </div>

                <h4 style={{ marginTop: 16 }}>IT Team Recipients</h4>
                <div className="form-grid two">
                    <div className="form-group">
                        <label>Notify Email (IT Team)</label>
                        <input
                            name="notifyEmail"
                            value={emailSettings.notifyEmail}
                            onChange={(e) =>
                                setEmailSettings((prev) => ({
                                    ...prev,
                                    notifyEmail: e.target.value
                                }))
                            }
                            placeholder="it-admin@company.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Returned To (Name)</label>
                        <input
                            name="returnToName"
                            value={emailSettings.returnToName}
                            onChange={(e) =>
                                setEmailSettings((prev) => ({
                                    ...prev,
                                    returnToName: e.target.value
                                }))
                            }
                            placeholder="IT Admin"
                        />
                    </div>

                    <div className="form-group">
                        <label>Returned To (Email)</label>
                        <input
                            name="returnToEmail"
                            value={emailSettings.returnToEmail}
                            onChange={(e) =>
                                setEmailSettings((prev) => ({
                                    ...prev,
                                    returnToEmail: e.target.value
                                }))
                            }
                            placeholder="it-admin@company.com"
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        className="btn-primary"
                        onClick={async () => {
                            setEmailError("");
                            try {
                                if (!emailSettings.smtpUser) {
                                    setEmailError("SMTP username is required.");
                                    return;
                                }
                                if (!emailSettings.smtpPass && !hasPassword) {
                                    setEmailError("SMTP password is required.");
                                    return;
                                }
                                if (emailSettings.provider === "custom" && !emailSettings.host) {
                                    setEmailError("SMTP host is required for custom providers.");
                                    return;
                                }
                                setSavingEmail(true);
                                await api.updateEmailSettings(emailSettings, entity);
                                setEmailSettings((prev) => ({ ...prev, smtpPass: "" }));
                                setHasPassword(Boolean(emailSettings.smtpPass) || hasPassword);
                            } catch (err) {
                                setEmailError(err?.message || "Failed to save email settings.");
                            } finally {
                                setSavingEmail(false);
                            }
                        }}
                        disabled={savingEmail}
                    >
                        {savingEmail ? "Saving..." : "Save Email Configuration"}
                    </button>
                </div>
            </div>
            </div>
        </div>
    );
}
