// src/components/tables/UpcomingRenewals.jsx
export default function UpcomingRenewals({ entity }) {
  const data = [
    { name: "Microsoft 365", type: "License", date: "2025-09-01" },
    { name: "Dell Latitude", type: "Asset", date: "2025-09-10" }
  ];

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
            <td>{row.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

