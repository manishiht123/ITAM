import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useMemo } from "react";

ChartJS.register(ArcElement, Tooltip, Legend);

// Match by name pattern for flexibility
const COLOR_RULES = [
  { match: /used seat|seats used|^used$/i,    color: "#0ea5e9" },
  { match: /available seat|^available$/i,      color: "#22c55e" },
  { match: /over.alloc|overalloc/i,            color: "#ef4444" },
];
const FALLBACK_PALETTE = ["#0ea5e9", "#22c55e", "#ef4444", "#a78bfa", "#f97316", "#64748b"];

function getColor(name, idx) {
  const rule = COLOR_RULES.find(r => r.match.test(name || ""));
  return rule ? rule.color : FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length];
}

export default function LicenseUsagePie({ data }) {
  const isNoData = !Array.isArray(data) || data.length === 0 || data.every(d => !Number(d.value));
  const finalData = isNoData ? [] : data;
  const total = finalData.reduce((s, d) => s + (Number(d.value) || 0), 0);

  const chartData = useMemo(() => {
    // Match card background per theme so segment gaps are invisible
    const cardBg = document.documentElement.getAttribute("data-theme") === "dark" ? "#0f2034" : "#ffffff";
    return {
      labels: finalData.map(d => d.name),
      datasets: [{
        data: finalData.map(d => d.value),
        backgroundColor: finalData.map((d, i) => getColor(d.name, i)),
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
            return `  ${val} seats  ·  ${pct}%`;
          }
        }
      }
    }
  };

  if (!finalData.length) {
    return <p style={{ color: "var(--text-secondary)", padding: 16 }}>No license usage data yet.</p>;
  }

  return (
    <div className="digital-pie-wrap">
      <div className="digital-pie-canvas">
        <Doughnut data={chartData} options={options} plugins={[]} />
        {total > 0 && (
          <div className="dpc-center">
            <span className="dpc-num">{total}</span>
            <div className="dpc-line" />
            <span className="dpc-lbl">Total Seats</span>
          </div>
        )}
      </div>

      <div className="digital-pie-legend">
        {finalData.map((entry, i) => {
          const color = getColor(entry.name, i);
          const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0";
          return (
            <div key={i} className="dpl-row">
              <div className="dpl-row-top">
                <span className="dpl-dot" style={{ background: color }} />
                <span className="dpl-label">{entry.name}</span>
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
