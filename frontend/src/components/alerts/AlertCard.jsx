const COLORS = {
  critical: "var(--feedback-danger-bg)",
  warning: "var(--feedback-warning-bg)"
};

export default function AlertCard({ title, value, description, severity }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 16,
        background: COLORS[severity] || "var(--bg-primary)"
      }}
    >
      <h4 style={{ marginBottom: 8 }}>{title}</h4>
      <h2>{value}</h2>
      <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{description}</p>
    </div>
  );
}

