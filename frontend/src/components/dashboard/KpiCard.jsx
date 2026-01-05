export default function KpiCard({ title, value, subtitle }) {
  return (
    <div style={{
      border: "1px solid #e5e7eb",
      borderRadius: 8,
      padding: 16,
      minWidth: 180,
      background: "#fff"
    }}>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 600 }}>{value}</div>
      {subtitle && (
        <div style={{ fontSize: 12, color: "#9ca3af" }}>{subtitle}</div>
      )}
    </div>
  );
}

