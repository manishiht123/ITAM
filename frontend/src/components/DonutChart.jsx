export default function DonutChart({
  data,
  total,
  colors,
  selected,
  onSelect,
}) {
  return (
    <>
      <div className="donut-wrapper">
        {/* Your existing SVG donut goes here */}
        <div className="donut-center">
          <strong>{total}</strong>
          <span>Total</span>
        </div>
      </div>

      <div className="legend">
        {Object.entries(data).map(([key, value]) => (
          <div
            key={key}
            className={`legend-item ${selected === key ? "active" : ""}`}
            onClick={() =>
              onSelect(prev => (prev === key ? null : key))
            }
          >
            <span
              className="legend-dot"
              style={{ background: colors[key] }}
            />
            {key} ({value})
          </div>
        ))}
      </div>
    </>
  );
}

