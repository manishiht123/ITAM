import { Line } from "react-chartjs-2";

export default function AssetGrowthLine({ data }) {
  if (!data?.length) return null;

  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: "Asset Growth Over Time",
        data: data.map((d) => d.count),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.2)",
        tension: 0.3,
        fill: true,
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
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="font-semibold mb-2">Asset Growth Over Time</h3>

      {/* 👇 HEIGHT CONSTRAINT (CRITICAL) */}
      <div className="relative h-[320px] w-full">
        <Line data={chartData} options={options} redraw />
      </div>
    </div>
  );
}

