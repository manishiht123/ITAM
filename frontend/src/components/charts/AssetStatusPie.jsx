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
  "In Use":       "#10d9a4",
  "Available":    "#22c55e",
  "Under Repair": "#f97316",
  "Retired":      "#a78bfa",
  "Unknown":      "#64748b",
};

// Center text plugin — shows total count + label
const centerTextPlugin = {
  id: "centerText",
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
    ctx.fillText("Total Assets", cx, cy + 13);
    ctx.restore();
  }
};

export default function AssetStatusPie({ data }) {
  const normalized = Array.isArray(data) ? data : [];
  const ordered = STATUS_ORDER.flatMap(s => normalized.find(e => e.label === s) || []);
  const extras  = normalized.filter(e => !STATUS_ORDER.includes(e.label));
  const finalData = [...ordered, ...extras];

  const total = finalData.reduce((s, e) => s + (Number(e.value) || 0), 0);

  // dep on `data` so memo actually caches
  const chartData = useMemo(() => ({
    labels: finalData.map(e => e.label),
    datasets: [{
      data: finalData.map(e => e.value),
      backgroundColor: finalData.map(e => STATUS_COLORS[e.label] || "#64748b"),
      // borderColor matching card bg creates clean gaps between segments
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
        <Doughnut data={chartData} options={options} plugins={[centerTextPlugin]} />
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
