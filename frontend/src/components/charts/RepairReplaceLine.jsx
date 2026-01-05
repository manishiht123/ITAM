import { Line } from "react-chartjs-2";

export default function RepairReplaceLine({ data }) {
  if (!data?.length) return null;

  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: "Repair",
        data: data.map((d) => d.repair),
        borderColor: "#2563eb",          // blue
        backgroundColor: "rgba(37,99,235,0.2)",
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2,
        tension: 0.35,
      },
      {
        label: "Replace",
        data: data.map((d) => d.replace),
        borderColor: "#dc2626",          // red
        backgroundColor: "rgba(220,38,38,0.2)",
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2,
        tension: 0.35,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
        grid: {
          color: "#e5e7eb",
        },
      },
    },
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="font-semibold mb-2">Repair vs Replace Trend</h3>

      {/* 👇 HEIGHT CONTROL */}
      <div className="relative h-[320px] w-full">
        <Line data={chartData} options={options} redraw />
      </div>
    </div>
  );
}

