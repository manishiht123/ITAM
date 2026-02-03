const fallbackItems = [
  { title: "License Compliance", status: "Compliant", color: "#dcfce7" },
  { title: "Audit Readiness", status: "Audit Ready", color: "#dcfce7" },
  { title: "Shadow IT Risk", status: "Low Risk", color: "#e0f2fe" }
];

export default function ComplianceSummary({ items }) {
  const data = Array.isArray(items) && items.length ? items : fallbackItems;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16
      }}
    >
      {data.map((item, idx) => (
        <ComplianceCard
          key={`${item.title}-${idx}`}
          title={item.title}
          status={item.status}
          color={item.color}
        />
      ))}
    </div>
  );
}

function ComplianceCard({ title, status, color }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 16,
        background: color
      }}
    >
      <p style={{ fontSize: 14 }}>{title}</p>
      <h3>{status}</h3>
    </div>
  );
}
