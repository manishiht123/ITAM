import TrendLine from "../charts/TrendLine";
import RepairReplaceLine from "../charts/RepairReplaceLine";

export default function TrendsSection({ trends }) {
  if (!trends) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Trends & Analytics</h2>

      <div className="grid grid-cols-2 gap-6">
        <TrendLine
          title="Asset Growth Over Time"
          data={trends.assetGrowth}
          dataKey="value"
        />
        <TrendLine
          title="License Usage Trend"
          data={trends.licenseUsage}
          dataKey="value"
        />
        <RepairReplaceLine data={trends.repairVsReplace} />
      </div>
    </section>
  );
}

