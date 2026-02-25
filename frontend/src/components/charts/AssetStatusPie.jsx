import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useMemo } from "react";

ChartJS.register(ArcElement, Tooltip, Legend);

const STATUS_ORDER = ["In Use", "Available", "Under Repair", "Retired", "Unknown"];

const STATUS_COLORS = {
  "In Use":       "#2563eb",   // blue  — clearly distinct from Available
  "Available":    "#22c55e",   // green
  "Under Repair": "#f97316",   // orange
  "Retired":      "#a78bfa",   // lavender
  "Unknown":      "#64748b",   // slate
};

export default function AssetStatusPie({ data }) {
  const normalized = Array.isArray(data) ? data : [];
  const ordered = STATUS_ORDER.flatMap(s => normalized.find(e => e.label === s) || []);
  const extras  = normalized.filter(e => !STATUS_ORDER.includes(e.label));
  const finalData = [...ordered, ...extras];

  const total = finalData.reduce((s, e) => s + (Number(e.value) || 0), 0);

  const chartData = useMemo(() => {
    // Match card background per theme so segment gaps are invisible
    const cardBg = document.documentElement.getAttribute("data-theme") === "dark" ? "#0f2034" : "#ffffff";
    return {
      labels: finalData.map(e => e.label),
      datasets: [{
        data: finalData.map(e => e.value),
        backgroundColor: finalData.map(e => STATUS_COLORS[e.label] || "#64748b"),
        borderColor: cardBg,
        borderWidth: 3,
        hoverOffset: 16,
        hoverBorderWidth: 0,
      }]
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "66%",
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 900,
      easing: "easeInOutQuart"
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(10,17,32,0.96)",
        titleColor: "#f1f5f9",
        bodyColor: "#94a3b8",
        borderColor: "rgba(26,159,231,0.25)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label(ctx) {
            const val = ctx.parsed;
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
            return `  ${val} assets  ·  ${pct}%`;
          }
        }
      }
    }
  };

  if (!finalData.length) {
    return <p style={{ color: "var(--text-secondary)", padding: 16 }}>No asset status data yet.</p>;
  }

  return (
    <div className="digital-pie-wrap">
      <div className="digital-pie-canvas">
        <Doughnut data={chartData} options={options} plugins={[]} />
        {total > 0 && (
          <div className="dpc-center">
            <span className="dpc-num">{total}</span>
            <div className="dpc-line" />
            <span className="dpc-lbl">Total Assets</span>
          </div>
        )}
      </div>

      <div className="digital-pie-legend">
        {finalData.map((entry, i) => {
          const color = STATUS_COLORS[entry.label] || "#64748b";
          const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0";
          return (
            <div key={i} className="dpl-row">
              <div className="dpl-row-top">
                <span className="dpl-dot" style={{ background: color }} />
                <span className="dpl-label">{entry.label}</span>
                <span className="dpl-count">{entry.value}</span>
                <span className="dpl-pct">{pct}%</span>
              </div>
              <div className="dpl-bar-wrap">
                <div className="dpl-bar" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
