import { useEffect, useState, useCallback, useMemo } from "react";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/ui";
import {
  FaDatabase, FaFileCsv, FaDownload, FaTrash, FaUndo,
  FaShieldAlt, FaClock, FaServer, FaExclamationTriangle, FaPlay, FaCalendarAlt
} from "react-icons/fa";
import api from "../../services/api";
import "./BackupRestore.css";

// ── helpers ──────────────────────────────────────────────────────────────────

const fmtSize = (size, type) => {
  if (type === "csv") return `${size} table${size !== 1 ? "s" : ""}`;
  if (!size)          return "—";
  if (size < 1024)         return `${size} B`;
  if (size < 1024 * 1024)  return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
};

const timeAgo = (d) => {
  if (!d) return "Never";
  const diff  = Date.now() - new Date(d).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const typeLabel = (type) => type === "database" ? "Database Backup" : "CSV Export";
const typeBadge = (type) => type === "database" ? "db" : "csv";

// ── component ────────────────────────────────────────────────────────────────

export default function BackupRestore() {
  const toast = useToast();

  // Backup type for manual run (local state)
  const [backupType, setBackupType] = useState("both");
  const [backingUp, setBackingUp]   = useState(false);

  // Schedule settings (persisted to SystemPreferences)
  const [schedule, setSchedule] = useState({
    autoBackupEnabled:   false,
    backupFrequency:     "daily",
    backupTime:          "02:00",
    backupRetentionDays: 30,
    backupType:          "both",
  });
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Backup list
  const [backups, setBackups]               = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(true);

  // Restore state
  const [restoreSelected, setRestoreSelected] = useState("");
  const [restoreTarget, setRestoreTarget]     = useState(null);
  const [restoring, setRestoring]             = useState(false);
  const [restoreResult, setRestoreResult]     = useState(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // ── load ─────────────────────────────────────────────────────────────────────
  const loadBackups = useCallback(async () => {
    setLoadingBackups(true);
    try {
      const data = await api.getBackups();
      setBackups(Array.isArray(data) ? data : []);
    } catch { /* non-critical */ }
    finally { setLoadingBackups(false); }
  }, []);

  useEffect(() => {
    loadBackups();
    // Load schedule settings from server
    (async () => {
      try {
        const prefs = await api.getSystemPreferences();
        setSchedule(prev => ({
          ...prev,
          autoBackupEnabled:   prefs.autoBackupEnabled   ?? prev.autoBackupEnabled,
          backupFrequency:     prefs.backupFrequency     ?? prev.backupFrequency,
          backupTime:          prefs.backupTime          ?? prev.backupTime,
          backupRetentionDays: prefs.backupRetentionDays ?? prev.backupRetentionDays,
          backupType:          prefs.backupType          ?? prev.backupType,
        }));
      } catch { /* non-critical */ }
    })();
  }, [loadBackups]);

  // Keep restore dropdown in sync after deletions
  useEffect(() => {
    if (restoreSelected && !backups.find(b => b.filename === restoreSelected)) {
      setRestoreSelected("");
    }
  }, [backups, restoreSelected]);

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const latest   = backups[0] || null;
    const dbCount  = backups.filter(b => b.type === "database").length;
    const csvCount = backups.filter(b => b.type === "csv").length;
    return { total: backups.length, latest, dbCount, csvCount };
  }, [backups]);

  // ── handlers ─────────────────────────────────────────────────────────────────
  const handleBackupNow = async () => {
    setBackingUp(true);
    try {
      const result = await api.runBackup({ backupType });
      toast.success(result.message || "Backup completed successfully!");
      loadBackups();
    } catch (err) {
      toast.error(err.message || "Backup failed.");
    } finally {
      setBackingUp(false);
    }
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      await api.updateSystemPreferences({
        autoBackupEnabled:   schedule.autoBackupEnabled,
        backupFrequency:     schedule.backupFrequency,
        backupTime:          schedule.backupTime,
        backupRetentionDays: schedule.backupRetentionDays,
        backupType:          schedule.backupType,
      });
      toast.success("Backup schedule saved.");
    } catch (err) {
      toast.error(err.message || "Failed to save schedule.");
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleDownload = async (backup) => {
    try {
      await api.downloadBackup(backup.filename);
    } catch (err) {
      toast.error(err.message || "Download failed.");
    }
  };

  const openRestoreFromDropdown = () => {
    const backup = backups.find(b => b.filename === restoreSelected);
    if (!backup) return;
    setRestoreTarget(backup);
    setRestoreResult(null);
  };

  const openRestoreFromRow = (backup) => {
    setRestoreTarget(backup);
    setRestoreResult(null);
  };

  const handleRestoreConfirm = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      const result = await api.restoreBackup(restoreTarget.filename);
      setRestoreResult(result);
      toast.success("Restore completed successfully!");
    } catch (err) {
      toast.error(err.message || "Restore failed.");
      setRestoreTarget(null);
    } finally {
      setRestoring(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteBackup(deleteTarget.filename);
      toast.success("Backup deleted.");
      setDeleteTarget(null);
      loadBackups();
    } catch (err) {
      toast.error(err.message || "Failed to delete backup.");
    } finally {
      setDeleting(false);
    }
  };

  // ── next run label ────────────────────────────────────────────────────────────
  const nextRunLabel = () => {
    if (!schedule.autoBackupEnabled) return "Disabled";
    const [h, m] = (schedule.backupTime || "02:00").split(":").map(Number);
    const now  = new Date();
    const next = new Date();
    next.setHours(h, m, 0, 0);

    if (schedule.backupFrequency === "daily") {
      if (next <= now) next.setDate(next.getDate() + 1);
    } else if (schedule.backupFrequency === "weekly") {
      const day = next.getDay();
      const daysUntilSunday = (7 - day) % 7 || 7;
      next.setDate(next.getDate() + daysUntilSunday);
    } else if (schedule.backupFrequency === "monthly") {
      next.setDate(1);
      if (next <= now) { next.setMonth(next.getMonth() + 1); next.setDate(1); }
    }
    return fmtDate(next);
  };

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <div className="br-page">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="br-header">
        <div>
          <h1><FaDatabase style={{ marginRight: 10 }} />Backup &amp; Restore</h1>
          <p>Create database backups, schedule automatic backups, and restore your system.</p>
        </div>
      </div>

      {/* ── KPI Row ────────────────────────────────────────── */}
      <div className="br-kpi-row">
        <div className="br-kpi-card">
          <div className="br-kpi-icon" style={{ background: "rgba(37,99,235,0.1)", color: "#2563eb" }}>
            <FaDatabase />
          </div>
          <div>
            <div className="br-kpi-value">{kpis.total}</div>
            <div className="br-kpi-label">Total Backups</div>
          </div>
        </div>
        <div className="br-kpi-card">
          <div className="br-kpi-icon" style={{ background: "rgba(22,163,74,0.1)", color: "#16a34a" }}>
            <FaClock />
          </div>
          <div>
            <div className="br-kpi-value">{timeAgo(kpis.latest?.created)}</div>
            <div className="br-kpi-label">Last Backup</div>
          </div>
        </div>
        <div className="br-kpi-card">
          <div className="br-kpi-icon" style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}>
            <FaServer />
          </div>
          <div>
            <div className="br-kpi-value">{kpis.dbCount} DB &middot; {kpis.csvCount} CSV</div>
            <div className="br-kpi-label">Backup Breakdown</div>
          </div>
        </div>
        <div className="br-kpi-card">
          <div className="br-kpi-icon" style={{
            background: schedule.autoBackupEnabled ? "rgba(22,163,74,0.1)" : "rgba(107,114,128,0.1)",
            color:      schedule.autoBackupEnabled ? "#16a34a" : "#6b7280"
          }}>
            <FaCalendarAlt />
          </div>
          <div>
            <div className="br-kpi-value" style={{
              fontSize: "0.85rem",
              color: schedule.autoBackupEnabled ? "#16a34a" : "#6b7280"
            }}>
              {nextRunLabel()}
            </div>
            <div className="br-kpi-label">Next Scheduled Backup</div>
          </div>
        </div>
      </div>

      {/* ── Row 1: Run Backup + Restore ────────────────────── */}
      <div className="br-two-col">

        {/* Run Backup card */}
        <div className="br-card">
          <div className="br-card-title">Run Backup Now</div>

          <div className="br-field">
            <label className="br-label">Backup Type</label>
            <select
              className="br-select"
              value={backupType}
              onChange={e => setBackupType(e.target.value)}
            >
              <option value="both">Both (Database + CSV)</option>
              <option value="database">Database Backup only</option>
              <option value="csv">CSV Export only</option>
            </select>
            <span className="br-hint">
              {backupType === "both"
                ? "Creates a full database backup and a CSV export of every table."
                : backupType === "database"
                  ? "Creates a complete database backup — best for full restores."
                  : "Exports every table as a separate .csv file."}
            </span>
          </div>

          <div style={{ marginTop: 20 }}>
            <Button variant="primary" onClick={handleBackupNow} disabled={backingUp}>
              {backingUp
                ? <><FaPlay className="br-spin" style={{ marginRight: 6 }} />Running…</>
                : <><FaPlay style={{ marginRight: 6 }} />Backup Now</>}
            </Button>
          </div>
        </div>

        {/* Restore card */}
        <div className="br-card">
          <div className="br-card-title">Restore from Backup</div>

          {backups.length === 0 ? (
            <div className="br-restore-empty">
              <FaUndo className="br-restore-empty-icon" />
              <p>No backups available. Create a backup first, then you can restore from it.</p>
            </div>
          ) : (
            <>
              <div className="br-field">
                <label className="br-label">Select Backup</label>
                <select
                  className="br-select"
                  value={restoreSelected}
                  onChange={e => setRestoreSelected(e.target.value)}
                >
                  <option value="">— Choose a backup —</option>
                  {backups.map(b => (
                    <option key={b.filename} value={b.filename}>
                      {b.filename} ({typeLabel(b.type)}, {timeAgo(b.created)})
                    </option>
                  ))}
                </select>
                <span className="br-hint">Select a backup to restore from.</span>
              </div>

              <div className="br-info-note" style={{ marginTop: 12 }}>
                <FaExclamationTriangle />
                Restoring overwrites current data and cannot be undone.
              </div>

              <div style={{ marginTop: 16 }}>
                <Button
                  variant="danger"
                  onClick={openRestoreFromDropdown}
                  disabled={!restoreSelected}
                >
                  <FaUndo style={{ marginRight: 6 }} />Restore
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Row 2: Schedule + What Gets Backed Up ──────────── */}
      <div className="br-two-col">

        {/* Schedule card */}
        <div className="br-card">
          <div className="br-card-title-row">
            <div className="br-card-title">Backup Schedule</div>
            <span className={`br-schedule-status ${schedule.autoBackupEnabled ? "on" : "off"}`}>
              {schedule.autoBackupEnabled ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="br-field">
            <label className="br-toggle-row">
              <span className="br-label" style={{ marginBottom: 0 }}>Enable Automatic Backups</span>
              <label className="br-toggle">
                <input
                  type="checkbox"
                  checked={schedule.autoBackupEnabled}
                  onChange={e => setSchedule(p => ({ ...p, autoBackupEnabled: e.target.checked }))}
                />
                <span className="br-toggle-slider" />
              </label>
            </label>
          </div>

          <div className="br-field-row">
            <div className="br-field">
              <label className="br-label">Frequency</label>
              <select
                className="br-select"
                value={schedule.backupFrequency}
                disabled={!schedule.autoBackupEnabled}
                onChange={e => setSchedule(p => ({ ...p, backupFrequency: e.target.value }))}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly (Sunday)</option>
                <option value="monthly">Monthly (1st)</option>
              </select>
            </div>
            <div className="br-field">
              <label className="br-label">Time</label>
              <input
                className="br-input"
                type="time"
                value={schedule.backupTime}
                disabled={!schedule.autoBackupEnabled}
                onChange={e => setSchedule(p => ({ ...p, backupTime: e.target.value }))}
              />
            </div>
          </div>

          <div className="br-field-row">
            <div className="br-field">
              <label className="br-label">Backup Type</label>
              <select
                className="br-select"
                value={schedule.backupType}
                disabled={!schedule.autoBackupEnabled}
                onChange={e => setSchedule(p => ({ ...p, backupType: e.target.value }))}
              >
                <option value="both">Both (Database + CSV)</option>
                <option value="database">Database only</option>
                <option value="csv">CSV only</option>
              </select>
            </div>
            <div className="br-field">
              <label className="br-label">Retention (days)</label>
              <input
                className="br-input"
                type="number"
                min={1}
                max={365}
                value={schedule.backupRetentionDays}
                disabled={!schedule.autoBackupEnabled}
                onChange={e => setSchedule(p => ({ ...p, backupRetentionDays: Number(e.target.value) }))}
              />
              <span className="br-hint">Older backups are deleted automatically.</span>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <Button variant="secondary" onClick={handleSaveSchedule} disabled={savingSchedule}>
              <FaCalendarAlt style={{ marginRight: 6 }} />
              {savingSchedule ? "Saving…" : "Save Schedule"}
            </Button>
          </div>
        </div>

        {/* Info card */}
        <div className="br-card br-info-card">
          <div className="br-card-title">What Gets Backed Up</div>
          <ul className="br-info-list">
            {[
              "Assets & Asset Categories",
              "Asset Disposals & Transfers",
              "Employees & Departments",
              "Locations & Organizations",
              "Software Licenses & Assignments",
              "Entities & Users & Roles",
              "Notification & Email Settings",
              "System Preferences & Report Schedules",
              "Audit Logs"
            ].map(t => (
              <li key={t}><span className="br-info-dot" />{t}</li>
            ))}
          </ul>
          <div className="br-info-note">
            <FaExclamationTriangle />
            Restoring overwrites current data. Always create a fresh backup before restoring.
          </div>
        </div>
      </div>

      {/* ── Backup History ─────────────────────────────────── */}
      <div className="br-card br-full">
        <div className="br-card-title-row">
          <div className="br-card-title">Backup History</div>
          <button className="br-refresh-btn" onClick={loadBackups} title="Refresh">↻ Refresh</button>
        </div>

        {loadingBackups ? (
          <div className="br-loading">Loading backups…</div>
        ) : backups.length === 0 ? (
          <div className="br-empty">
            <FaDatabase className="br-empty-icon" />
            <p>No backups found. Click <strong>Backup Now</strong> to create your first backup.</p>
          </div>
        ) : (
          <div className="br-table-wrap">
            <table className="br-table">
              <thead>
                <tr>
                  <th>Backup Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Created</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => (
                  <tr key={b.filename}>
                    <td className="br-filename">
                      {b.type === "database"
                        ? <FaDatabase className="br-type-icon db" />
                        : <FaFileCsv  className="br-type-icon csv" />}
                      {b.filename}
                    </td>
                    <td>
                      <span className={`br-badge ${typeBadge(b.type)}`}>
                        {typeLabel(b.type)}
                      </span>
                    </td>
                    <td>{fmtSize(b.size, b.type)}</td>
                    <td>
                      <span title={fmtDate(b.created)}>{timeAgo(b.created)}</span>
                      <span className="br-date-sub">{fmtDate(b.created)}</span>
                    </td>
                    <td>
                      <div className="br-actions">
                        {b.type === "database" && (
                          <button
                            className="br-action-btn download"
                            title="Download backup file"
                            onClick={() => handleDownload(b)}
                          >
                            <FaDownload />
                          </button>
                        )}
                        <button
                          className="br-action-btn restore"
                          title="Restore from this backup"
                          onClick={() => openRestoreFromRow(b)}
                        >
                          <FaUndo />
                        </button>
                        <button
                          className="br-action-btn delete"
                          title="Delete this backup"
                          onClick={() => setDeleteTarget(b)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── RESTORE CONFIRM MODAL ──────────────────────────── */}
      {restoreTarget && !restoreResult && (
        <div className="br-overlay" onClick={() => !restoring && setRestoreTarget(null)}>
          <div className="br-modal" onClick={e => e.stopPropagation()}>
            <div className="br-modal-warn">
              <FaExclamationTriangle />
              WARNING — This action will overwrite your current database
            </div>
            <h3 className="br-modal-title">Confirm Restore</h3>
            <p className="br-modal-body">
              You are about to restore from:<br />
              <strong>{restoreTarget.filename}</strong>
              <br /><br />
              All current data in the restored tables will be <strong>replaced</strong> with
              the data from this backup. This cannot be undone.
              <br /><br />
              Are you sure you want to proceed?
            </p>
            <div className="br-modal-actions">
              <Button variant="secondary" onClick={() => setRestoreTarget(null)} disabled={restoring}>Cancel</Button>
              <Button variant="danger" onClick={handleRestoreConfirm} disabled={restoring}>
                {restoring ? "Restoring…" : "Yes, Restore Now"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESTORE RESULT MODAL ──────────────────────────── */}
      {restoreResult && (
        <div className="br-overlay" onClick={() => { setRestoreResult(null); setRestoreTarget(null); }}>
          <div className="br-modal" onClick={e => e.stopPropagation()}>
            <div className="br-modal-success"><FaShieldAlt /> Restore Completed</div>
            <h3 className="br-modal-title">Restore Summary</h3>
            <div className="br-result-body">
              {Array.isArray(restoreResult.result)
                ? restoreResult.result.map((r, i) => (
                    <div key={i} className={`br-result-row ${r.status}`}>
                      <span className="br-result-table">{r.table}</span>
                      <span className="br-result-status">
                        {r.status === "success" ? `${r.rows} rows restored` : r.reason || r.status}
                      </span>
                    </div>
                  ))
                : <p>{restoreResult.result?.statementsRestored ?? 0} statements executed successfully.</p>
              }
            </div>
            <div className="br-modal-actions">
              <Button variant="primary" onClick={() => { setRestoreResult(null); setRestoreTarget(null); }}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ───────────────────────────── */}
      {deleteTarget && (
        <div className="br-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="br-modal" onClick={e => e.stopPropagation()}>
            <h3 className="br-modal-title">Delete Backup</h3>
            <p className="br-modal-body">
              Delete <strong>{deleteTarget.filename}</strong>?<br />
              This backup will be permanently removed from the server.
            </p>
            <div className="br-modal-actions">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
              <Button variant="danger" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
