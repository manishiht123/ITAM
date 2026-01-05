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

export default function AssetCategoryBar() {
  const data = {
    labels: ["Laptop", "Desktop", "Server", "Network", "Mobile"],
    datasets: [
      {
        label: "Assets",
        data: [900, 300, 250, 200, 150],
        backgroundColor: "#6366f1"
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

