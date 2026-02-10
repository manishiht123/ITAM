import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const STATUS_ORDER = ["In Use", "Available", "Under Repair", "Retired", "Unknown"];
const STATUS_COLORS = {
  "In Use": "#19cda5",
  Available: "#22c55e",
  "Under Repair": "#f97316",
  Retired: "#9ca3af",
  Unknown: "#94a3b8"
};

export default function AssetStatusPie({ data }) {
  const normalized = Array.isArray(data) ? data : [];
  const ordered = STATUS_ORDER.flatMap((status) =>
    normalized.find((entry) => entry.label === status) || []
  );
  const extras = normalized.filter(
    (entry) => !STATUS_ORDER.includes(entry.label)
  );
  const finalData = [...ordered, ...extras];

  const chartData = {
    labels: finalData.map((entry) => entry.label),
    datasets: [
      {
        data: finalData.map((entry) => entry.value),
        backgroundColor: finalData.map(
          (entry) => STATUS_COLORS[entry.label] || "#94a3b8"
        ),
        borderColor: "rgba(255,255,255,0.85)",
        borderWidth: 2,
        hoverOffset: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "35%",
    plugins: {
      legend: {
        position: "bottom"
      }
    }
  };

  if (!finalData.length) {
    return <p style={{ color: "var(--text-secondary)" }}>No asset status data yet.</p>;
  }

  const shadowPlugin = {
    id: "shadowPie",
    beforeDatasetsDraw: (chart) => {
      const { ctx } = chart;
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
    },
    afterDatasetsDraw: (chart) => {
      chart.ctx.restore();
    }
  };

  return (
    <div style={{ height: 260 }}>
      <Doughnut data={chartData} options={options} plugins={[shadowPlugin]} />
    </div>
  );
}
