/**
 * AI Controller — Exposes AI engine features via REST endpoints
 */
const TenantManager = require("../utils/TenantManager");
const AI = require("../utils/aiEngine");
const Entity = require("../models/Entity");
const Department = require("../models/Department");

// Helper: get assets from the tenant DB
const getAssetsForEntity = async (entityCode) => {
    try {
        const sequelize = await TenantManager.getConnection(entityCode || null);
        const Asset = sequelize.models.Asset;
        if (!Asset) return [];
        return await Asset.findAll({ raw: true });
    } catch (err) {
        console.error("Error getting assets for entity:", entityCode, err);
        throw err; // Re-throw to be handled by caller
    }
};

const getEmployeesForEntity = async (entityCode) => {
    try {
        const sequelize = await TenantManager.getConnection(entityCode || null);
        const Employee = sequelize.models.Employee;
        if (!Employee) return [];
        return await Employee.findAll({ raw: true });
    } catch (err) {
        console.error("Error getting employees for entity:", entityCode, err);
        return []; // Fail safe for employees
    }
};

// ─── 1. HEALTH SCORES ───
exports.getHealthScores = async (req, res) => {
    try {
        const entityCode = req.headers["x-entity-code"];
        let assets = [];

        if (entityCode && entityCode !== "ALL") {
            assets = await getAssetsForEntity(entityCode);
        } else {
            const allEntities = await Entity.findAll({ attributes: ['code'], raw: true });
            const assetGroups = await Promise.all(allEntities.map(e => getAssetsForEntity(e.code).catch(() => [])));
            assets = assetGroups.flat();
        }

        const scores = AI.computeHealthScores(assets);
        const summary = AI.getFleetHealthSummary(assets);

        res.json({
            summary,
            assets: scores
        });
    } catch (error) {
        console.error("[AI] Health score error:", error);
        res.status(500).json({ error: error.message });
    }
};

// ─── 2. SMART SEARCH ───
exports.smartSearch = async (req, res) => {
    try {
        const entityCode = req.headers["x-entity-code"];
        // Ensure body exists
        if (!req.body) {
            return res.status(400).json({ error: "Invalid request body" });
        }
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ error: "Query is required" });
        }

        // Fetch assets with error handling
        let assets = [];
        try {
            if (entityCode && entityCode !== "ALL") {
                assets = await getAssetsForEntity(entityCode);
            } else {
                // AGGREGATE: Get all assets from ALL entities
                const allEntities = await Entity.findAll({ attributes: ['code'], raw: true });
                const assetPromises = allEntities.map(e => getAssetsForEntity(e.code).catch(() => []));
                const assetGroups = await Promise.all(assetPromises);
                assets = assetGroups.flat();
            }
        } catch (dbErr) {
            console.error("Aggregation failed:", dbErr);
            // Fallback to main DB if aggregation fails completely
            assets = await getAssetsForEntity(null).catch(() => []);
        }

        // Context data (optional)
        let entities = [];
        let departments = [];
        try {
            entities = await Entity.findAll({ raw: true });
        } catch (e) { console.warn("Entity fetch failed", e.message); }

        try {
            // Get departments from the current connection (of specific entity or main)
            const sequelize = await TenantManager.getConnection(entityCode && entityCode !== "ALL" ? entityCode : null);
            const DeptModel = sequelize.models.Department;
            if (DeptModel) departments = await DeptModel.findAll({ raw: true });
        } catch (e) { console.warn("Department fetch failed", e.message); }

        // Execute AI Logic
        const parsed = AI.parseSmartQuery(query, entities, departments);

        let result = null;
        try {
            result = AI.executeSmartQuery(parsed, assets || []);
        } catch (aiErr) {
            console.error("AI Execution Error:", aiErr);
            return res.status(500).json({ error: "AI Engine Processing Failed: " + aiErr.message });
        }

        res.json({
            query: parsed,
            result
        });
    } catch (error) {
        console.error("[AI] Smart search unexpected error:", error);
        // Ensure JSON response
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error: " + error.message });
        }
    }
};

// ─── 3. ANOMALY DETECTION ───
exports.getAnomalies = async (req, res) => {
    try {
        const entityCode = req.headers["x-entity-code"];
        let assets = [];
        let employees = [];

        if (entityCode && entityCode !== "ALL") {
            assets = await getAssetsForEntity(entityCode);
            employees = await getEmployeesForEntity(entityCode);
        } else {
            const allEntities = await Entity.findAll({ attributes: ['code'], raw: true });
            const assetGroups = await Promise.all(allEntities.map(e => getAssetsForEntity(e.code).catch(() => [])));
            const empGroups = await Promise.all(allEntities.map(e => getEmployeesForEntity(e.code).catch(() => [])));
            assets = assetGroups.flat();
            employees = empGroups.flat();
        }

        const anomalies = AI.detectAnomalies(assets, employees);

        res.json({
            totalAnomalies: anomalies.length,
            critical: anomalies.filter(a => a.severity === "critical").length,
            warnings: anomalies.filter(a => a.severity === "warning").length,
            info: anomalies.filter(a => a.severity === "info").length,
            anomalies
        });
    } catch (error) {
        console.error("[AI] Anomaly detection error:", error);
        res.status(500).json({ error: error.message });
    }
};

// ─── 4. BUDGET FORECAST ───
exports.getBudgetForecast = async (req, res) => {
    try {
        const entityCode = req.headers["x-entity-code"];
        let assets = [];

        if (entityCode && entityCode !== "ALL") {
            assets = await getAssetsForEntity(entityCode);
        } else {
            const allEntities = await Entity.findAll({ attributes: ['code'], raw: true });
            const assetGroups = await Promise.all(allEntities.map(e => getAssetsForEntity(e.code).catch(() => [])));
            assets = assetGroups.flat();
        }

        const forecast = AI.forecastBudget(assets);

        res.json(forecast);
    } catch (error) {
        console.error("[AI] Budget forecast error:", error);
        res.status(500).json({ error: error.message });
    }
};

// ─── 5. AUTO-CATEGORIZE ───
exports.autoCategorizeBulk = async (req, res) => {
    try {
        const { names } = req.body;

        if (!names || !Array.isArray(names)) {
            return res.status(400).json({ error: "Provide an array of asset names under 'names'" });
        }

        const results = AI.autoClassifyBulk(names);

        res.json({
            total: results.length,
            results
        });
    } catch (error) {
        console.error("[AI] Auto-categorize error:", error);
        res.status(500).json({ error: error.message });
    }
};

// ─── 6. ALLOCATION SUGGESTIONS ───
exports.getAllocationSuggestions = async (req, res) => {
    try {
        const entityCode = req.headers["x-entity-code"];
        const { employeeId } = req.params;

        const assets = await getAssetsForEntity(entityCode);
        const employees = await getEmployeesForEntity(entityCode);

        const employee = employees.find(
            e => String(e.id) === String(employeeId) ||
                e.employeeId === employeeId
        );

        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        const availableAssets = assets.filter(a => a.status === "Available");
        const result = AI.suggestAllocations(availableAssets, employee, assets);

        res.json(result);
    } catch (error) {
        console.error("[AI] Allocation suggestion error:", error);
        res.status(500).json({ error: error.message });
    }
};

// ─── 7. AI INSIGHTS (Dashboard) ───
exports.getInsights = async (req, res) => {
    try {
        const entityCode = req.headers["x-entity-code"];
        let assets = [];
        let employees = [];

        if (entityCode && entityCode !== "ALL") {
            assets = await getAssetsForEntity(entityCode);
            employees = await getEmployeesForEntity(entityCode);
        } else {
            const allEntities = await Entity.findAll({ attributes: ['code'], raw: true });
            const assetGroups = await Promise.all(allEntities.map(e => getAssetsForEntity(e.code).catch(() => [])));
            const empGroups = await Promise.all(allEntities.map(e => getEmployeesForEntity(e.code).catch(() => [])));
            assets = assetGroups.flat();
            employees = empGroups.flat();
        }

        const insights = AI.generateInsights(assets, employees);

        res.json({
            entityCode: entityCode || "Global",
            totalAssets: assets.length,
            totalEmployees: employees.length,
            insights
        });
    } catch (error) {
        console.error("[AI] Insights error:", error);
        res.status(500).json({ error: error.message });
    }
};
