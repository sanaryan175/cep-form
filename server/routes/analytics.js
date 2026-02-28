const express = require('express');
const router = express.Router();
const { getSectionAnalytics, getDashboardData } = require('../controllers/analyticsController');
const requireAdmin = require('../middleware/requireAdmin');

// GET /api/analytics/dashboard - Get comprehensive dashboard data
router.get('/dashboard', requireAdmin, getDashboardData);

// GET /api/analytics/section/:section - Get section-specific analytics
router.get('/section/:section', requireAdmin, getSectionAnalytics);

module.exports = router;
