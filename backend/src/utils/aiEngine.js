/**
 * ═══════════════════════════════════════════════════════════════
 * ITAM AI ENGINE — Zero-Cost, Rule-Based Intelligence Layer
 * ═══════════════════════════════════════════════════════════════
 *
 * Modules:
 *  1. Asset Health Score     — Predictive lifecycle scoring
 *  2. Smart Search (NLP)     — Natural language → structured query
 *  3. Anomaly Detection      — Statistical outlier flagging
 *  4. Budget Forecasting     — Linear regression prediction
 *  5. Auto-Categorization    — Keyword-based classification
 *  6. Allocation Suggestions — Rule-based scoring
 */

// ─────────────────────────────────────────────
// 1. ASSET HEALTH SCORE
// ─────────────────────────────────────────────

const EXPECTED_LIFE_YEARS = {
    Laptop: 4,
    Desktop: 5,
    Printer: 6,
    Peripheral: 3,
    Monitor: 6,
    Server: 7,
    default: 5
};

function computeHealthScore(asset) {
    const now = new Date();
    const createdAt = asset.createdAt ? new Date(asset.createdAt) : null;
    const purchaseDate = asset.purchaseDate ? new Date(asset.purchaseDate) : createdAt;

    if (!purchaseDate || isNaN(purchaseDate.getTime())) {
        return { score: 70, grade: "B", label: "Fair", factors: { note: "No purchase date available" } };
    }

    const ageYears = (now - purchaseDate) / (365.25 * 24 * 60 * 60 * 1000);
    const expectedLife = EXPECTED_LIFE_YEARS[asset.category] || EXPECTED_LIFE_YEARS.default;
    const lifeRatio = Math.min(ageYears / expectedLife, 1.5);

    // Scoring factors (out of 100)
    const agePenalty = Math.round(lifeRatio * 40);           // max 60 (if 1.5x life)
    const statusPenalty = asset.status === "Under Repair" ? 20
        : asset.status === "Retired" ? 35
            : 0;

    // Warranty check
    let warrantyPenalty = 0;
    if (asset.warrantyExpiry) {
        const expiry = new Date(asset.warrantyExpiry);
        if (!isNaN(expiry.getTime()) && expiry < now) {
            warrantyPenalty = 15;
        }
    } else if (ageYears > 3) {
        warrantyPenalty = 10; // Likely expired
    }

    // Repair history penalty (if available)
    const repairCount = asset.repairCount || 0;
    const repairPenalty = Math.min(repairCount * 8, 25);

    const score = Math.max(0, Math.min(100, 100 - agePenalty - statusPenalty - warrantyPenalty - repairPenalty));

    let grade, label;
    if (score >= 85) { grade = "A"; label = "Excellent"; }
    else if (score >= 70) { grade = "B"; label = "Good"; }
    else if (score >= 50) { grade = "C"; label = "Fair"; }
    else if (score >= 30) { grade = "D"; label = "Poor"; }
    else { grade = "F"; label = "Critical"; }

    const remainingLife = Math.max(0, expectedLife - ageYears);
    const replacementUrgency = remainingLife < 0.5 ? "Immediate"
        : remainingLife < 1 ? "Soon"
            : remainingLife < 2 ? "Upcoming"
                : "No rush";

    return {
        score: Math.round(score),
        grade,
        label,
        replacementUrgency,
        estimatedRemainingYears: Math.round(remainingLife * 10) / 10,
        factors: {
            ageYears: Math.round(ageYears * 10) / 10,
            expectedLifeYears: expectedLife,
            agePenalty,
            statusPenalty,
            warrantyPenalty,
            repairPenalty
        }
    };
}

function computeHealthScores(assets) {
    return assets.map(asset => ({
        id: asset.id,
        assetId: asset.assetId || asset.id,
        name: asset.name,
        category: asset.category,
        status: asset.status,
        ...computeHealthScore(asset)
    }));
}

function getFleetHealthSummary(assets) {
    const scores = assets.map(a => computeHealthScore(a));
    const total = scores.length;
    if (total === 0) return { averageScore: 0, distribution: {}, replacementNeeded: 0 };

    const avgScore = Math.round(scores.reduce((sum, s) => sum + s.score, 0) / total);
    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    let replacementNeeded = 0;

    scores.forEach(s => {
        distribution[s.grade] = (distribution[s.grade] || 0) + 1;
        if (s.replacementUrgency === "Immediate" || s.replacementUrgency === "Soon") {
            replacementNeeded++;
        }
    });

    return {
        averageScore: avgScore,
        averageGrade: avgScore >= 85 ? "A" : avgScore >= 70 ? "B" : avgScore >= 50 ? "C" : avgScore >= 30 ? "D" : "F",
        totalAssets: total,
        distribution,
        replacementNeeded,
        healthyPercentage: Math.round(((distribution.A + distribution.B) / total) * 100)
    };
}


// ─────────────────────────────────────────────
// 2. SMART SEARCH — NLP Parser
// ─────────────────────────────────────────────

const CATEGORY_KEYWORDS = {
    laptop: "Laptop", laptops: "Laptop", notebook: "Laptop", notebooks: "Laptop",
    macbook: "Laptop", thinkpad: "Laptop", latitude: "Laptop",
    desktop: "Desktop", desktops: "Desktop", tower: "Desktop", workstation: "Desktop",
    imac: "Desktop", optiplex: "Desktop", pc: "Desktop",
    printer: "Printer", printers: "Printer", scanner: "Printer", mfp: "Printer", laserjet: "Printer",
    peripheral: "Peripheral", peripherals: "Peripheral",
    mouse: "Peripheral", keyboard: "Peripheral", monitor: "Monitor", monitors: "Monitor",
    headset: "Peripheral", webcam: "Peripheral", dock: "Peripheral",
    server: "Server", servers: "Server"
};

const STATUS_KEYWORDS = {
    "in use": "In Use", "in-use": "In Use", used: "In Use", allocated: "In Use", assigned: "In Use",
    available: "Available", free: "Available", unassigned: "Available", unallocated: "Available",
    "under repair": "Under Repair", repair: "Under Repair", broken: "Under Repair", damaged: "Under Repair", fixing: "Under Repair",
    retired: "Retired", decommissioned: "Retired", disposed: "Retired", old: "Retired"
};

const INTENT_PATTERNS = [
    { pattern: /how many|count|total|number of/i, intent: "count" },
    { pattern: /show|list|find|get|display|view|search/i, intent: "list" },
    { pattern: /who has|assigned to|belongs to|owner/i, intent: "owner_lookup" },
    { pattern: /health|score|condition|state/i, intent: "health" },
    { pattern: /oldest|newest|recent|latest|first|last/i, intent: "sort" },
    { pattern: /department|dept/i, intent: "department_filter" },
    { pattern: /entity|company|org/i, intent: "entity_filter" }
];

const SORT_KEYWORDS = {
    oldest: { field: "createdAt", direction: "ASC" },
    newest: { field: "createdAt", direction: "DESC" },
    recent: { field: "createdAt", direction: "DESC" },
    latest: { field: "createdAt", direction: "DESC" },
    first: { field: "createdAt", direction: "ASC" },
    last: { field: "createdAt", direction: "DESC" }
};

function parseSmartQuery(query, knownEntities = [], knownDepartments = []) {
    const lower = query.toLowerCase().trim();
    const tokens = lower.split(/\s+/);

    const result = {
        originalQuery: query,
        intent: "list",    // default
        filters: {},
        sort: null,
        limit: null,
        confidence: 0,
        explanation: ""
    };

    let matchCount = 0;

    // Detect intent
    for (const { pattern, intent } of INTENT_PATTERNS) {
        if (pattern.test(lower)) {
            result.intent = intent;
            matchCount++;
            break;
        }
    }

    // Detect category
    for (const token of tokens) {
        if (CATEGORY_KEYWORDS[token]) {
            result.filters.category = CATEGORY_KEYWORDS[token];
            matchCount++;
            break;
        }
    }

    // Detect status (check multi-word statuses first)
    for (const [keyword, status] of Object.entries(STATUS_KEYWORDS)) {
        if (lower.includes(keyword)) {
            result.filters.status = status;
            matchCount++;
            break;
        }
    }

    // Detect entity
    if (knownEntities.length > 0) {
        for (const entity of knownEntities) {
            const code = (entity.code || "").toLowerCase();
            const name = (entity.name || "").toLowerCase();
            if (code && lower.includes(code)) {
                result.filters.entity = entity.code;
                matchCount++;
                break;
            }
            if (name && lower.includes(name)) {
                result.filters.entity = entity.code;
                matchCount++;
                break;
            }
        }
    }

    // Detect department
    if (knownDepartments.length > 0) {
        for (const dept of knownDepartments) {
            const deptName = (dept.name || "").toLowerCase();
            if (deptName && lower.includes(deptName)) {
                result.filters.department = dept.name;
                matchCount++;
                break;
            }
        }
    }

    // Detect sort
    for (const token of tokens) {
        if (SORT_KEYWORDS[token]) {
            result.sort = SORT_KEYWORDS[token];
            matchCount++;
            break;
        }
    }

    // Detect limit
    const limitMatch = lower.match(/(?:top|first|last|show)\s+(\d+)/);
    if (limitMatch) {
        result.limit = parseInt(limitMatch[1], 10);
        matchCount++;
    }

    // Confidence score
    result.confidence = Math.min(1, matchCount * 0.25);

    // Build explanation
    const parts = [];
    if (result.intent === "count") parts.push("Counting");
    else parts.push("Listing");

    if (result.filters.category) parts.push(`${result.filters.category}s`);
    else parts.push("assets");

    if (result.filters.status) parts.push(`with status "${result.filters.status}"`);
    if (result.filters.entity) parts.push(`in entity ${result.filters.entity}`);
    if (result.filters.department) parts.push(`in ${result.filters.department} department`);
    if (result.sort) parts.push(`sorted by ${result.sort.direction === "ASC" ? "oldest" : "newest"} first`);
    if (result.limit) parts.push(`(top ${result.limit})`);

    result.explanation = parts.join(" ");

    return result;
}

function executeSmartQuery(parsedQuery, assets) {
    let filtered = [...assets];

    // Apply filters
    if (parsedQuery.filters.category) {
        filtered = filtered.filter(a => (a.category || "").toLowerCase() === parsedQuery.filters.category.toLowerCase());
    }
    if (parsedQuery.filters.status) {
        filtered = filtered.filter(a => a.status === parsedQuery.filters.status);
    }
    if (parsedQuery.filters.entity) {
        filtered = filtered.filter(a => (a.entity || "").toLowerCase() === parsedQuery.filters.entity.toLowerCase());
    }
    if (parsedQuery.filters.department) {
        filtered = filtered.filter(a => (a.department || "").toLowerCase() === parsedQuery.filters.department.toLowerCase());
    }

    // Apply sort
    if (parsedQuery.sort) {
        filtered.sort((a, b) => {
            const valA = new Date(a[parsedQuery.sort.field] || 0);
            const valB = new Date(b[parsedQuery.sort.field] || 0);
            return parsedQuery.sort.direction === "ASC" ? valA - valB : valB - valA;
        });
    }

    // Apply limit
    if (parsedQuery.limit) {
        filtered = filtered.slice(0, parsedQuery.limit);
    }

    // Handle count intent
    if (parsedQuery.intent === "count") {
        return {
            type: "count",
            count: filtered.length,
            explanation: parsedQuery.explanation,
            message: `Found ${filtered.length} matching assets.`
        };
    }

    // Handle health intent
    if (parsedQuery.intent === "health") {
        return {
            type: "health",
            summary: getFleetHealthSummary(filtered),
            assets: computeHealthScores(filtered).slice(0, 20),
            explanation: parsedQuery.explanation,
            message: `Health analysis for ${filtered.length} assets.`
        };
    }

    return {
        type: "list",
        count: filtered.length,
        assets: filtered.slice(0, 50), // Cap results
        explanation: parsedQuery.explanation,
        message: `Showing ${Math.min(filtered.length, 50)} of ${filtered.length} matching assets.`
    };
}


// ─────────────────────────────────────────────
// 3. ANOMALY DETECTION
// ─────────────────────────────────────────────

function detectAnomalies(assets, employees) {
    const anomalies = [];

    // --- 3a. Employees with too many assets ---
    if (employees && employees.length > 0) {
        const employeeAssetCounts = {};
        assets.forEach(a => {
            if (a.employeeId) {
                employeeAssetCounts[a.employeeId] = (employeeAssetCounts[a.employeeId] || 0) + 1;
            }
        });

        const counts = Object.values(employeeAssetCounts);
        if (counts.length > 0) {
            const avgAssets = counts.reduce((a, b) => a + b, 0) / counts.length;
            const threshold = Math.max(avgAssets * 2.5, 5);

            Object.entries(employeeAssetCounts).forEach(([empId, count]) => {
                if (count > threshold) {
                    const emp = employees.find(e => e.employeeId === empId || String(e.id) === empId);
                    anomalies.push({
                        type: "high_asset_count",
                        severity: "warning",
                        title: "Unusually High Asset Count",
                        description: `${emp?.name || empId} has ${count} assets (average: ${Math.round(avgAssets)})`,
                        entity: emp?.entity || null,
                        value: count,
                        threshold: Math.round(threshold)
                    });
                }
            });
        }
    }

    // --- 3b. Department repair spikes ---
    const deptRepairCounts = {};
    const deptTotalCounts = {};
    assets.forEach(a => {
        const dept = a.department || "Unknown";
        deptTotalCounts[dept] = (deptTotalCounts[dept] || 0) + 1;
        if (a.status === "Under Repair") {
            deptRepairCounts[dept] = (deptRepairCounts[dept] || 0) + 1;
        }
    });

    Object.entries(deptRepairCounts).forEach(([dept, count]) => {
        const total = deptTotalCounts[dept] || 1;
        const repairRate = count / total;
        if (repairRate > 0.25 && count >= 2) {
            anomalies.push({
                type: "high_repair_rate",
                severity: "critical",
                title: "High Repair Rate",
                description: `${dept} department has ${Math.round(repairRate * 100)}% assets under repair (${count}/${total})`,
                department: dept,
                value: Math.round(repairRate * 100),
                threshold: 25
            });
        }
    });

    // --- 3c. Long-idle available assets ---
    const now = new Date();
    assets.forEach(a => {
        if (a.status === "Available" && a.updatedAt) {
            const updatedAt = new Date(a.updatedAt);
            const daysSinceUpdate = (now - updatedAt) / (1000 * 60 * 60 * 24);
            if (daysSinceUpdate > 90) {
                anomalies.push({
                    type: "long_idle",
                    severity: "info",
                    title: "Long-Idle Asset",
                    description: `${a.name || a.assetId} has been available for ${Math.round(daysSinceUpdate)} days — might be lost or misplaced`,
                    assetId: a.assetId || a.id,
                    value: Math.round(daysSinceUpdate),
                    threshold: 90
                });
            }
        }
    });

    // --- 3d. Category imbalance ---
    const categoryCounts = {};
    assets.forEach(a => {
        const cat = a.category || "Unknown";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    // --- 3e. Retired assets not cleaned up ---
    const retiredAssets = assets.filter(a => a.status === "Retired" && a.employeeId);
    if (retiredAssets.length > 0) {
        anomalies.push({
            type: "retired_still_assigned",
            severity: "warning",
            title: "Retired Assets Still Assigned",
            description: `${retiredAssets.length} retired asset(s) still show employee assignments`,
            value: retiredAssets.length,
            assets: retiredAssets.slice(0, 5).map(a => a.assetId || a.id)
        });
    }

    return anomalies;
}


// ─────────────────────────────────────────────
// 4. BUDGET FORECASTING
// ─────────────────────────────────────────────

function forecastBudget(assets) {
    // Group assets by month of creation (as proxy for procurement)
    const now = new Date();
    const monthlyData = {};

    assets.forEach(a => {
        const date = a.purchaseDate ? new Date(a.purchaseDate) : (a.createdAt ? new Date(a.createdAt) : null);
        if (!date || isNaN(date.getTime())) return;

        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (!monthlyData[key]) {
            monthlyData[key] = { count: 0, totalValue: 0 };
        }
        monthlyData[key].count += 1;
        monthlyData[key].totalValue += parseFloat(a.price || a.value || 0) || 0;
    });

    // Sort months
    const sortedMonths = Object.keys(monthlyData).sort();
    if (sortedMonths.length < 2) {
        return {
            historical: [],
            forecast: [],
            message: "Not enough historical data for forecasting (need at least 2 months)"
        };
    }

    // Build data arrays
    const counts = sortedMonths.map(m => monthlyData[m].count);

    // Linear regression on counts
    const n = counts.length;
    const sumX = n * (n - 1) / 2;
    const sumY = counts.reduce((a, b) => a + b, 0);
    const sumXY = counts.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = Array.from({ length: n }, (_, i) => i * i).reduce((a, b) => a + b, 0);

    const denom = n * sumX2 - sumX * sumX;
    const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
    const intercept = (sumY - slope * sumX) / n;

    // Predict next 3 months
    const lastDate = new Date(sortedMonths[sortedMonths.length - 1] + "-01");
    const forecast = [];
    for (let i = 1; i <= 3; i++) {
        const futureDate = new Date(lastDate);
        futureDate.setMonth(futureDate.getMonth() + i);
        const predicted = Math.max(0, Math.round(slope * (n + i - 1) + intercept));
        const key = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, "0")}`;
        forecast.push({ month: key, predictedCount: predicted });
    }

    // Trend analysis
    const avgRecent = counts.slice(-3).reduce((a, b) => a + b, 0) / Math.min(counts.length, 3);
    const avgOlder = counts.length > 3
        ? counts.slice(0, -3).reduce((a, b) => a + b, 0) / (counts.length - 3)
        : avgRecent;

    const trendDirection = slope > 0.5 ? "increasing" : slope < -0.5 ? "decreasing" : "stable";
    const changePercent = avgOlder > 0 ? Math.round(((avgRecent - avgOlder) / avgOlder) * 100) : 0;

    return {
        historical: sortedMonths.map((month, i) => ({
            month,
            count: counts[i]
        })),
        forecast,
        trend: {
            direction: trendDirection,
            changePercent,
            slope: Math.round(slope * 100) / 100,
            message: trendDirection === "increasing"
                ? `Asset procurement is trending up ${changePercent}% — plan for increased budget`
                : trendDirection === "decreasing"
                    ? `Asset procurement is trending down ${Math.abs(changePercent)}%`
                    : "Asset procurement is stable"
        }
    };
}


// ─────────────────────────────────────────────
// 5. AUTO-CATEGORIZATION
// ─────────────────────────────────────────────

const CATEGORY_DETECTION_RULES = {
    Laptop: ["laptop", "notebook", "macbook", "thinkpad", "latitude", "elitebook", "ideapad", "pavilion", "inspiron", "chromebook", "surface pro", "surface laptop", "yoga"],
    Desktop: ["desktop", "tower", "workstation", "imac", "optiplex", "prodesk", "thinkcentre", "all-in-one", "mini pc", "nuc"],
    Printer: ["printer", "scanner", "mfp", "laserjet", "inkjet", "plotter", "copier"],
    Monitor: ["monitor", "display", "screen", "panel", "lg ultragear", "dell ultrasharp", "viewsonic"],
    Peripheral: ["mouse", "keyboard", "headset", "webcam", "dock", "docking station", "hub", "charger", "adapter", "cable", "usb", "dongle", "speaker"],
    Server: ["server", "rack", "blade", "nas", "storage array"],
    Network: ["router", "switch", "firewall", "access point", "modem", "gateway"],
    Mobile: ["phone", "iphone", "android", "tablet", "ipad", "galaxy tab"]
};

function autoClassify(assetName) {
    if (!assetName) return { category: "Other", confidence: 0, matchedKeyword: null };
    const lower = assetName.toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_DETECTION_RULES)) {
        for (const keyword of keywords) {
            if (lower.includes(keyword)) {
                return {
                    category,
                    confidence: keyword.length > 5 ? 0.95 : 0.8,
                    matchedKeyword: keyword
                };
            }
        }
    }

    return { category: "Other", confidence: 0.3, matchedKeyword: null };
}

function autoClassifyBulk(assetNames) {
    return assetNames.map(name => ({
        name,
        ...autoClassify(name)
    }));
}


// ─────────────────────────────────────────────
// 6. SMART ALLOCATION SUGGESTIONS
// ─────────────────────────────────────────────

const ROLE_CATEGORY_PREFERENCE = {
    // Engineering/Tech roles prefer laptops
    engineer: "Laptop", developer: "Laptop", programmer: "Laptop", architect: "Laptop",
    designer: "Laptop", analyst: "Laptop", scientist: "Laptop",
    // Administrative roles might use desktops
    accountant: "Desktop", clerk: "Desktop", receptionist: "Desktop", admin: "Desktop",
    // Management could use either
    manager: "Laptop", director: "Laptop", vp: "Laptop", ceo: "Laptop", cto: "Laptop",
    // IT
    support: "Desktop", helpdesk: "Desktop", sysadmin: "Laptop"
};

function suggestAllocations(availableAssets, employee, allAssets = []) {
    if (!availableAssets.length) {
        return { suggestions: [], message: "No available assets to suggest." };
    }

    const scored = availableAssets
        .filter(a => a.status === "Available")
        .map(asset => {
            let score = 0;
            const reasons = [];

            // Factor 1: Department match (30 pts)
            if (asset.department && employee.department &&
                asset.department.toLowerCase() === employee.department.toLowerCase()) {
                score += 30;
                reasons.push("Same department");
            }

            // Factor 2: Entity match (25 pts)
            if (asset.entity && employee.entity &&
                asset.entity.toLowerCase() === employee.entity.toLowerCase()) {
                score += 25;
                reasons.push("Same entity");
            }

            // Factor 3: Role-category match (20 pts)
            if (employee.designation) {
                const roleLower = employee.designation.toLowerCase();
                for (const [role, cat] of Object.entries(ROLE_CATEGORY_PREFERENCE)) {
                    if (roleLower.includes(role) && asset.category === cat) {
                        score += 20;
                        reasons.push(`${cat} matches ${employee.designation} role`);
                        break;
                    }
                }
            }

            // Factor 4: Asset freshness — newer is better (15 pts)
            const created = asset.createdAt ? new Date(asset.createdAt) : null;
            if (created) {
                const ageYears = (new Date() - created) / (365.25 * 24 * 60 * 60 * 1000);
                const freshnessScore = Math.max(0, 15 - Math.round(ageYears * 3));
                score += freshnessScore;
                if (freshnessScore > 10) reasons.push("Relatively new asset");
            }

            // Factor 5: Health score (10 pts)
            const health = computeHealthScore(asset);
            const healthBonus = Math.round(health.score / 10);
            score += healthBonus;
            if (health.score >= 80) reasons.push("Good health condition");

            return {
                asset: {
                    id: asset.id,
                    assetId: asset.assetId || asset.id,
                    name: asset.name,
                    category: asset.category,
                    entity: asset.entity,
                    healthScore: health.score,
                    healthGrade: health.grade
                },
                score,
                reasons
            };
        });

    scored.sort((a, b) => b.score - a.score);

    return {
        suggestions: scored.slice(0, 5),
        employee: {
            id: employee.id,
            name: employee.name,
            department: employee.department,
            designation: employee.designation,
            entity: employee.entity
        },
        message: scored.length > 0
            ? `Top ${Math.min(scored.length, 5)} asset recommendations for ${employee.name}`
            : "No suitable assets found"
    };
}


// ─────────────────────────────────────────────
// 7. AI INSIGHTS SUMMARY (Dashboard Integration)
// ─────────────────────────────────────────────

function generateInsights(assets, employees) {
    const insights = [];

    // Fleet health
    const fleetHealth = getFleetHealthSummary(assets);
    if (fleetHealth.totalAssets > 0) {
        insights.push({
            type: "fleet_health",
            icon: "heartbeat",
            title: "Fleet Health",
            value: `${fleetHealth.averageScore}%`,
            description: `Average asset health is ${fleetHealth.averageGrade}-grade. ${fleetHealth.healthyPercentage}% of assets are in good condition.`,
            severity: fleetHealth.averageScore >= 70 ? "good" : fleetHealth.averageScore >= 50 ? "warning" : "critical"
        });
    }

    // Replacement urgency
    if (fleetHealth.replacementNeeded > 0) {
        insights.push({
            type: "replacement",
            icon: "refresh",
            title: "Replacement Needed",
            value: fleetHealth.replacementNeeded,
            description: `${fleetHealth.replacementNeeded} asset(s) need replacement soon based on age and condition.`,
            severity: fleetHealth.replacementNeeded > 5 ? "critical" : "warning"
        });
    }

    // Anomalies
    const anomalies = detectAnomalies(assets, employees);
    const criticalAnomalies = anomalies.filter(a => a.severity === "critical");
    if (criticalAnomalies.length > 0) {
        insights.push({
            type: "anomaly",
            icon: "warning",
            title: "Critical Anomalies",
            value: criticalAnomalies.length,
            description: criticalAnomalies[0].description,
            severity: "critical"
        });
    }

    // Utilization
    const totalAssets = assets.length;
    const inUse = assets.filter(a => a.status === "In Use").length;
    const utilization = totalAssets > 0 ? Math.round((inUse / totalAssets) * 100) : 0;
    insights.push({
        type: "utilization",
        icon: "chart",
        title: "Asset Utilization",
        value: `${utilization}%`,
        description: `${inUse} of ${totalAssets} assets are currently in use.`,
        severity: utilization >= 70 ? "good" : utilization >= 40 ? "warning" : "critical"
    });

    return insights;
}


// ═══════════════════════════════════════════════
// MODULE EXPORTS
// ═══════════════════════════════════════════════

module.exports = {
    // Health Score
    computeHealthScore,
    computeHealthScores,
    getFleetHealthSummary,

    // Smart Search
    parseSmartQuery,
    executeSmartQuery,

    // Anomaly Detection
    detectAnomalies,

    // Budget Forecasting
    forecastBudget,

    // Auto-Categorization
    autoClassify,
    autoClassifyBulk,

    // Allocation Suggestions
    suggestAllocations,

    // Insights
    generateInsights
};
