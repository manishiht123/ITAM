const COLORS = {
  critical: "var(--feedback-danger-bg)",
  warning: "var(--feedback-warning-bg)"
};

export default function AlertCard({ title, value, description, severity }) {
  return (
    <div className={`alert-card ${severity || ""}`}>
      <h4 className="alert-card-title">{title}</h4>
      <h2 className="alert-card-value">{value}</h2>
      <p className="alert-card-description">{description}</p>
    </div>
  );
}
