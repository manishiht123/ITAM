import AlertCard from "./AlertCard";

export default function AlertsPanel({ entity }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16
      }}
    >
      <AlertCard
        severity="critical"
        title="Licenses Expiring Soon"
        value="12"
        description="Expiring within 30 days"
      />

      <AlertCard
        severity="critical"
        title="Warranty Expiring"
        value="8"
        description="Assets nearing warranty end"
      />

      <AlertCard
        severity="critical"
        title="Over-utilized Licenses"
        value="3"
        description="Compliance breach"
      />

      <AlertCard
        severity="warning"
        title="Unassigned Assets"
        value="21"
        description="Assets not allocated"
      />

      <AlertCard
        severity="warning"
        title="Inactive Assets"
        value="14"
        description="No activity in 90 days"
      />
    </div>
  );
}

