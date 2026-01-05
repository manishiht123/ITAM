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

export default function AssetOSBar() {
  const data = {
    labels: ["Windows", "macOS", "Linux"],
    datasets: [
      {
        label: "Assets",
        data: [1100, 450, 250],
        backgroundColor: ["#2563eb", "#111827", "#16a34a"]
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false
  };

  return (
    <div style={{ height: 260 }}>
      <Bar data={data} options={options} />
    </div>
  );
}

