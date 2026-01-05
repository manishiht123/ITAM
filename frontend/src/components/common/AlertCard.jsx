export default function AlertCard({ title, count, severity }) {
  const colorMap = {
    high: "border-red-500 text-red-600",
    medium: "border-yellow-500 text-yellow-600",
    low: "border-gray-300 text-gray-600",
  };

  return (
    <div className={`border-l-4 bg-white p-4 shadow ${colorMap[severity]}`}>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xl font-bold">{count}</div>
    </div>
  );
}

