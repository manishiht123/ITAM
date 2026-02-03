const SystemPreference = require("../models/SystemPreference");

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
    const {
      maxAssetsPerEmployee,
      allocationWarningMessage,
      overuseProtectionEnabled,
      autoRenewalReviewEnabled,
      auditTrailEnabled
    } = req.body || {};

    const updates = {};
    if (maxAssetsPerEmployee !== undefined) {
      updates.maxAssetsPerEmployee = Number(maxAssetsPerEmployee);
    }
    if (allocationWarningMessage !== undefined) {
      updates.allocationWarningMessage = String(allocationWarningMessage);
    }
    if (overuseProtectionEnabled !== undefined) {
      updates.overuseProtectionEnabled = Boolean(overuseProtectionEnabled);
    }
    if (autoRenewalReviewEnabled !== undefined) {
      updates.autoRenewalReviewEnabled = Boolean(autoRenewalReviewEnabled);
    }
    if (auditTrailEnabled !== undefined) {
      updates.auditTrailEnabled = Boolean(auditTrailEnabled);
    }

    await prefs.update(updates);
    res.json(prefs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
