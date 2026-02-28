const express = require('express');
const router = express.Router();
const { submitSurvey, getAllSurveys, getSurveyStats, exportSurveysToExcel } = require('../controllers/surveyController');
const requireAdmin = require('../middleware/requireAdmin');

// POST /api/survey - Submit new survey response
router.post('/', submitSurvey);

// GET /api/survey - Get all survey responses with pagination
router.get('/', getAllSurveys);

// GET /api/survey/stats - Get survey statistics
router.get('/stats', getSurveyStats);

// GET /api/survey/export - Export all survey data to Excel (admin only)
router.get('/export', requireAdmin, exportSurveysToExcel);

module.exports = router;
