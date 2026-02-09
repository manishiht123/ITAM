import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { useEntity } from "../../context/EntityContext";
import { KpiCard, Card, Badge, Button, PageLayout } from "../../components/ui";
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
        return { active, watch, overused, auditReady };
    }, [licenses]);

    if (loading) return <div className="licenses-page"><p>Loading licenses...</p></div>;

    return (
        <div className="licenses-page">
            <PageLayout.Header
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        Licenses & Compliance
                        <Badge variant="primary">{entity || "All Entities"}</Badge>
                    </div>
                }
                subtitle="Track license utilization, renewals, and audit readiness across entities"
            />

            {/* KPI Cards */}
            <div className="licenses-kpi-grid">
                <KpiCard label="Active Licenses" value={kpis.active} size="sm" />
                <KpiCard label="At-Risk Renewals" value={kpis.watch} size="sm" variant="warning" />
                <KpiCard label="Overused Seats" value={kpis.overused} size="sm" variant="danger" />
                <KpiCard label="Audit Ready" value={`${kpis.auditReady}%`} size="sm" variant="success" />
            </div>

            {/* Compliance Score + Risk Alerts */}
            <div className="licenses-split">
                <Card>
                    <Card.Header>
                        <Card.Title>Compliance Score</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <div className="score-panel">
                            <div className="score-badge">{kpis.auditReady}</div>
                            <div className="score-meta">
                                <h4>Audit Readiness</h4>
                                <p>Maintain renewals, keep usage within purchased limits, and resolve overages.</p>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                <Card>
                    <Card.Header>
                        <Card.Title>Risk Alerts</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <div className="risk-list">
                            {risks.length === 0 && (
                                <div className="risk-item">
                                    <span>No immediate risks detected</span>
                                    <Badge variant="success">LOW</Badge>
                                </div>
                            )}
                            {risks.map((risk) => (
                                <div className="risk-item" key={risk.text}>
                                    <span>{risk.text}</span>
                                    <Badge variant={risk.level === "high" ? "danger" : "warning"}>
                                        {risk.level.toUpperCase()}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </Card.Body>
                </Card>
            </div>

            {/* Upcoming Renewals */}
            <Card>
                <Card.Header>
                    <Card.Title>Upcoming Renewals</Card.Title>
                </Card.Header>
                <Card.Body>
                    <div className="licenses-table-wrapper">
                        <table className="licenses-table">
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
                                            <Badge variant={row.status === "Critical" ? "danger" : row.status === "Watch" ? "warning" : "success"}>
                                                {row.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                                {!renewals.length && (
                                    <tr>
                                        <td colSpan="5" className="licenses-empty">No renewals available.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card.Body>
            </Card>

            {/* License Inventory & Usage */}
            <Card>
                <Card.Header>
                    <Card.Title>License Inventory & Usage</Card.Title>
                </Card.Header>
                <Card.Body>
                    <div className="licenses-table-wrapper">
                        <table className="licenses-table">
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
                                            <Badge variant={row.compliance === "Critical" ? "danger" : row.compliance === "Watch" ? "warning" : "success"}>
                                                {row.compliance}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                                {!inventory.length && (
                                    <tr>
                                        <td colSpan="4" className="licenses-empty">No license data available.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card.Body>
            </Card>

            {/* Policy Controls */}
            <Card>
                <Card.Header>
                    <Card.Title>Policy Controls</Card.Title>
                </Card.Header>
                <Card.Body>
                    <div className="policy-grid">
                        <div className="policy-card">
                            <div className="policy-header">
                                <h4>Overuse Protection</h4>
                                <Badge variant="success">Enabled</Badge>
                            </div>
                            <p>Block new allocations when usage exceeds owned seats.</p>
                        </div>
                        <div className="policy-card">
                            <div className="policy-header">
                                <h4>Auto-Renewal Review</h4>
                                <Badge variant="success">Enabled</Badge>
                            </div>
                            <p>Require approval for renewals above 10% cost increase.</p>
                        </div>
                        <div className="policy-card">
                            <div className="policy-header">
                                <h4>Audit Trail</h4>
                                <Badge variant="success">Enabled</Badge>
                            </div>
                            <p>Maintain license assignment history and renewal approvals.</p>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Audit Footer */}
            <Card>
                <Card.Body>
                    <div className="audit-footer">
                        <div>
                            <h4 className="audit-title">Audit Readiness Checklist</h4>
                            <p className="audit-note">
                                Last review completed 14 days ago · Next audit in 46 days
                            </p>
                        </div>
                        <Button variant="secondary">Download Checklist</Button>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
}
