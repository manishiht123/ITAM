import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaExchangeAlt, FaHistory } from "react-icons/fa";

/**
 * PHASE 3 – Assignment & Ownership
 * Industry-standard operational table
 */

const fallbackAssignments = [
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

export default function AssignmentTable({ entity, rows }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");

  const assignments = Array.isArray(rows) ? rows : fallbackAssignments;

  const filtered = assignments.filter(
    (a) =>
      (entity === "ALL" || a.entity === entity) &&
      (String(a.assetTag).toLowerCase().includes(filter.toLowerCase()) ||
        String(a.user || "").toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div>
      <style>{`
        .asgn-icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-size: 13px;
          transition: background 0.18s, color 0.18s, transform 0.15s;
          background: transparent;
        }
        .asgn-icon-btn:hover { transform: scale(1.12); }
        .asgn-icon-btn.reassign { color: var(--primary); background: var(--primary-soft); }
        .asgn-icon-btn.reassign:hover { background: var(--primary); color: #fff; }
        .asgn-icon-btn.history { color: #7c3aed; background: #ede9fe; }
        .asgn-icon-btn.history:hover { background: #7c3aed; color: #fff; }
        [data-theme="dark"] .asgn-icon-btn.history { background: rgba(124,58,237,0.15); }
      `}</style>

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
          border: "1px solid var(--border)"
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
          <tr style={{ background: "var(--bg-muted)", textAlign: "left" }}>
            <th style={th}>Asset Tag</th>
            <th style={th}>Type</th>
            <th style={th}>User</th>
            <th style={th}>Department</th>
            <th style={th}>Entity</th>
            <th style={th}>Status</th>
            <th style={thActions}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filtered.length ? (
            filtered.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>{row.assetTag}</td>
                <td style={td}>{row.assetType}</td>
                <td style={td}>{row.user}</td>
                <td style={td}>{row.department}</td>
                <td style={td}>{row.entity}</td>
                <td style={td}>
                  <StatusBadge status={row.status} />
                </td>
                <td style={tdActions}>
                  <div style={actionGroup}>
                    <button
                      className="asgn-icon-btn reassign"
                      title="Reassign Asset"
                      onClick={() => {
                        const targetEntity = row.entity || entity;
                        navigate(
                          `/assets/allocate?asset=${encodeURIComponent(
                            row.assetTag
                          )}&entity=${encodeURIComponent(targetEntity)}`
                        );
                      }}
                    >
                      <FaExchangeAlt />
                    </button>
                    <button
                      className="asgn-icon-btn history"
                      title="View History"
                      onClick={() => {
                        const targetEntity = row.entity || entity;
                        navigate(
                          `/assets/allocate?history=1&entity=${encodeURIComponent(
                            targetEntity
                          )}`
                        );
                      }}
                    >
                      <FaHistory />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td style={{ ...td, color: "var(--text-muted)" }} colSpan={7}>
                No assignments found.
              </td>
            </tr>
          )}
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
      ? "var(--success)"
      : status === "Unassigned"
      ? "var(--warning)"
      : "var(--text-muted)";

  const bg =
    status === "Assigned"
      ? "var(--feedback-success-bg)"
      : status === "Unassigned"
      ? "var(--feedback-warning-bg)"
      : "var(--bg-muted)";

  return (
    <span
      style={{
        padding: "4px 8px",
        borderRadius: 12,
        background: bg,
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
  borderBottom: "1px solid var(--border)"
};

const td = {
  padding: 12
};

const thActions = {
  ...th,
  width: 90,
  minWidth: 90
};

const tdActions = {
  ...td,
  width: 90,
  minWidth: 90
};

const actionGroup = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  whiteSpace: "nowrap"
};
