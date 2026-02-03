import "./Reports.css";

export default function Reports() {
  const kpis = [
    { label: "Assets Tracked", value: "4,820" },
    { label: "Compliance Score", value: "92%" },
    { label: "Licenses Overused", value: "13" },
    { label: "Upcoming Renewals", value: "28" }
  ];

  const templates = [
    {
      title: "Asset Inventory Summary",
      description: "Counts by category, status, and entity with last audit date."
    },
    {
      title: "License Compliance",
      description: "Owned vs. used seats with overage and renewal timeline."
    },
    {
      title: "Assignment & Ownership",
      description: "Assigned vs. unassigned assets, users, and departments."
    }
  ];

  const recentExports = [
    { id: 1, name: "Monthly Asset Inventory", owner: "Admin", date: "2026-01-22", status: "Completed" },
    { id: 2, name: "License Compliance Q4", owner: "IT Ops", date: "2026-01-15", status: "Completed" },
    { id: 3, name: "Upcoming Renewals", owner: "Audit", date: "2026-01-10", status: "Scheduled" }
  ];

  const downloadCsv = (rows, filename) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map((row) => headers.map((h) => row[h]).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h1>Reports</h1>
          <p>Generate audit-ready exports and scheduled reports across assets, licenses, and compliance.</p>
        </div>
        <div className="reports-actions">
          <button
            className="asset-action-btn secondary"
            onClick={() => alert("Report scheduling is coming soon.")}
          >
            Schedule Report
          </button>
          <button
            className="asset-action-btn primary"
            onClick={() => alert("Report builder is coming soon.")}
          >
            Create Report
          </button>
        </div>
      </div>

      <div className="reports-grid">
        <div className="card">
          <div className="kpi-row">
            {kpis.map((kpi) => (
              <div className="kpi" key={kpi.label}>
                <h3>{kpi.label}</h3>
                <strong>{kpi.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Report Templates</div>
          <div className="report-tiles">
            {templates.map((item) => (
              <div className="report-tile" key={item.title}>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <button
                  className="asset-action-btn secondary"
                  onClick={() => downloadCsv(recentExports, "report_export.csv")}
                >
                  Generate
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Filters</div>
          <div className="filters">
            <input placeholder="Search reports..." />
            <select>
              <option>All entities</option>
              <option>OFB</option>
              <option>OXYZO</option>
            </select>
            <select>
              <option>Last 30 days</option>
              <option>Last 7 days</option>
              <option>Quarter to date</option>
              <option>Year to date</option>
            </select>
            <select>
              <option>All types</option>
              <option>Inventory</option>
              <option>Compliance</option>
              <option>Audit</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Recent Exports</div>
          <table className="table">
            <thead>
              <tr>
                <th>Report</th>
                <th>Owner</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentExports.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.owner}</td>
                  <td>{row.date}</td>
                  <td>
                    <span className={`status-chip ${row.status === "Scheduled" ? "watch" : "good"}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
