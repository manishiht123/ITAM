import "./AssetLifecycleDrawer.css";
import { useEscClose } from "../hooks/useEscClose";

// ── lifecycle stage config ───────────────────────────────────────────────────

const STAGES = [
  { key: "procurement", label: "Procurement",  statuses: ["Not Submitted", "Available", "In Stock"] },
  { key: "deployed",    label: "Deployed",      statuses: ["In Use", "Allocated"] },
  { key: "maintenance", label: "Maintenance",   statuses: ["Under Repair"] },
  { key: "retired",     label: "End of Life",   statuses: ["Retired", "Theft/Missing"] }
];

const EVENT_META = {
  created:      { icon: "📦", color: "#22c55e",  label: "Registered" },
  allocated:    { icon: "👤", color: "#1a9fe7",  label: "Allocated" },
  returned:     { icon: "↩",  color: "#f97316",  label: "Returned" },
  maintenance:  { icon: "🔧", color: "#f59e0b",  label: "Repair" },
  transferred:  { icon: "↔",  color: "#8b5cf6",  label: "Transfer" },
  retired:      { icon: "🗑",  color: "#ef4444",  label: "Retired" },
  lost:         { icon: "🚨", color: "#ef4444",  label: "Lost/Stolen" },
  updated:      { icon: "✏",  color: "#64748b",  label: "Updated" },
  deleted:      { icon: "✕",  color: "#ef4444",  label: "Deleted" }
};

const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date)) return String(d);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtDateTime = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date)) return String(d);
  return date.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
};

// ── component ────────────────────────────────────────────────────────────────

export default function AssetLifecycleDrawer({ data, onClose, loading }) {
  const { asset, events = [], disposal } = data || {};
  useEscClose(!!data, onClose);

  const currentStatus = asset?.status || "Available";
  const activeStage = STAGES.find((s) => s.statuses.includes(currentStatus)) || STAGES[0];
  const activeIdx = STAGES.indexOf(activeStage);

  return (
    <div className="ald-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ald-drawer">
        {/* ── header ── */}
        <div className="ald-header">
          <div>
            <h2 className="ald-title">Asset Lifecycle</h2>
            {asset && (
              <div className="ald-asset-meta">
                <span className="ald-asset-id">{asset.assetId || asset.id}</span>
                <span className="ald-dot">·</span>
                <span>{asset.name}</span>
                <span className="ald-dot">·</span>
                <span className="ald-category">{asset.category}</span>
              </div>
            )}
          </div>
          <button className="ald-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="ald-loading">Loading lifecycle history…</div>
        ) : (
          <>
            {/* ── lifecycle stage tracker ── */}
            <div className="ald-stage-track">
              {STAGES.map((stage, idx) => {
                const done    = idx < activeIdx;
                const current = idx === activeIdx;
                return (
                  <div key={stage.key} className={`ald-stage ${done ? "done" : ""} ${current ? "current" : ""}`}>
                    <div className="ald-stage-dot">
                      {done    && <span className="ald-check">✓</span>}
                      {current && <span className="ald-pulse" />}
                    </div>
                    {idx < STAGES.length - 1 && (
                      <div className={`ald-stage-line ${done ? "done" : ""}`} />
                    )}
                    <span className="ald-stage-label">{stage.label}</span>
                  </div>
                );
              })}
            </div>

            {/* ── disposal summary (if retired) ── */}
            {disposal && (
              <div className="ald-disposal-card">
                <div className="ald-disposal-title">Disposal Record</div>
                <div className="ald-disposal-grid">
                  {[
                    ["Reason",        disposal.disposalReason],
                    ["Method",        disposal.disposalMethod],
                    ["Date",          fmtDate(disposal.disposalDate)],
                    ["Authorized by", disposal.authorizedBy || "—"],
                    ["Proceeds",      disposal.saleValue ? `₹${disposal.saleValue}` : "—"],
                    ["Performed by",  disposal.performedBy || "—"]
                  ].map(([k, v]) => (
                    <div key={k} className="ald-disposal-row">
                      <span className="ald-disposal-key">{k}</span>
                      <span className="ald-disposal-val">{v}</span>
                    </div>
                  ))}
                </div>
                {disposal.notes && (
                  <div className="ald-disposal-notes">{disposal.notes}</div>
                )}
              </div>
            )}

            {/* ── timeline ── */}
            <div className="ald-timeline-title">Event History</div>
            <div className="ald-timeline">
              {events.length === 0 ? (
                <p className="ald-empty">No events recorded yet.</p>
              ) : (
                events.map((ev, i) => {
                  const meta = EVENT_META[ev.eventType] || EVENT_META.updated;
                  const isLast = i === events.length - 1;
                  return (
                    <div key={ev.id || i} className={`ald-event ${isLast ? "last" : ""}`}>
                      {/* dot + line */}
                      <div className="ald-event-left">
                        <div className="ald-event-dot" style={{ background: meta.color }}>
                          <span className="ald-event-icon">{meta.icon}</span>
                        </div>
                        {!isLast && <div className="ald-event-line" />}
                      </div>

                      {/* content */}
                      <div className="ald-event-body">
                        <div className="ald-event-top">
                          <span className="ald-event-label" style={{ color: meta.color }}>{meta.label}</span>
                          <span className="ald-event-date">{fmtDateTime(ev.eventDate)}</span>
                        </div>
                        <div className="ald-event-desc">{ev.description}</div>
                        {ev.details && (
                          <div className="ald-event-details">{ev.details}</div>
                        )}
                        {ev.performedBy && ev.performedBy !== "System" && (
                          <div className="ald-event-by">By: {ev.performedBy}</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
