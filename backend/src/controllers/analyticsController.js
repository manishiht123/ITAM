const { Op, fn, col, literal } = require("sequelize");
const AnalyticsEvent = require("../models/AnalyticsEvent");
const SystemPreference = require("../models/SystemPreference");

exports.logEvent = async (req, res) => {
  try {
    // Check if analytics is enabled
    const prefs = await SystemPreference.findOne();
    if (!prefs || !prefs.analyticsEnabled) {
      return res.json({ tracked: false });
    }

    const { eventType, page, action, entity, metadata } = req.body;
    await AnalyticsEvent.create({
      userId: req.user?.id || null,
      username: req.user?.username || req.user?.email || null,
      role: req.user?.role || null,
      eventType: eventType || "page_view",
      page: page || null,
      action: action || null,
      entity: entity || null,
      metadata: metadata ? JSON.stringify(metadata) : null
    });

    res.json({ tracked: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const where = { createdAt: { [Op.gte]: since } };

    // Total events
    const totalEvents = await AnalyticsEvent.count({ where });

    // Active users (unique userIds)
    const activeUsers = await AnalyticsEvent.count({
      where,
      distinct: true,
      col: "userId"
    });

    // Page views
    const totalPageViews = await AnalyticsEvent.count({
      where: { ...where, eventType: "page_view" }
    });

    // Top pages
    const topPages = await AnalyticsEvent.findAll({
      attributes: [
        "page",
        [fn("COUNT", col("id")), "views"]
      ],
      where: { ...where, eventType: "page_view", page: { [Op.ne]: null } },
      group: ["page"],
      order: [[literal("views"), "DESC"]],
      limit: 10,
      raw: true
    });

    // Top actions
    const topActions = await AnalyticsEvent.findAll({
      attributes: [
        "action",
        [fn("COUNT", col("id")), "count"]
      ],
      where: { ...where, eventType: "action", action: { [Op.ne]: null } },
      group: ["action"],
      order: [[literal("count"), "DESC"]],
      limit: 10,
      raw: true
    });

    // Daily activity (last N days)
    const dailyActivity = await AnalyticsEvent.findAll({
      attributes: [
        [fn("DATE", col("createdAt")), "date"],
        [fn("COUNT", col("id")), "events"]
      ],
      where,
      group: [fn("DATE", col("createdAt"))],
      order: [[fn("DATE", col("createdAt")), "ASC"]],
      raw: true
    });

    // Users by role
    const usersByRole = await AnalyticsEvent.findAll({
      attributes: [
        "role",
        [fn("COUNT", fn("DISTINCT", col("userId"))), "users"]
      ],
      where: { ...where, role: { [Op.ne]: null } },
      group: ["role"],
      order: [[literal("users"), "DESC"]],
      raw: true
    });

    res.json({
      period: `${days} days`,
      totalEvents,
      activeUsers,
      totalPageViews,
      topPages,
      topActions,
      dailyActivity,
      usersByRole
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
