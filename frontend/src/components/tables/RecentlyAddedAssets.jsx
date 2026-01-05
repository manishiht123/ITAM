// src/components/tables/RecentlyAddedAssets.jsx
export default function RecentlyAddedAssets({ entity }) {
  const data = [
    { tag: "LAP-1023", type: "Laptop", entity: "OXYZO", date: "2025-08-01" },
    { tag: "SRV-2210", type: "Server", entity: "OFB", date: "2025-08-03" }
  ];

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
        {data
          .filter(r => entity === "ALL" || r.entity === entity)
          .map(row => (
            <tr key={row.tag}>
              <td>{row.tag}</td>
              <td>{row.type}</td>
              <td>{row.entity}</td>
              <td>{row.date}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

