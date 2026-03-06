// backend/routes/analyticsRoutes.js
const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * All analytics routes are protected by authentication
 * Add authMiddleware to protect routes if needed
 */

/**
 * GET /api/analytics/prescriptions
 * Get all prescriptions for analytics dashboard
 * Query params: ?startDate=...&endDate=...&limit=...
 */
router.get("/prescriptions", analyticsController.getAllPrescriptions);

/**
 * GET /api/analytics/summary
 * Get analytics summary statistics
 * Query params: ?startDate=...&endDate=...
 */
router.get("/summary", analyticsController.getAnalyticsSummary);

/**
 * GET /api/analytics/gender-distribution
 * Get gender distribution statistics
 * Query params: ?startDate=...&endDate=...
 */
router.get("/gender-distribution", analyticsController.getGenderDistribution);

/**
 * GET /api/analytics/age-distribution
 * Get age distribution statistics
 * Query params: ?startDate=...&endDate=...
 */
router.get("/age-distribution", analyticsController.getAgeDistribution);

/**
 * GET /api/analytics/top-medicines
 * Get most prescribed medicines
 * Query params: ?startDate=...&endDate=...&limit=...
 */
router.get("/top-medicines", analyticsController.getTopMedicines);

/**
 * GET /api/analytics/prescriptions-over-time
 * Get prescriptions over time (daily/weekly/monthly)
 * Query params: ?startDate=...&endDate=...&groupBy=daily|weekly|monthly
 */
router.get("/prescriptions-over-time", analyticsController.getPrescriptionsOverTime);

/**
 * GET /api/analytics/recent-patients
 * Get recent patients
 * Query params: ?limit=...
 */
router.get("/recent-patients", analyticsController.getRecentPatients);

module.exports = router;
