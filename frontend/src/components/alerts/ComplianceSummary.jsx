import "./alerts.css";

const fallbackItems = [
  { title: "License Compliance", status: "Compliant", variant: "success" },
  { title: "Audit Readiness", status: "Audit Ready", variant: "success" },
  { title: "Shadow IT Risk", status: "Low Risk", variant: "info" }
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
          variant={item.variant || item.type || "success"}
        />
      ))}
    </div>
  );
}

function ComplianceCard({ title, status, variant }) {
  return (
    <div className={`compliance-card ${variant}`}>
      <p className="compliance-card-title">{title}</p>
      <h3 className="compliance-card-status">{status}</h3>
    </div>
  );
}
