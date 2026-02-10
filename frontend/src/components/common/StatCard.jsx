export default function StatCard({ title, value, warning, danger }) {
  let color = "var(--text-primary)";
  if (warning) color = "var(--warning)";
  if (danger) color = "var(--danger)";

  return (
    <div style={{
      background: "var(--bg-elevated)",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-sm)",
      padding: "var(--space-lg)",
      border: "1px solid var(--border)",
    }}>
      <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{title}</div>
      <div style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--font-weight-bold)", color }}>{value}</div>
    </div>
  );
}
