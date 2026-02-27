import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useMemo } from "react";

ChartJS.register(ArcElement, Tooltip, Legend);

// Shared cursor positioner (safe to re-register)
Tooltip.positioners.cursor = function(_, eventPosition) {
  return { x: eventPosition.x, y: eventPosition.y };
};

const STATUS_COLORS = {
  "Active":    "#22c55e",
  "Expired":   "#ef4444",
  "Suspended": "#f97316",
  "Unknown":   "#64748b",
};
const STATUS_ORDER = ["Active", "Expired", "Suspended"];

export default function SoftwareLicenseTypePie({ data }) {
  const normalized = Array.isArray(data) ? data : [];
  const ordered = STATUS_ORDER.flatMap(s => normalized.find(e => e.label === s) || []);
  const extras  = normalized.filter(e => !STATUS_ORDER.includes(e.label));
  const finalData = [...ordered, ...extras];

  const total = finalData.reduce((s, e) => s + (Number(e.value) || 0), 0);

  const chartData = useMemo(() => {
    const cardBg = document.documentElement.getAttribute("data-theme") === "dark"
      ? "#0f2034"
      : "#ffffff";
    return {
      labels: finalData.map(e => e.label),
      datasets: [{
        data: finalData.map(e => e.value),
        backgroundColor: finalData.map(e => STATUS_COLORS[e.label] || "#64748b"),
        borderColor: cardBg,
        borderWidth: 3,
        hoverOffset: 14,
        hoverBorderWidth: 0,
      }]
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "52%",
    layout: { padding: 12 },
    animation: { animateRotate: true, animateScale: true, duration: 900, easing: "easeInOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: {
        position: "cursor",
        backgroundColor: "rgba(10,17,32,0.96)",
        titleColor: "#f1f5f9",
        bodyColor: "#94a3b8",
        borderColor: "rgba(26,159,231,0.25)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label(ctx) {
            const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
            return `  ${ctx.parsed} license${ctx.parsed !== 1 ? "s" : ""}  ·  ${pct}%`;
          }
        }
      }
    }
  };

  if (!finalData.length) {
    return <p style={{ color: "var(--text-secondary)", padding: 16 }}>No license data yet.</p>;
  }

  return (
    <div className="digital-pie-wrap">
      <div className="digital-pie-canvas">
        <Doughnut data={chartData} options={options} plugins={[]} />
        {total > 0 && (
          <div className="dpc-center">
            <span className="dpc-num">{total}</span>
            <div className="dpc-line" />
            <span className="dpc-lbl">Licenses</span>
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
