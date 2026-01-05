import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AssetStatusPie() {
  const data = {
    labels: ["In Use", "In Stock", "Under Maintenance", "Retired"],
    datasets: [
      {
        data: [1400, 300, 100, 50],
        backgroundColor: ["#4f46e5", "#22c55e", "#f97316", "#9ca3af"]
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false
  };

  return (
    <div style={{ height: 240 }}>
      <Pie data={data} options={options} />
    </div>
  );
}

