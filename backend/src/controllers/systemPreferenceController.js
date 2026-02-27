const SystemPreference   = require("../models/SystemPreference");
const backupScheduler    = require("../services/backupScheduler");

const getOrCreatePreferences = async () => {
  let prefs = await SystemPreference.findOne();
  if (!prefs) {
    prefs = await SystemPreference.create({});
  }
  return prefs;
};

exports.getSystemPreferences = async (req, res) => {
  try {
    const prefs = await getOrCreatePreferences();
    res.json(prefs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSystemPreferences = async (req, res) => {
  try {
    const prefs = await getOrCreatePreferences();
    const body = req.body || {};
    const updates = {};

    const stringFields = [
      "allocationWarningMessage", "backupFrequency", "backupTime",
      "backupType", "backupLocation", "fiscalYearStart", "depreciationMethod",
      "allowedLoginDomains"
    ];
    const numberFields = [
      "maxAssetsPerEmployee", "backupRetentionDays", "defaultUsefulLife",
      "salvageValuePercent", "capexThreshold", "passwordMinLength",
      "passwordMaxLength", "passwordExpiryDays", "passwordReuseLimit",
      "passwordLockoutAttempts", "passwordLockoutDurationMins"
    ];
    const booleanFields = [
      "overuseProtectionEnabled", "autoRenewalReviewEnabled", "auditTrailEnabled",
      "autoBackupEnabled", "passwordRequireUpper", "passwordRequireLower",
      "passwordRequireNumber", "passwordRequireSpecial"
    ];

    stringFields.forEach((f) => { if (body[f] !== undefined) updates[f] = String(body[f]); });
    numberFields.forEach((f) => { if (body[f] !== undefined) updates[f] = Number(body[f]); });
    booleanFields.forEach((f) => { if (body[f] !== undefined) updates[f] = Boolean(body[f]); });

    await prefs.update(updates);

    // Restart backup scheduler if any schedule-related field changed
    const scheduleFields = ["autoBackupEnabled", "backupFrequency", "backupTime", "backupRetentionDays", "backupType"];
    if (scheduleFields.some(f => updates[f] !== undefined)) {
      backupScheduler.startScheduler().catch(() => {});
    }

    res.json(prefs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
