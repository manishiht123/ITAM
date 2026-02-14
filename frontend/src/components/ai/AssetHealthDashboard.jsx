import { useState, useEffect, useMemo } from "react";
import { useEntity } from "../../context/EntityContext";
import api from "../../services/api";
import { Card, PageLayout, Spinner, Badge } from "../ui";
import "./AssetHealthDashboard.css";

const GRADE_COLORS = {
    A: { bg: "#dcfce7", color: "#15803d", ring: "#4ade80" },
    B: { bg: "#dbeafe", color: "#1d4ed8", ring: "#60a5fa" },
    C: { bg: "#fef3c7", color: "#b45309", ring: "#fbbf24" },
    D: { bg: "#fed7aa", color: "#c2410c", ring: "#fb923c" },
    F: { bg: "#fee2e2", color: "#dc2626", ring: "#f87171" }
};

export default function AssetHealthDashboard() {
    const { entity } = useEntity();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [sortBy, setSortBy] = useState("score-asc");

    useEffect(() => {
        loadData();
    }, [entity]);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await api.getHealthScores(entity);
            setData(result);
        } catch (err) {
            console.error("Health scores error:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredAssets = useMemo(() => {
        if (!data?.assets) return [];
        let assets = [...data.assets];

        if (filter !== "all") {
            assets = assets.filter(a => a.grade === filter);
        }

        switch (sortBy) {
            case "score-asc": assets.sort((a, b) => a.score - b.score); break;
            case "score-desc": assets.sort((a, b) => b.score - a.score); break;
            case "name": assets.sort((a, b) => (a.name || "").localeCompare(b.name || "")); break;
            default: break;
        }

        return assets;
    }, [data, filter, sortBy]);

    if (loading) {
        return (
            <div className="health-loading">
                <Spinner size="lg" />
                <p>Analyzing asset health...</p>
            </div>
        );
    }

    if (!data?.summary) {
        return (
            <div className="health-empty">
                <p>No health data available</p>
            </div>
        );
    }

    const { summary } = data;
    const gradeColors = GRADE_COLORS[summary.averageGrade] || GRADE_COLORS.C;

    return (
        <div className="health-dashboard">
            {/* Summary Section */}
            <div className="health-summary-grid">
                {/* Main Score */}
                <div className="health-main-score" style={{ borderColor: gradeColors.ring }}>
                    <div
                        className="health-score-ring"
                        style={{
                            background: `conic-gradient(${gradeColors.ring} ${summary.averageScore * 3.6}deg, #f3f4f6 0deg)`
                        }}
                    >
                        <div className="health-score-inner">
                            <span className="health-score-number">{summary.averageScore}</span>
                            <span className="health-score-label">Fleet Score</span>
                        </div>
                    </div>
                    <div className="health-score-grade" style={{ color: gradeColors.color, background: gradeColors.bg }}>
                        Grade {summary.averageGrade}
                    </div>
                </div>

                {/* Distribution Cards */}
                {Object.entries(summary.distribution).map(([grade, count]) => {
                    const colors = GRADE_COLORS[grade];
                    const pct = summary.totalAssets > 0 ? Math.round((count / summary.totalAssets) * 100) : 0;
                    return (
                        <div
                            key={grade}
                            className={`health-dist-card ${filter === grade ? "active" : ""}`}
                            onClick={() => setFilter(filter === grade ? "all" : grade)}
                            style={{ borderColor: filter === grade ? colors.ring : "transparent" }}
                        >
                            <div className="health-dist-grade" style={{ color: colors.color, background: colors.bg }}>
                                {grade}
                            </div>
                            <div className="health-dist-count">{count}</div>
                            <div className="health-dist-bar">
                                <div
                                    className="health-dist-bar-fill"
                                    style={{ width: `${pct}%`, background: colors.ring }}
                                />
                            </div>
                            <div className="health-dist-pct">{pct}%</div>
                        </div>
                    );
                })}

                {/* Replacement Alert */}
                <div className={`health-replacement-card ${summary.replacementNeeded > 0 ? "alert" : ""}`}>
                    <div className="health-replacement-icon">
                        {summary.replacementNeeded > 0 ? "⚡" : "✅"}
                    </div>
                    <div className="health-replacement-count">{summary.replacementNeeded}</div>
                    <div className="health-replacement-label">Need Replacement</div>
                </div>
            </div>

            {/* Controls */}
            <div className="health-controls">
                <div className="health-filter-group">
                    <label>Filter:</label>
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value="all">All Grades</option>
                        <option value="A">Grade A</option>
                        <option value="B">Grade B</option>
                        <option value="C">Grade C</option>
                        <option value="D">Grade D</option>
                        <option value="F">Grade F</option>
                    </select>
                </div>
                <div className="health-filter-group">
                    <label>Sort:</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="score-asc">Worst First</option>
                        <option value="score-desc">Best First</option>
                        <option value="name">Name</option>
                    </select>
                </div>
                <span className="health-count-label">{filteredAssets.length} assets</span>
            </div>

            {/* Asset Table */}
            <div className="health-table-wrapper">
                <table className="health-table">
                    <thead>
                        <tr>
                            <th>Asset</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Health Score</th>
                            <th>Grade</th>
                            <th>Remaining Life</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAssets.map((asset, idx) => {
                            const colors = GRADE_COLORS[asset.grade] || GRADE_COLORS.C;
                            return (
                                <tr key={idx}>
                                    <td className="health-asset-name">
                                        {asset.name || asset.assetId}
                                    </td>
                                    <td>{asset.category || "—"}</td>
                                    <td>
                                        <span className={`health-status ${(asset.status || "").toLowerCase().replace(/\s/g, "-")}`}>
                                            {asset.status || "—"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="health-score-cell">
                                            <div className="health-bar">
                                                <div
                                                    className="health-bar-fill"
                                                    style={{ width: `${asset.score}%`, background: colors.ring }}
                                                />
                                            </div>
                                            <span style={{ color: colors.color, fontWeight: 700 }}>{asset.score}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className="health-grade-badge"
                                            style={{ background: colors.bg, color: colors.color }}
                                        >
                                            {asset.grade}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={asset.estimatedRemainingYears < 1 ? "text-danger" : ""}>
                                            {asset.estimatedRemainingYears} yrs
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`health-urgency ${(asset.replacementUrgency || "").toLowerCase().replace(/\s/g, "-")}`}>
                                            {asset.replacementUrgency}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filteredAssets.length === 0 && (
                    <div className="health-empty-table">
                        <p>No assets found for the selected filter</p>
                    </div>
                )}
            </div>
        </div>
    );
}
