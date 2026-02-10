import { Line } from "react-chartjs-2";

export default function AssetGrowthLine({ data }) {
  if (!data?.length) return null;

  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: "Asset Growth Over Time",
        data: data.map((d) => d.count),
        borderColor: "#19cbbf",
        backgroundColor: "rgba(25, 203, 191, 0.2)",
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
    <div className="chart-card">
      <h3>Asset Growth Over Time</h3>
      <div style={{ position: "relative", height: "320px", width: "100%" }}>
        <Line data={chartData} options={options} redraw />
      </div>
    </div>
  );
}
