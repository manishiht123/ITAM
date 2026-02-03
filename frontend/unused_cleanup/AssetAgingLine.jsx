import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function AssetAgingLine({ data = [] }) {
  const chartData = {
    labels: ["0-1 Yr", "1-2 Yr", "2-3 Yr", "3-4 Yr", "4+ Yr"],
    datasets: [
      {
        label: "Assets",
        data,
        borderColor: "#64748b",
        backgroundColor: "#64748b",
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: "#f1f5f9" } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div style={{ height: 240 }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

