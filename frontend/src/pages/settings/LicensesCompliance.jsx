import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { useEntity } from "../../context/EntityContext";
import "./LicensesCompliance.css";

export default function LicensesCompliance() {
    const { entity } = useEntity();
    const [licenses, setLicenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                if (entity === "ALL") {
                    const entities = await api.getEntities();
                    const codes = (entities || []).map((e) => e.code).filter(Boolean);
                    const results = await Promise.allSettled(
                        codes.map((code) => api.getSoftwareInventory(code))
                    );
                    const merged = results.flatMap((r) =>
                        r.status === "fulfilled" ? (r.value?.licenses || []) : []
                    );
                    const defaultData = await api.getSoftwareInventory(null).catch(() => null);
                    const defaults = defaultData?.licenses || [];
                    setLicenses([...(merged || []), ...(defaults || [])]);
                } else {
                    const data = await api.getSoftwareInventory(entity);
                    setLicenses(data?.licenses || []);
                }
            } catch (error) {
                console.error("Failed to load licenses", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [entity]);

    const normalizeCompliance = (row) => {
        const owned = Number(row.seatsOwned || 0);
        const used = Number(row.seatsUsed || 0);
        if (owned === 0 && used === 0) return "Good";
        if (used > owned) return "Critical";
        if (owned > 0 && used / owned >= 0.9) return "Watch";
        return "Good";
    };

    const inventory = useMemo(() => {
        return licenses.map((row) => ({
            product: row.product,
            owned: row.seatsOwned,
            used: row.seatsUsed,
            compliance: row.compliance || normalizeCompliance(row)
        }));
    }, [licenses]);

    const renewals = useMemo(() => {
        return licenses
            .filter((row) => row.renewalDate)
            .map((row) => ({
                product: row.product,
                vendor: row.vendor,
                date: row.renewalDate,
                status: row.status || normalizeCompliance(row),
                seats: row.seatsOwned
            }));
    }, [licenses]);

    const risks = useMemo(() => {
        const items = [];
        licenses.forEach((row) => {
            const compliance = row.compliance || normalizeCompliance(row);
            if (compliance === "Critical") {
                items.push({
                    text: `${row.product} is over-used`,
                    level: "high"
                });
            } else if (compliance === "Watch") {
                items.push({
                    text: `${row.product} is nearing seat limit`,
                    level: "medium"
                });
            }
        });
        return items.slice(0, 3);
    }, [licenses]);

    const kpis = useMemo(() => {
        const active = licenses.length;
        const overused = licenses.filter((row) => normalizeCompliance(row) === "Critical").length;
        const watch = licenses.filter((row) => normalizeCompliance(row) === "Watch").length;
        const total = licenses.length || 1;
        const auditReady = Math.round(((total - overused) / total) * 100);
        return [
            { label: "Active Licenses", value: active },
            { label: "At-Risk Renewals", value: watch },
            { label: "Overused Seats", value: overused },
            { label: "Audit Ready", value: `${auditReady}%` }
        ];
    }, [licenses]);

    const handleAddLicense = async () => {};

    if (loading) return <div className="p-8">Loading licenses...</div>;

    return (
        <div className="licenses-page">
            <div className="licenses-header">
                <div className="licenses-title">
                    <h1>Licenses & Compliance</h1>
                    <p>Track license utilization, renewals, and audit readiness across entities.</p>
                </div>
                <div className="licenses-actions" />
            </div>

            <div className="licenses-grid">
                <div className="card">
                    <div className="kpi-row">
                        {kpis.map((kpi) => (
                            <div className="kpi" key={kpi.label}>
                                <h3>{kpi.label}</h3>
                                <strong>{kpi.value}</strong>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="split">
                    <div className="card">
                        <div className="card-title">Compliance Score</div>
                        <div className="score-panel">
                            <div className="score-badge">{kpis[3]?.value?.replace("%", "") || "0"}</div>
                            <div className="score-meta">
                                <h4>Audit Readiness</h4>
                                <p>Maintain renewals, keep usage within purchased limits, and resolve overages.</p>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-title">Risk Alerts</div>
                        <div className="risk-list">
                            {risks.length === 0 && (
                                <div className="risk-item">
                                    <span>No immediate risks detected</span>
                                    <span className="risk-pill low">LOW</span>
                                </div>
                            )}
                            {risks.map((risk) => (
                                <div className="risk-item" key={risk.text}>
                                    <span>{risk.text}</span>
                                    <span className={`risk-pill ${risk.level}`}>
                                        {risk.level.toUpperCase()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-title">Upcoming Renewals</div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Vendor</th>
                                <th>Renewal Date</th>
                                <th>Seats</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renewals.map((row) => (
                                <tr key={row.product}>
                                    <td>{row.product}</td>
                                    <td>{row.vendor}</td>
                                    <td>{row.date}</td>
                                    <td>{row.seats}</td>
                                    <td>
                                        <span className={`status-chip ${row.status === "Critical" ? "critical" : row.status === "Watch" ? "watch" : "good"}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {!renewals.length && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: "center", color: "#6b7280", padding: "12px" }}>
                                        No renewals available.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="card">
                    <div className="card-title">License Inventory & Usage</div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Owned</th>
                                <th>Used</th>
                                <th>Compliance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map((row) => (
                                <tr key={row.product}>
                                    <td>{row.product}</td>
                                    <td>{row.owned}</td>
                                    <td>{row.used}</td>
                                    <td>
                                        <span className={`status-chip ${row.compliance === "Critical" ? "critical" : row.compliance === "Watch" ? "watch" : "good"}`}>
                                            {row.compliance}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {!inventory.length && (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: "center", color: "#6b7280", padding: "12px" }}>
                                        No license data available.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="card">
                    <div className="card-title">Policy Controls</div>
                    <div className="policy-grid">
                        <div className="policy-card">
                            <div className="policy-header">
                                <h4>Overuse Protection</h4>
                                <span className="policy-badge">Enabled</span>
                            </div>
                            <p>Block new allocations when usage exceeds owned seats.</p>
                        </div>
                        <div className="policy-card">
                            <div className="policy-header">
                                <h4>Auto-Renewal Review</h4>
                                <span className="policy-badge">Enabled</span>
                            </div>
                            <p>Require approval for renewals above 10% cost increase.</p>
                        </div>
                        <div className="policy-card">
                            <div className="policy-header">
                                <h4>Audit Trail</h4>
                                <span className="policy-badge">Enabled</span>
                            </div>
                            <p>Maintain license assignment history and renewal approvals.</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="audit-footer">
                        <div>
                            <div className="card-title">Audit Readiness Checklist</div>
                            <div className="audit-note">
                                Last review completed 14 days ago · Next audit in 46 days
                            </div>
                        </div>
                        <button className="asset-action-btn secondary">Download Checklist</button>
                    </div>
                </div>
            </div>

            {null}
        </div>
    );
}
