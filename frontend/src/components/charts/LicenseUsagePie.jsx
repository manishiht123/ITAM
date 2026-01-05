import { Pie } from "react-chartjs-2";

export default function LicenseUsagePie({ data }) {
  if (!data?.length) return null;

  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: [
          "#4f46e5", // Used
          "#16a34a", // Available
          "#dc2626", // Over-allocated
        ],
        borderWidth: 1,
        cutout: "65%", // ✅ donut style (recommended)
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
    },
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="font-semibold mb-2">License Usage</h3>

      {/* 👇 SAME SIZE CONSTRAINT AS OTHER PIE */}
      <div className="relative h-[260px] w-[260px] mx-auto">
        <Pie data={chartData} options={options} redraw />
      </div>
    </div>
  );
}

