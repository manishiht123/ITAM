import LicenseUsagePie from "../charts/LicenseUsagePie";
import StatCard from "../common/StatCard";

export default function LicenseSummary({ licenses }) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">License Overview</h2>

      <div className="grid grid-cols-5 gap-4">
        <StatCard title="Total Licenses" value={licenses.total} />
        <StatCard title="Used" value={licenses.used} />
        <StatCard title="Available" value={licenses.available} />
        <StatCard title="Over-allocated" value={licenses.overused} warning />
        <StatCard title="Expiring Soon" value={licenses.expiring} danger />
      </div>

      <div className="mt-6 grid grid-cols-3">
        <LicenseUsagePie data={licenses.usageBreakdown} />
      </div>
    </section>
  );
}

