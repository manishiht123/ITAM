// src/components/tables/AssetsNeedingAttention.jsx
const fallbackRows = [
  { item: "LAP-0771", issue: "Warranty Expiring", severity: "High" },
  { item: "LIC-CRM-12", issue: "License Overused", severity: "High" }
];

export default function AssetsNeedingAttention({ rows }) {
  const data = Array.isArray(rows) ? rows : fallbackRows;

  return (
    <table width="100%">
      <thead>
        <tr>
          <th>Asset / License</th>
          <th>Issue</th>
          <th>Severity</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            <td>{row.item}</td>
            <td>{row.issue}</td>
            <td style={{ color: row.severity === "High" ? "var(--danger)" : "var(--feedback-warning-text)" }}>
              {row.severity}
            </td>
          </tr>
        ))}
        {!data.length && (
          <tr>
            <td colSpan={3} style={{ color: "var(--text-muted)" }}>
              No attention items.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
