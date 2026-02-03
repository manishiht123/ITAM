import AlertCard from "../common/AlertCard";

export default function AlertsPanel({ alerts }) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4 text-red-600">
        Alerts & Compliance
      </h2>

      <div className="grid grid-cols-3 gap-4">
        {alerts.map((a, i) => (
          <AlertCard key={i} {...a} />
        ))}
      </div>
    </section>
  );
}

