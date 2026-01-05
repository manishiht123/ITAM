export default function ComplianceSummary() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16
      }}
    >
      <ComplianceCard
        title="License Compliance"
        status="Compliant"
        color="#dcfce7"
      />

      <ComplianceCard
        title="Audit Readiness"
        status="Audit Ready"
        color="#dcfce7"
      />

      <ComplianceCard
        title="Shadow IT Risk"
        status="Low Risk"
        color="#e0f2fe"
      />
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

