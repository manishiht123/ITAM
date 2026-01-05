import { useState } from "react";

/**
 * PHASE 3 – Assignment & Ownership
 * Industry-standard operational table
 */

export default function AssignmentTable({ entity }) {
  const [filter, setFilter] = useState("");

  // MOCK DATA (Phase 6 → replace with API)
  const assignments = [
    {
      assetTag: "LAP-0991",
      assetType: "Laptop",
      user: "Rahul Sharma",
      department: "Sales",
      entity: "OXYZO",
      status: "Assigned"
    },
    {
      assetTag: "DES-2101",
      assetType: "Desktop",
      user: "Neha Verma",
      department: "Finance",
      entity: "OFB",
      status: "Assigned"
    },
    {
      assetTag: "LAP-1203",
      assetType: "Laptop",
      user: "—",
      department: "—",
      entity: "OXYZO",
      status: "Unassigned"
    }
  ];

  const filtered = assignments.filter(
    (a) =>
      (entity === "ALL" || a.entity === entity) &&
      (a.assetTag.toLowerCase().includes(filter.toLowerCase()) ||
        a.user.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div>
      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search by asset or user..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{
          padding: 8,
          marginBottom: 12,
          width: "100%",
          borderRadius: 6,
          border: "1px solid #d1d5db"
        }}
      />

      {/* TABLE */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14
        }}
      >
        <thead>
          <tr style={{ background: "#f9fafb", textAlign: "left" }}>
            <th style={th}>Asset Tag</th>
            <th style={th}>Type</th>
            <th style={th}>User</th>
            <th style={th}>Department</th>
            <th style={th}>Entity</th>
            <th style={th}>Status</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((row, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={td}>{row.assetTag}</td>
              <td style={td}>{row.assetType}</td>
              <td style={td}>{row.user}</td>
              <td style={td}>{row.department}</td>
              <td style={td}>{row.entity}</td>
              <td style={td}>
                <StatusBadge status={row.status} />
              </td>
              <td style={td}>
                <button style={btn}>Reassign</button>
                <button style={{ ...btn, marginLeft: 8 }}>History</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =========================
   SMALL UI HELPERS
   ========================= */

function StatusBadge({ status }) {
  const color =
    status === "Assigned"
      ? "#16a34a"
      : status === "Unassigned"
      ? "#f59e0b"
      : "#6b7280";

  return (
    <span
      style={{
        padding: "4px 8px",
        borderRadius: 12,
        background: `${color}20`,
        color,
        fontSize: 12
      }}
    >
      {status}
    </span>
  );
}

const th = {
  padding: 12,
  borderBottom: "1px solid #e5e7eb"
};

const td = {
  padding: 12
};

const btn = {
  padding: "6px 10px",
  fontSize: 12,
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "#fff",
  cursor: "pointer"
};

