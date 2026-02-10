import AlertCard from "./AlertCard";
import "./alerts.css";

const fallbackAlerts = [
  {
    severity: "critical",
    title: "Licenses Expiring Soon",
    value: "—",
    description: "Expiring within 30 days"
  },
  {
    severity: "critical",
    title: "Warranty Expiring",
    value: "—",
    description: "Assets nearing warranty end"
  },
  {
    severity: "critical",
    title: "Over-utilized Licenses",
    value: "—",
    description: "Compliance breach"
  },
  {
    severity: "warning",
    title: "Unassigned Assets",
    value: "—",
    description: "Assets not allocated"
  },
  {
    severity: "warning",
    title: "Inactive Assets",
    value: "—",
    description: "No activity in 90 days"
  }
];

export default function AlertsPanel({ alerts }) {
  const items = Array.isArray(alerts) && alerts.length ? alerts : fallbackAlerts;
  return (
    <div className="alerts-grid">
      {items.map((item, idx) => (
        <AlertCard
          key={`${item.title}-${idx}`}
          severity={item.severity}
          title={item.title}
          value={item.value}
          description={item.description}
        />
      ))}
    </div>
  );
}
