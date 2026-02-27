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

const PALETTE = [
  "#0ea5e9", "#22c55e", "#a78bfa", "#f97316",
  "#f43f5e", "#eab308", "#14b8a6", "#6366f1",
  "#84cc16", "#ec4899", "#0891b2", "#d97706",
];

/**
 * Generic reusable doughnut chart.
 * @param {Array}  data         – [{ label: string, value: number }]
 * @param {Object} colors       – { [label]: "#hex" }  (falls back to PALETTE)
 * @param {string} centerLabel  – label below the center number
 */
export default function GenericDoughnutPie({ data, colors = {}, centerLabel = "Total" }) {
  const items = Array.isArray(data) ? data.filter(d => d.value > 0) : [];
  const total = items.reduce((s, d) => s + (Number(d.value) || 0), 0);

  const getColor = (label, index) => colors[label] || PALETTE[index % PALETTE.length];

  const chartData = useMemo(() => {
    const cardBg = document.documentElement.getAttribute("data-theme") === "dark"
      ? "#0f2034"
      : "#ffffff";
    return {
      labels: items.map(d => d.label),
      datasets: [{
        data: items.map(d => d.value),
        backgroundColor: items.map((d, i) => getColor(d.label, i)),
        borderColor: cardBg,
        borderWidth: 3,
        hoverOffset: 14,
        hoverBorderWidth: 0,
      }]
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, colors]);

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
            return `  ${ctx.parsed}  ·  ${pct}%`;
          }
        }
      }
    }
  };

  if (!items.length) {
    return <p style={{ color: "var(--text-secondary)", padding: 16 }}>No data yet.</p>;
  }

  return (
    <div className="digital-pie-wrap">
      <div className="digital-pie-canvas">
        <Doughnut data={chartData} options={options} plugins={[]} />
        {total > 0 && (
          <div className="dpc-center">
            <span className="dpc-num">{total}</span>
            <div className="dpc-line" />
            <span className="dpc-lbl">{centerLabel}</span>
          </div>
        )}
      </div>

      <div className="digital-pie-legend">
        {items.map((entry, i) => {
          const color = getColor(entry.label, i);
          const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0";
          return (
            <div key={i} className="dpl-row">
              <div className="dpl-row-top">
                <span className="dpl-dot" style={{ background: color }} />
                <span className="dpl-label" title={entry.label}>{entry.label}</span>
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
