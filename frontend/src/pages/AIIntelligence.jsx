import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEntity } from "../context/EntityContext";
import { PageLayout, Card, Badge, Spinner } from "../components/ui";
import AIInsightsPanel from "../components/ai/AIInsightsPanel";
import AssetHealthDashboard from "../components/ai/AssetHealthDashboard";
import api from "../services/api";
import "./AIIntelligence.css";

const TABS = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "health", label: "Asset Health", icon: "❤️" },
    { id: "anomalies", label: "Anomalies", icon: "🔍" },
    { id: "forecast", label: "Forecast", icon: "📈" }
];

export default function AIIntelligence() {
    const { entity } = useEntity();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");

    return (
        <PageLayout>
            <PageLayout.Header
                title={
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
                        <span className="ai-page-icon">🤖</span>
                        AI Intelligence
                        <Badge variant="primary">{entity || "All Entities"}</Badge>

                    </div>
                }
                subtitle="Rule-based AI insights — asset health, anomaly detection, and smart analytics"
            />

            <PageLayout.Content>
                {/* Tab Navigation */}
                <div className="ai-tabs">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            className={`ai-tab ${activeTab === tab.id ? "active" : ""}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className="ai-tab-icon">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === "overview" && (
                    <div className="ai-tab-content">
                        <AIInsightsPanel entityCode={entity} />
                        <div className="ai-overview-grid">
                            <OverviewCard
                                icon="❤️"
                                title="Asset Health"
                                description="Track the health of your entire fleet. Identify assets needing replacement."
                                onClick={() => setActiveTab("health")}
                            />
                            <OverviewCard
                                icon="🔍"
                                title="Anomaly Detection"
                                description="Automatically detect unusual patterns — repair spikes, idle assets, imbalances."
                                onClick={() => setActiveTab("anomalies")}
                            />
                            <OverviewCard
                                icon="📈"
                                title="Budget Forecast"
                                description="Predict future procurement needs based on historical trends."
                                onClick={() => setActiveTab("forecast")}
                            />
                            <OverviewCard
                                icon="🏷️"
                                title="Auto-Categorize"
                                description="AI classifies assets by name using keyword patterns."
                                onClick={() => navigate("/assets")}
                                badge="Import Feature"
                            />
                            <OverviewCard
                                icon="🎯"
                                title="Smart Allocation"
                                description="Get AI suggestions for the best asset-employee matches."
                                onClick={() => navigate("/assets/allocate")}
                                badge="Allocation Feature"
                            />
                            <OverviewCard
                                icon="💬"
                                title="Natural Language Search"
                                description="Search assets using plain English. Try the chat widget on the bottom-right!"
                                onClick={() => window.dispatchEvent(new CustomEvent("open-ai-chat"))}
                                badge="Chat Widget"
                            />
                        </div>
                    </div>
                )}

                {activeTab === "health" && (
                    <div className="ai-tab-content">
                        <AssetHealthDashboard />
                    </div>
                )}

                {activeTab === "anomalies" && (
                    <div className="ai-tab-content">
                        <AnomaliesTab entityCode={entity} />
                    </div>
                )}

                {activeTab === "forecast" && (
                    <div className="ai-tab-content">
                        <ForecastTab entityCode={entity} />
                    </div>
                )}
            </PageLayout.Content>
        </PageLayout>
    );
}

/* ─── Overview Card ─── */
function OverviewCard({ icon, title, description, onClick, badge }) {
    return (
        <div className="ai-overview-card" onClick={onClick}>
            <div className="ai-overview-card-icon">{icon}</div>
            <div className="ai-overview-card-content">
                <h4>
                    {title}
                    {badge && <span className="ai-overview-badge">{badge}</span>}
                </h4>
                <p>{description}</p>
            </div>
            <svg className="ai-overview-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
            </svg>
        </div>
    );
}

/* ─── Anomalies Tab ─── */
function AnomaliesTab({ entityCode }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.getAnomalies(entityCode)
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [entityCode]);

    if (loading) return <div className="ai-centered"><Spinner size="lg" /><p>Scanning for anomalies...</p></div>;
    if (!data) return <div className="ai-centered"><p>Unable to load anomalies</p></div>;

    return (
        <div>
            {/* Summary Badges */}
            <div className="ai-anomaly-summary">
                <div className="ai-anomaly-stat total">
                    <span className="ai-anomaly-stat-value">{data.totalAnomalies}</span>
                    <span>Total</span>
                </div>
                <div className="ai-anomaly-stat critical">
                    <span className="ai-anomaly-stat-value">{data.critical}</span>
                    <span>Critical</span>
                </div>
                <div className="ai-anomaly-stat warning">
                    <span className="ai-anomaly-stat-value">{data.warnings}</span>
                    <span>Warnings</span>
                </div>
                <div className="ai-anomaly-stat info">
                    <span className="ai-anomaly-stat-value">{data.info}</span>
                    <span>Info</span>
                </div>
            </div>

            {data.anomalies.length === 0 ? (
                <div className="ai-centered" style={{ padding: "60px" }}>
                    <span style={{ fontSize: 48 }}>✨</span>
                    <h3>All Clear!</h3>
                    <p>No anomalies detected — your asset data looks healthy.</p>
                </div>
            ) : (
                <div className="ai-anomaly-list-full">
                    {data.anomalies.map((anomaly, idx) => (
                        <Card key={idx}>
                            <Card.Body>
                                <div className={`ai-anomaly-full-item ${anomaly.severity}`}>
                                    <div className="ai-anomaly-full-icon">
                                        {anomaly.severity === "critical" ? "🔴" : anomaly.severity === "warning" ? "🟡" : "🔵"}
                                    </div>
                                    <div className="ai-anomaly-full-content">
                                        <div className="ai-anomaly-full-title">
                                            <strong>{anomaly.title}</strong>
                                            <Badge variant={anomaly.severity === "critical" ? "danger" : anomaly.severity === "warning" ? "warning" : "info"}>
                                                {anomaly.severity}
                                            </Badge>
                                        </div>
                                        <p>{anomaly.description}</p>
                                        {anomaly.type && (
                                            <span className="ai-anomaly-type">{anomaly.type.replace(/_/g, " ")}</span>
                                        )}
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── Forecast Tab ─── */
function ForecastTab({ entityCode }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.getBudgetForecast(entityCode)
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [entityCode]);

    if (loading) return <div className="ai-centered"><Spinner size="lg" /><p>Computing forecast...</p></div>;
    if (!data) return <div className="ai-centered"><p>Unable to load forecast</p></div>;

    if (data.message && !data.forecast?.length) {
        return (
            <div className="ai-centered" style={{ padding: "60px" }}>
                <span style={{ fontSize: 48 }}>📊</span>
                <h3>Insufficient Data</h3>
                <p>{data.message}</p>
            </div>
        );
    }

    return (
        <div className="ai-forecast-content">
            {/* Trend Summary */}
            {data.trend && (
                <Card>
                    <Card.Body>
                        <div className="ai-forecast-trend">
                            <div className="ai-forecast-trend-icon">
                                {data.trend.direction === "increasing" ? "📈" : data.trend.direction === "decreasing" ? "📉" : "➡️"}
                            </div>
                            <div>
                                <h4>{data.trend.message}</h4>
                                <p>
                                    Slope: {data.trend.slope} assets/month •
                                    Change: {data.trend.changePercent > 0 ? "+" : ""}{data.trend.changePercent}%
                                </p>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* Historical + Forecast Chart (text-based) */}
            <Card>
                <Card.Header>
                    <Card.Title>Procurement Trend & Forecast</Card.Title>
                </Card.Header>
                <Card.Body>
                    <div className="ai-forecast-chart">
                        {/* Historical data */}
                        {data.historical?.map((item, idx) => {
                            const maxCount = Math.max(
                                ...(data.historical?.map(h => h.count) || [1]),
                                ...(data.forecast?.map(f => f.predictedCount) || [1])
                            );
                            const pct = maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0;
                            return (
                                <div key={idx} className="ai-forecast-bar-row">
                                    <span className="ai-forecast-month">{item.month}</span>
                                    <div className="ai-forecast-bar-track">
                                        <div className="ai-forecast-bar historical" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="ai-forecast-value">{item.count}</span>
                                </div>
                            );
                        })}
                        {/* Forecast data */}
                        {data.forecast?.map((item, idx) => {
                            const maxCount = Math.max(
                                ...(data.historical?.map(h => h.count) || [1]),
                                ...(data.forecast?.map(f => f.predictedCount) || [1])
                            );
                            const pct = maxCount > 0 ? Math.round((item.predictedCount / maxCount) * 100) : 0;
                            return (
                                <div key={`f-${idx}`} className="ai-forecast-bar-row forecast">
                                    <span className="ai-forecast-month">{item.month} <Badge variant="info">Predicted</Badge></span>
                                    <div className="ai-forecast-bar-track">
                                        <div className="ai-forecast-bar predicted" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="ai-forecast-value">{item.predictedCount}</span>
                                </div>
                            );
                        })}
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
}
