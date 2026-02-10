import { Doughnut } from "react-chartjs-2";

export default function LicenseUsagePie({ data }) {
  const total = Array.isArray(data)
    ? data.reduce((sum, item) => sum + Number(item.value || 0), 0)
    : 0;
  const safeData =
    data?.length && total > 0
      ? data
      : [{ name: "No Data", value: 1 }];

  const chartData = {
    labels: safeData.map((d) => d.name),
    datasets: [
      {
        data: safeData.map((d) => d.value),
        backgroundColor:
          safeData.length === 1 && safeData[0].name === "No Data"
            ? ["#e5e7eb"]
            : [
                "#19cda5", // Used
                "#16a34a", // Available
                "#dc2626", // Over-allocated
              ],
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.85)",
        hoverOffset: 6
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "35%",
    plugins: {
      legend: {
        position: "bottom",
      },
    },
  };

  const shadowPlugin = {
    id: "shadowPie",
    beforeDatasetsDraw: (chart) => {
      const { ctx } = chart;
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
    },
    afterDatasetsDraw: (chart) => {
      chart.ctx.restore();
    }
  };

  return (
    <div style={{ height: 260 }}>
      <Doughnut data={chartData} options={options} plugins={[shadowPlugin]} redraw />
    </div>
  );
}
