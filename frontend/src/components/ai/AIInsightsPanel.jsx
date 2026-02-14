import { useState, useEffect } from "react";
import api from "../../services/api";
import "./AIInsightsPanel.css";

const SEVERITY_ICONS = {
    good: "✅",
    warning: "⚠️",
    critical: "🔴"
};



export default function AIInsightsPanel({ entityCode }) {
    const [insights, setInsights] = useState([]);
    const [anomalies, setAnomalies] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        loadInsights();
    }, [entityCode]);

    const loadInsights = async () => {
        setLoading(true);
        try {
            const [insightRes, anomalyRes] = await Promise.allSettled([
                api.getAIInsights(entityCode),
                api.getAnomalies(entityCode)
            ]);

            if (insightRes.status === "fulfilled") {
                setInsights(insightRes.value.insights || []);
            }
            if (anomalyRes.status === "fulfilled") {
                setAnomalies(anomalyRes.value);
            }
        } catch (err) {
            console.error("AI Insights error:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="ai-insights-panel loading">
                <div className="ai-insights-header">
                    <span className="ai-insights-icon">🤖</span>
                    <span>AI Insights</span>
                </div>
                <div className="ai-insights-loading">
                    <div className="ai-shimmer" />
                    <div className="ai-shimmer short" />
                    <div className="ai-shimmer" />
                </div>
            </div>
        );
    }

    return (
        <div className="ai-insights-panel">
            <div className="ai-insights-header" onClick={() => setExpanded(!expanded)}>
                <div className="ai-insights-header-left">
                    <span className="ai-insights-icon">🤖</span>
                    <div>
                        <h3>AI Insights</h3>
                        <span className="ai-insights-subtitle">
                            {insights.length} insights • {anomalies?.totalAnomalies || 0} anomalies detected
                        </span>
                    </div>
                </div>
                <button className={`ai-expand-btn ${expanded ? "expanded" : ""}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>
            </div>

            {/* Always-visible insight cards */}
            <div className="ai-insights-grid">
                {insights.map((insight, idx) => (
                    <div key={idx} className={`ai-insight-card ${insight.severity}`}>
                        <div className="ai-insight-top">
                            <span className="ai-insight-emoji">{SEVERITY_ICONS[insight.severity] || "ℹ️"}</span>
                            <span className="ai-insight-value">
                                {insight.value}
                            </span>
                        </div>
                        <div className="ai-insight-title">
                            {insight.title}
                        </div>
                        <div className="ai-insight-desc">
                            {insight.description}
                        </div>
                    </div>
                ))}
            </div>

            {/* Expandable anomalies section */}
            {expanded && anomalies && anomalies.anomalies.length > 0 && (
                <div className="ai-anomalies-section">
                    <h4 className="ai-anomalies-title">
                        🔍 Detected Anomalies
                        <span className="ai-anomaly-count">
                            {anomalies.critical > 0 && (
                                <span className="badge critical">{anomalies.critical} Critical</span>
                            )}
                            {anomalies.warnings > 0 && (
                                <span className="badge warning">{anomalies.warnings} Warning</span>
                            )}
                        </span>
                    </h4>
                    <div className="ai-anomalies-list">
                        {anomalies.anomalies.map((anomaly, idx) => (
                            <div key={idx} className={`ai-anomaly-item ${anomaly.severity}`}>
                                <div className="ai-anomaly-icon">
                                    {anomaly.severity === "critical" ? "🔴" : anomaly.severity === "warning" ? "🟡" : "🔵"}
                                </div>
                                <div className="ai-anomaly-content">
                                    <strong>{anomaly.title}</strong>
                                    <p>{anomaly.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {expanded && (!anomalies || anomalies.anomalies.length === 0) && (
                <div className="ai-anomalies-section">
                    <div className="ai-no-anomalies">
                        <span>✨</span>
                        <p>No anomalies detected — everything looks normal!</p>
                    </div>
                </div>
            )}
        </div>
    );
}
