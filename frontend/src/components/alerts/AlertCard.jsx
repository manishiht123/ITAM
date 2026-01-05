const COLORS = {
  critical: "#fee2e2",
  warning: "#fef3c7"
};

export default function AlertCard({ title, value, description, severity }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 16,
        background: COLORS[severity] || "#fff"
      }}
    >
      <h4 style={{ marginBottom: 8 }}>{title}</h4>
      <h2>{value}</h2>
      <p style={{ fontSize: 13, color: "#374151" }}>{description}</p>
    </div>
  );
}

