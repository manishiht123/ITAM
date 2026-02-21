const ReportSchedule = require("../models/ReportSchedule");
const { computeNextRun } = require("../utils/reportSchedulerUtils");

const parseRecipients = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw); } catch { return []; }
};

exports.getSchedules = async (req, res) => {
    try {
        const schedules = await ReportSchedule.findAll({ order: [["id", "DESC"]] });
        const result = schedules.map(s => ({
            ...s.toJSON(),
            recipients: parseRecipients(s.recipients)
        }));
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createSchedule = async (req, res) => {
    try {
        const body = { ...req.body };
        if (Array.isArray(body.recipients)) {
            body.recipients = JSON.stringify(body.recipients);
        }
        body.nextRun = computeNextRun(body);
        const schedule = await ReportSchedule.create(body);

        // Register in live scheduler
        try {
            const { registerSchedule } = require("../services/reportScheduler");
            registerSchedule(schedule.toJSON());
        } catch (err) {
            console.warn("[Scheduler] Could not register new schedule live:", err.message);
        }

        res.status(201).json({ ...schedule.toJSON(), recipients: parseRecipients(schedule.recipients) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateSchedule = async (req, res) => {
    try {
        const schedule = await ReportSchedule.findByPk(req.params.id);
        if (!schedule) return res.status(404).json({ error: "Schedule not found" });

        const body = { ...req.body };
        if (Array.isArray(body.recipients)) {
            body.recipients = JSON.stringify(body.recipients);
        }
        // Recompute nextRun when timing fields change
        const merged = { ...schedule.toJSON(), ...body };
        body.nextRun = computeNextRun(merged);
        await schedule.update(body);

        // Re-register in live scheduler
        try {
            const { registerSchedule } = require("../services/reportScheduler");
            registerSchedule(schedule.toJSON());
        } catch (err) {
            console.warn("[Scheduler] Could not re-register schedule live:", err.message);
        }

        res.json({ ...schedule.toJSON(), recipients: parseRecipients(schedule.recipients) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteSchedule = async (req, res) => {
    try {
        const schedule = await ReportSchedule.findByPk(req.params.id);
        if (!schedule) return res.status(404).json({ error: "Schedule not found" });

        try {
            const { unregisterSchedule } = require("../services/reportScheduler");
            unregisterSchedule(schedule.id);
        } catch (err) {
            console.warn("[Scheduler] Could not unregister schedule live:", err.message);
        }

        await schedule.destroy();
        res.json({ message: "Schedule deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.runNow = async (req, res) => {
    try {
        const schedule = await ReportSchedule.findByPk(req.params.id);
        if (!schedule) return res.status(404).json({ error: "Schedule not found" });

        const { executeSchedule } = require("../services/reportScheduler");
        await executeSchedule(schedule.toJSON());
        res.json({ message: "Report sent successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
