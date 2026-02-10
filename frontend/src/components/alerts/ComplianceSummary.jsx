import "./alerts.css";

const fallbackItems = [
  { title: "License Compliance", status: "Compliant", color: "var(--feedback-success-bg)" },
  { title: "Audit Readiness", status: "Audit Ready", color: "var(--feedback-success-bg)" },
  { title: "Shadow IT Risk", status: "Low Risk", color: "var(--feedback-info-bg)" }
];

export default function ComplianceSummary({ items }) {
  const data = Array.isArray(items) && items.length ? items : fallbackItems;
  return (
    <div className="compliance-grid">
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
    <div className="compliance-card" style={{ background: color }}>
      <p className="compliance-card-title">{title}</p>
      <h3 className="compliance-card-status">{status}</h3>
    </div>
  );
}
