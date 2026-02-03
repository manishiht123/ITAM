export default function QuickTables({ tables }) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Quick Access</h2>

      <div className="grid grid-cols-2 gap-6">
        {tables.map((table, idx) => (
          <div key={idx} className="bg-white rounded shadow p-4">
            <h3 className="font-medium mb-2">{table.title}</h3>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  {table.columns.map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr key={i} className="border-t">
                    {row.map((cell, j) => (
                      <td key={j} className="py-1">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  );
}

