const { BACKUP_DIR, runBackup, listBackups, cleanOldBackups } = require("../services/backupService");
const { restoreFromSQL, restoreFromCSV }                      = require("../services/restoreService");
const AuditLog = require("../models/AuditLog");
const path = require("path");
const fs   = require("fs");

// ── POST /api/backups/run ─────────────────────────────────────────────────────
exports.triggerBackup = async (req, res) => {
  try {
    const backupType = req.body.backupType || "both";
    const results    = await runBackup(backupType, BACKUP_DIR);

    // Optional retention cleanup
    const retentionDays = Number(req.body.retentionDays) || 0;
    let removedOldBackups = 0;
    if (retentionDays > 0) {
      removedOldBackups = cleanOldBackups(BACKUP_DIR, retentionDays);
    }

    res.json({ message: "Backup completed successfully", results, removedOldBackups });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/backups ──────────────────────────────────────────────────────────
exports.getBackups = async (req, res) => {
  try {
    res.json(listBackups(BACKUP_DIR));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/backups/:filename ────────────────────────────────────────────────
exports.downloadBackup = async (req, res) => {
  try {
    const filename = req.params.filename;

    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const filePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Backup not found" });
    }

    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      const manifestPath = path.join(filePath, "_manifest.json");
      if (fs.existsSync(manifestPath)) {
        return res.json(JSON.parse(fs.readFileSync(manifestPath, "utf8")));
      }
      return res.json({ files: fs.readdirSync(filePath) });
    }

    res.download(filePath, filename);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── DELETE /api/backups/:filename ─────────────────────────────────────────────
exports.deleteBackup = async (req, res) => {
  try {
    const filename = req.params.filename;

    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const filePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Backup not found" });
    }

    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(filePath);
    }

    res.json({ message: "Backup deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── POST /api/backups/restore/:filename ───────────────────────────────────────
exports.restoreBackup = async (req, res) => {
  try {
    const filename = req.params.filename;

    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const filePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Backup not found" });
    }

    const stats = fs.statSync(filePath);
    let result;

    if (stats.isDirectory()) {
      result = await restoreFromCSV(filePath);
    } else if (filename.endsWith(".sql")) {
      result = await restoreFromSQL(filePath);
    } else {
      return res.status(400).json({ error: "Unsupported backup format. Only .sql and CSV backups are supported." });
    }

    // Audit log
    try {
      const user  = req.user?.email || req.user?.name || "System";
      const rawIp = req.headers["x-forwarded-for"] || req.ip || "";
      const ip    = rawIp.replace(/^::ffff:/, "");
      await AuditLog.create({
        user,
        action:  "System restore performed",
        ip,
        details: `Restored from backup: ${filename}`
      });
    } catch (_) {}

    res.json({ message: "Restore completed successfully.", filename, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
