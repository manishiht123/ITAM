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

// Center text plugin
const centerTextPlugin = {
  id: "centerTextLicense",
  afterDraw(chart) {
    const { ctx, data, chartArea } = chart;
    if (!chartArea) return;
    const total = (data.datasets[0]?.data || []).reduce((s, v) => s + (Number(v) || 0), 0);
    if (!total) return;

    const cx = (chartArea.left + chartArea.right) / 2;
    const cy = (chartArea.top + chartArea.bottom) / 2;

    const styles = getComputedStyle(document.documentElement);
    const textColor = styles.getPropertyValue("--text-primary").trim() || "#0f172a";
    const subColor  = styles.getPropertyValue("--text-secondary").trim() || "#64748b";

    ctx.save();
    ctx.font = "bold 30px Inter, sans-serif";
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(total, cx, cy - 11);

    ctx.font = "500 11px Inter, sans-serif";
    ctx.fillStyle = subColor;
    ctx.fillText("Total Seats", cx, cy + 13);
    ctx.restore();
  }
};

export default function LicenseUsagePie({ data }) {
  const isNoData = !Array.isArray(data) || data.length === 0 || data.every(d => !Number(d.value));
  const finalData = isNoData ? [] : data;
  const total = finalData.reduce((s, d) => s + (Number(d.value) || 0), 0);

  // dep on `data` so memo actually caches
  const chartData = useMemo(() => ({
    labels: finalData.map(d => d.name),
    datasets: [{
      data: finalData.map(d => d.value),
      backgroundColor: finalData.map((d, i) => getColor(d.name, i)),
      // borderColor matching card bg creates clean gaps
      borderColor: "rgba(13,20,38,0.95)",
      borderWidth: 2.5,
      hoverOffset: 12,
      hoverBorderWidth: 0,
    }]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    animation: {
      animateRotate: true,
      animateScale: false,
      duration: 900,
      easing: "easeInOutQuart"
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(13,20,38,0.95)",
        titleColor: "#f1f5f9",
        bodyColor: "#94a3b8",
        borderColor: "rgba(255,255,255,0.07)",
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
        <Doughnut data={chartData} options={options} plugins={[centerTextPlugin]} />
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
