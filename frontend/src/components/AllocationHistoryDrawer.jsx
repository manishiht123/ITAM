import "./AllocationHistoryDrawer.css";

export default function AllocationHistoryDrawer({ open, onClose, history = [] }) {
  if (!open) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />

      <aside className="drawer">
        <div className="drawer-header">
          <h3>Allocation History</h3>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          {history.length === 0 ? (
            <p className="empty">No allocation history available</p>
          ) : (
            history.map((item, idx) => (
              <div key={idx} className="history-card">
                <div className="row">
                  <span>Employee</span>
                  <strong>{item.employee}</strong>
                </div>

                <div className="row">
                  <span>Department</span>
                  <strong>{item.department}</strong>
                </div>

                <div className="row">
                  <span>Allocated On</span>
                  <strong>{item.allocatedOn}</strong>
                </div>

                <div className="row">
                  <span>Handed Over</span>
                  <strong>{item.handoverOn || "—"}</strong>
                </div>

                <div className="row status">
                  <span>Status</span>
                  <strong className={item.status.toLowerCase()}>
                    {item.status}
                  </strong>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}

