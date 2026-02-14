const express = require("express");
const router = express.Router();
const ai = require("../controllers/aiController");

// AI Insights (for dashboard)
router.get("/insights", ai.getInsights);

// Asset Health Scores
router.get("/health", ai.getHealthScores);

// Smart Search
router.post("/search", ai.smartSearch);

// Anomaly Detection
router.get("/anomalies", ai.getAnomalies);

// Budget Forecast
router.get("/forecast", ai.getBudgetForecast);

// Auto-Categorize bulk asset names
router.post("/categorize", ai.autoCategorizeBulk);

// Allocation suggestions for a specific employee
router.get("/suggest-allocation/:employeeId", ai.getAllocationSuggestions);

module.exports = router;
