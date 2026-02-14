const { runBackup, listBackups, cleanOldBackups } = require("../services/backupService");
const SystemPreference = require("../models/SystemPreference");
const path = require("path");
const fs = require("fs");

const getPrefs = async () => {
  let prefs = await SystemPreference.findOne();
  if (!prefs) prefs = await SystemPreference.create({});
  return prefs;
};

exports.triggerBackup = async (req, res) => {
  try {
    const prefs = await getPrefs();
    const backupType = req.body.backupType || prefs.backupType || "both";
    const backupLocation = req.body.backupLocation || prefs.backupLocation || "./backups";

    const results = await runBackup(backupType, backupLocation);

    // Clean old backups based on retention
    const removed = cleanOldBackups(backupLocation, prefs.backupRetentionDays || 30);

    res.json({
      message: "Backup completed successfully",
      results,
      removedOldBackups: removed
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBackups = async (req, res) => {
  try {
    const prefs = await getPrefs();
    const backupLocation = prefs.backupLocation || "./backups";
    const backups = listBackups(backupLocation);
    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.downloadBackup = async (req, res) => {
  try {
    const prefs = await getPrefs();
    const backupLocation = prefs.backupLocation || "./backups";
    const filename = req.params.filename;

    // Prevent directory traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const filePath = path.join(path.resolve(backupLocation), filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Backup not found" });
    }

    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      // For CSV backups (directories), return the manifest
      const manifestPath = path.join(filePath, "_manifest.json");
      if (fs.existsSync(manifestPath)) {
        return res.json(JSON.parse(fs.readFileSync(manifestPath, "utf8")));
      }
      return res.json({ message: "CSV backup directory", files: fs.readdirSync(filePath) });
    }

    res.download(filePath, filename);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBackup = async (req, res) => {
  try {
    const prefs = await getPrefs();
    const backupLocation = prefs.backupLocation || "./backups";
    const filename = req.params.filename;

    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const filePath = path.join(path.resolve(backupLocation), filename);

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
