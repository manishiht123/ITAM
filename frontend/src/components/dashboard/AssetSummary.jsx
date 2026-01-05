import StatCard from "../common/StatCard";
import AssetStatusPie from "../charts/AssetStatusPie";

export default function AssetSummary({ assets }) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Asset Overview</h2>

      <div className="grid grid-cols-5 gap-4">
        <StatCard title="Total Assets" value={assets.total} />
        <StatCard title="Allocated" value={assets.allocated} />
        <StatCard title="Available" value={assets.available} />
        <StatCard title="Under Repair" value={assets.repair} />
        <StatCard title="Retired" value={assets.retired} />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-6">
        <AssetStatusPie data={assets.statusBreakdown} />
      </div>
    </section>
  );
}

