import { Line } from "react-chartjs-2";

export default function RepairReplaceLine({ data }) {
  if (!data?.length) return null;

  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: "Repair",
        data: data.map((d) => d.repair),
        borderColor: "#19cbbf",
        backgroundColor: "rgba(25, 203, 191, 0.2)",
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2,
        tension: 0.35,
      },
      {
        label: "Replace",
        data: data.map((d) => d.replace),
        borderColor: "#dc2626",
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
          color: "rgba(0,0,0,0.06)",
        },
      },
    },
  };

  return (
    <div className="chart-card">
      <h3>Repair vs Replace Trend</h3>
      <div style={{ position: "relative", height: "320px", width: "100%" }}>
        <Line data={chartData} options={options} redraw />
      </div>
    </div>
  );
}
