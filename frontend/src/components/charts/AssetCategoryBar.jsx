import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function AssetCategoryBar({ data }) {
  const normalized = Array.isArray(data) ? data : [];
  const chartData = {
    labels: normalized.map((entry) => entry.label),
    datasets: [
      {
        label: "Assets",
        data: normalized.map((entry) => entry.value),
        backgroundColor: normalized.map((entry, idx) => {
          const palette = ["#f0bad9", "#9306d4", "#6da316", "#f97316", "#978c8c", "#0ea5e9"];
          return palette[idx % palette.length];
        }),
        borderRadius: 8,
        barPercentage: 0.6,
        categoryPercentage: 0.7
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 8, bottom: 8 } },
    plugins: { legend: { display: false } }
  };

  if (!normalized.length) {
    return <p style={{ color: "var(--text-secondary)" }}>No category data yet.</p>;
  }

  return (
    <div style={{ height: 220 }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
