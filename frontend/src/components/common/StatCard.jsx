export default function StatCard({ title, value, warning, danger }) {
  let color = "text-gray-800";

  if (warning) color = "text-yellow-600";
  if (danger) color = "text-red-600";

  return (
    <div className="bg-white rounded shadow p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

