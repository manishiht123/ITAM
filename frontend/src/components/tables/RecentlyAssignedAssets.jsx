// src/components/tables/RecentlyAssignedAssets.jsx
const fallbackRows = [
  { tag: "LAP-0991", user: "Rahul Sharma", entity: "OXYZO", date: "2025-08-05" },
  { tag: "DES-2101", user: "Neha Verma", entity: "OFB", date: "2025-08-06" }
];

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toISOString().slice(0, 10);
};

export default function RecentlyAssignedAssets({ entity, rows }) {
  const data = Array.isArray(rows) ? rows : fallbackRows;
  const filtered = data.filter((row) => entity === "ALL" || row.entity === entity);

  return (
    <table width="100%">
      <thead>
        <tr>
          <th>Asset Tag</th>
          <th>User</th>
          <th>Entity</th>
          <th>Assigned On</th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((row) => (
          <tr key={row.tag}>
            <td>{row.tag}</td>
            <td>{row.user}</td>
            <td>{row.entity}</td>
            <td>{formatDate(row.date)}</td>
          </tr>
        ))}
        {!filtered.length && (
          <tr>
            <td colSpan={4} style={{ color: "var(--text-muted)" }}>
              No recent assignments.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
