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
        <svg viewBox="0 0 100 100" className="donut">
          {Object.entries(data).map(([key, value], i, arr) => {
            // Calculate segment
            let cumulative = 0;
            for (let j = 0; j < i; j++) cumulative += Object.values(data)[j];

            const percentage = value / total;
            const startAngle = (cumulative / total) * 360;
            const dashArray = `${percentage * 100} 100`;
            const offset = 25 - (startAngle / 360) * 100; // start at top (25% offset)

            return (
              <circle
                key={key}
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={colors[key]}
                strokeWidth="12"
                strokeDasharray={dashArray}
                strokeDashoffset={offset}
                transform="rotate(-90 50 50)"
              />
            );
          })}
        </svg>

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

