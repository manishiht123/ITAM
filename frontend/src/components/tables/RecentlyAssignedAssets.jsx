// src/components/tables/RecentlyAssignedAssets.jsx
export default function RecentlyAssignedAssets({ entity }) {
  const data = [
    { tag: "LAP-0991", user: "Rahul Sharma", entity: "OXYZO", date: "2025-08-05" },
    { tag: "DES-2101", user: "Neha Verma", entity: "OFB", date: "2025-08-06" }
  ];

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
        {data
          .filter(r => entity === "ALL" || r.entity === entity)
          .map(row => (
            <tr key={row.tag}>
              <td>{row.tag}</td>
              <td>{row.user}</td>
              <td>{row.entity}</td>
              <td>{row.date}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

