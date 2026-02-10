// src/components/tables/RecentlyAddedAssets.jsx
const fallbackRows = [
  { tag: "LAP-1023", type: "Laptop", entity: "OXYZO", date: "2025-08-01" },
  { tag: "SRV-2210", type: "Server", entity: "OFB", date: "2025-08-03" }
];

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toISOString().slice(0, 10);
};

export default function RecentlyAddedAssets({ entity, rows }) {
  const data = Array.isArray(rows) ? rows : fallbackRows;
  const filtered = data.filter((row) => entity === "ALL" || row.entity === entity);

  return (
    <table width="100%">
      <thead>
        <tr>
          <th>Asset Tag</th>
          <th>Type</th>
          <th>Entity</th>
          <th>Added On</th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((row) => (
          <tr key={row.tag}>
            <td>{row.tag}</td>
            <td>{row.type}</td>
            <td>{row.entity}</td>
            <td>{formatDate(row.date)}</td>
          </tr>
        ))}
        {!filtered.length && (
          <tr>
            <td colSpan={4} style={{ color: "var(--text-muted)" }}>
              No recent assets.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
