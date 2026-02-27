/**
 * Backup Scheduler Service
 * Uses node-cron to run automatic database backups based on SystemPreferences settings.
 * Supports daily, weekly, and monthly schedules.
 */
const cron = require("node-cron");
const SystemPreference = require("../models/SystemPreference");
const { runBackup, cleanOldBackups, BACKUP_DIR } = require("./backupService");

// Active cron task reference
let activeTask = null;

/**
 * Build a cron expression from frequency + time string ("HH:MM")
 */
function buildCronExpr(frequency, time) {
  const [hStr, mStr] = (time || "02:00").split(":");
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;

  switch (frequency) {
    case "weekly":  return `${m} ${h} * * 0`;   // Every Sunday at HH:MM
    case "monthly": return `${m} ${h} 1 * *`;   // 1st of every month at HH:MM
    case "daily":
    default:        return `${m} ${h} * * *`;   // Every day at HH:MM
  }
}

/**
 * Stop the currently running backup cron job (if any).
 */
function stopScheduler() {
  if (activeTask) {
    activeTask.stop();
    activeTask = null;
    console.log("[BackupScheduler] Stopped.");
  }
}

/**
 * Start (or restart) the backup scheduler based on current SystemPreferences.
 * Safe to call multiple times — stops any existing job before creating a new one.
 */
async function startScheduler() {
  stopScheduler();

  try {
    let prefs = await SystemPreference.findOne();
    if (!prefs) prefs = await SystemPreference.create({});

    if (!prefs.autoBackupEnabled) {
      console.log("[BackupScheduler] Auto backup is disabled — scheduler not started.");
      return;
    }

    const frequency     = prefs.backupFrequency     || "daily";
    const time          = prefs.backupTime          || "02:00";
    const retentionDays = prefs.backupRetentionDays || 30;
    const backupType    = prefs.backupType          || "both";

    const expr = buildCronExpr(frequency, time);
    console.log(`[BackupScheduler] Starting — ${frequency} at ${time} (cron: ${expr})`);

    activeTask = cron.schedule(expr, async () => {
      console.log(`[BackupScheduler] Running scheduled ${backupType} backup…`);
      try {
        const results = await runBackup(backupType, BACKUP_DIR);
        console.log(`[BackupScheduler] Backup completed: ${results.map(r => r.filename).join(", ")}`);

        // Clean up old backups
        const removed = cleanOldBackups(BACKUP_DIR, retentionDays);
        if (removed > 0) {
          console.log(`[BackupScheduler] Removed ${removed} old backup(s).`);
        }
      } catch (err) {
        console.error("[BackupScheduler] Backup failed:", err.message);
      }
    });
  } catch (err) {
    console.error("[BackupScheduler] Failed to start scheduler:", err.message);
  }
}

module.exports = { startScheduler, stopScheduler };
