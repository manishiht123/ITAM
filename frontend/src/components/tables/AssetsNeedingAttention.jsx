// src/components/tables/AssetsNeedingAttention.jsx
export default function AssetsNeedingAttention({ entity }) {
  const data = [
    { item: "LAP-0771", issue: "Warranty Expiring", severity: "High" },
    { item: "LIC-CRM-12", issue: "License Overused", severity: "High" }
  ];

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
            <td style={{ color: "red" }}>{row.severity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

