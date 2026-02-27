import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useMemo } from "react";

ChartJS.register(ArcElement, Tooltip, Legend);

// Tooltip follows the cursor so it never overlaps the center label
Tooltip.positioners.cursor = function(_, eventPosition) {
  return { x: eventPosition.x, y: eventPosition.y };
};

const PALETTE = [
  "#0ea5e9", "#22c55e", "#a78bfa", "#f97316",
  "#f43f5e", "#eab308", "#14b8a6", "#6366f1",
  "#84cc16", "#ec4899", "#0891b2", "#d97706",
];

export default function LicenseUsagePie({ data }) {
  const isNoData = !Array.isArray(data) || data.length === 0;
  const items = isNoData ? [] : data;
  const totalUsed = items.reduce((s, d) => s + (d.seatsUsed || 0), 0);

  const chartData = useMemo(() => {
    const cardBg = document.documentElement.getAttribute("data-theme") === "dark"
      ? "#0f2034"
      : "#ffffff";
    return {
      labels: items.map((d) => d.name),
      datasets: [{
        data: items.map((d) => d.seatsUsed || 0),
        backgroundColor: items.map((_, i) => PALETTE[i % PALETTE.length]),
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
            const item = items[ctx.dataIndex];
            const pct = totalUsed > 0 ? ((ctx.parsed / totalUsed) * 100).toFixed(1) : 0;
            return `  ${ctx.parsed} / ${item?.seatsOwned ?? "?"} seats  ·  ${pct}%`;
          }
        }
      }
    }
  };

  if (!items.length) {
    return <p style={{ color: "var(--text-secondary)", padding: 16 }}>No license data yet.</p>;
  }

  return (
    <div className="digital-pie-wrap">
      <div className="digital-pie-canvas">
        <Doughnut data={chartData} options={options} plugins={[]} />
        {totalUsed > 0 && (
          <div className="dpc-center">
            <span className="dpc-num">{totalUsed}</span>
            <div className="dpc-line" />
            <span className="dpc-lbl">Used Seats</span>
          </div>
        )}
      </div>

      <div className="digital-pie-legend">
        {items.map((entry, i) => {
          const color = PALETTE[i % PALETTE.length];
          const pct = totalUsed > 0 ? ((entry.seatsUsed / totalUsed) * 100).toFixed(1) : "0.0";
          const utilPct = entry.seatsOwned > 0
            ? Math.min(100, ((entry.seatsUsed / entry.seatsOwned) * 100)).toFixed(0)
            : 0;
          const isOver = entry.seatsUsed > entry.seatsOwned;
          return (
            <div key={i} className="dpl-row">
              <div className="dpl-row-top">
                <span className="dpl-dot" style={{ background: color }} />
                <span className="dpl-label" title={entry.name}>{entry.name}</span>
                <span className="dpl-count" style={{ color: isOver ? "#ef4444" : undefined }}>
                  {entry.seatsUsed}
                  <span style={{ opacity: 0.5, fontWeight: 400 }}>/{entry.seatsOwned}</span>
                </span>
                <span className="dpl-pct">{pct}%</span>
              </div>
              <div className="dpl-bar-wrap">
                <div
                  className="dpl-bar"
                  style={{
                    width: `${utilPct}%`,
                    background: isOver ? "#ef4444" : color
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
