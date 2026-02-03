// src/components/tables/UpcomingRenewals.jsx
const fallbackRows = [
  { name: "Microsoft 365", type: "License", date: "2025-09-01" },
  { name: "Dell Latitude", type: "Asset", date: "2025-09-10" }
];

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toISOString().slice(0, 10);
};

export default function UpcomingRenewals({ rows }) {
  const data = Array.isArray(rows) ? rows : fallbackRows;

  return (
    <table width="100%">
      <thead>
        <tr>
          <th>Item</th>
          <th>Type</th>
          <th>Renewal Date</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            <td>{row.name}</td>
            <td>{row.type}</td>
            <td>{formatDate(row.date)}</td>
          </tr>
        ))}
        {!data.length && (
          <tr>
            <td colSpan={3} style={{ color: "#6b7280" }}>
              No upcoming renewals.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
