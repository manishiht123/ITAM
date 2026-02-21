/**
 * Compute the cron expression and next run Date for a ReportSchedule row.
 */

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Build a node-cron expression from schedule config.
 * @param {object} s - schedule object { frequency, time, dayOfWeek, dayOfMonth }
 * @returns {string} cron expression
 */
const buildCronExpression = (s) => {
    const [hour, minute] = (s.time || "08:00").split(":").map(Number);
    const mm = isNaN(minute) ? 0 : minute;
    const hh = isNaN(hour) ? 8 : hour;

    switch (s.frequency) {
        case "daily":
            return `${mm} ${hh} * * *`;
        case "weekly": {
            const dow = s.dayOfWeek != null ? s.dayOfWeek : 1; // default Monday
            return `${mm} ${hh} * * ${dow}`;
        }
        case "monthly": {
            const dom = s.dayOfMonth != null ? s.dayOfMonth : 1;
            return `${mm} ${hh} ${dom} * *`;
        }
        case "quarterly": {
            const dom = s.dayOfMonth != null ? s.dayOfMonth : 1;
            return `${mm} ${hh} ${dom} 1,4,7,10 *`;
        }
        default:
            return `${mm} ${hh} * * *`;
    }
};

/**
 * Compute the next Date a schedule will fire.
 */
const computeNextRun = (s) => {
    const [hour, minute] = (s.time || "08:00").split(":").map(Number);
    const hh = isNaN(hour) ? 8 : hour;
    const mm = isNaN(minute) ? 0 : minute;
    const now = new Date();
    const candidate = new Date(now);

    const setTime = (d) => {
        d.setHours(hh, mm, 0, 0);
        return d;
    };

    switch (s.frequency) {
        case "daily": {
            setTime(candidate);
            if (candidate <= now) candidate.setDate(candidate.getDate() + 1);
            return candidate;
        }
        case "weekly": {
            const targetDow = s.dayOfWeek != null ? s.dayOfWeek : 1;
            let diff = (targetDow - now.getDay() + 7) % 7;
            setTime(candidate);
            if (diff === 0 && candidate <= now) diff = 7;
            candidate.setDate(candidate.getDate() + diff);
            setTime(candidate);
            return candidate;
        }
        case "monthly": {
            const dom = s.dayOfMonth != null ? s.dayOfMonth : 1;
            candidate.setDate(dom);
            setTime(candidate);
            if (candidate <= now) {
                candidate.setMonth(candidate.getMonth() + 1);
                candidate.setDate(dom);
                setTime(candidate);
            }
            return candidate;
        }
        case "quarterly": {
            const dom = s.dayOfMonth != null ? s.dayOfMonth : 1;
            const quarterMonths = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct
            let found = false;
            for (let i = 0; i < 4; i++) {
                const tryDate = new Date(now.getFullYear(), quarterMonths[i], dom, hh, mm, 0, 0);
                if (tryDate > now) { Object.assign(candidate, tryDate); candidate.setTime(tryDate.getTime()); found = true; break; }
            }
            if (!found) {
                // Next year Q1
                const tryDate = new Date(now.getFullYear() + 1, 0, dom, hh, mm, 0, 0);
                candidate.setTime(tryDate.getTime());
            }
            return candidate;
        }
        default:
            setTime(candidate);
            if (candidate <= now) candidate.setDate(candidate.getDate() + 1);
            return candidate;
    }
};

const formatScheduleLabel = (s) => {
    const [hour, minute] = (s.time || "08:00").split(":").map(Number);
    const hh = String(isNaN(hour) ? 8 : hour).padStart(2, "0");
    const mm = String(isNaN(minute) ? 0 : minute).padStart(2, "0");
    const timeStr = `${hh}:${mm}`;

    switch (s.frequency) {
        case "daily":   return `Every day at ${timeStr}`;
        case "weekly":  return `Every ${DAY_NAMES[s.dayOfWeek || 1]} at ${timeStr}`;
        case "monthly": return `Day ${s.dayOfMonth || 1} of every month at ${timeStr}`;
        case "quarterly": return `Quarterly (Q1/Q2/Q3/Q4), day ${s.dayOfMonth || 1} at ${timeStr}`;
        default:        return `${s.frequency} at ${timeStr}`;
    }
};

module.exports = { buildCronExpression, computeNextRun, formatScheduleLabel };
