export default function AlertCard({ title, count, severity }) {
  const colorMap = {
    high: { borderColor: "var(--danger)", color: "var(--danger)" },
    medium: { borderColor: "var(--warning)", color: "var(--warning)" },
    low: { borderColor: "var(--border)", color: "var(--text-secondary)" },
  };

  const styles = colorMap[severity] || colorMap.low;

  return (
    <div style={{
      borderLeft: `4px solid ${styles.borderColor}`,
      background: "var(--bg-elevated)",
      padding: "var(--space-lg)",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--radius-sm)",
      color: styles.color,
    }}>
      <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)" }}>{title}</div>
      <div style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-bold)" }}>{count}</div>
    </div>
  );
}
