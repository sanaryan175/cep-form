const mongoose = require('mongoose');
const Survey = require('../models/Survey');
const XLSX = require('xlsx');

// Submit survey response
const submitSurvey = async (req, res) => {
  try {
    // Debug log to verify name and email are received
    console.log('Full request body:', req.body);
    console.log('Received survey data:', {
      name: req.body.name,
      email: req.body.email,
      emailVerified: req.body.emailVerified,
      biggestFear: req.body.biggestFear
    });

    const surveyData = {
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    console.log('Survey data before save:', surveyData);

    const survey = new Survey(surveyData);
    await survey.save();

    console.log('Saved survey data:', survey.toObject());

    res.status(201).json({
      success: true,
      message: 'Survey submitted successfully',
      data: survey
    });
  } catch (error) {
    console.error('Survey submission error:', error);
    res.status(400).json({
      success: false,
      message: 'Error submitting survey',
      error: error.message
    });
  }
};

// Get all survey responses
const getAllSurveys = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const surveys = await Survey.find()
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Survey.countDocuments();

    res.json({
      success: true,
      data: surveys,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching surveys:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching surveys',
      error: error.message
    });
  }
};

// Get survey statistics
const getSurveyStats = async (req, res) => {
  try {
    const totalResponses = await Survey.countDocuments();
    
    // Basic info stats
    const ageGroupStats = await Survey.aggregate([
      { $group: { _id: '$ageGroup', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const occupationStats = await Survey.aggregate([
      { $group: { _id: '$occupation', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const loanExperienceStats = await Survey.aggregate([
      { $group: { _id: '$loanExperience', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Loan awareness stats
    const interestRateUnderstandingStats = await Survey.aggregate([
      { $group: { _id: '$interestRateUnderstanding', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const hiddenChargesStats = await Survey.aggregate([
      { $group: { _id: '$hiddenChargesExperience', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Risk experience stats
    const fraudExperienceStats = await Survey.aggregate([
      { $group: { _id: '$fraudExperience', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Platform need stats
    const platformWillingnessStats = await Survey.aggregate([
      { $group: { _id: '$platformUsageWillingness', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Average risk scale
    const avgRiskScale = await Survey.aggregate([
      { $match: { riskScale: { $exists: true } } },
      { $group: { _id: null, average: { $avg: '$riskScale' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalResponses,
        ageGroupStats,
        occupationStats,
        loanExperienceStats,
        interestRateUnderstandingStats,
        hiddenChargesStats,
        fraudExperienceStats,
        platformWillingnessStats,
        avgRiskScale: avgRiskScale[0]?.average || 0
      }
    });
  } catch (error) {
    console.error('Error fetching survey stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching survey statistics',
      error: error.message
    });
  }
};

// Export all survey data to Excel
const exportSurveysToExcel = async (req, res) => {
  try {
    const surveys = await Survey.find().sort({ submittedAt: -1 });

    // Flatten survey data for Excel
    const flattenedData = surveys.map(survey => {
      const obj = survey.toObject();
      const flat = {
        _id: obj._id.toString(),
        name: obj.name || '',
        email: obj.email || '',
        emailVerified: obj.emailVerified || false,
        submittedAt: obj.submittedAt ? new Date(obj.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
        ipAddress: obj.ipAddress || '',
        ageGroup: obj.ageGroup || '',
        occupation: obj.occupation || '',
        loanExperience: obj.loanExperience || '',
        interestRateUnderstanding: obj.interestRateUnderstanding || '',
        totalRepaymentCalculation: obj.totalRepaymentCalculation || '',
        hiddenChargesExperience: obj.hiddenChargesExperience || '',
        aprKnowledge: obj.aprKnowledge || '',
        agreementReadingConfidence: obj.agreementReadingConfidence || '',
        processingFeeUncertainty: obj.processingFeeUncertainty || '',
        fraudExperience: obj.fraudExperience || '',
        agreementReadingHabit: obj.agreementReadingHabit || '',
        rentalAgreementExperience: obj.rentalAgreementExperience || '',
        rentalTermsUnderstanding: obj.rentalTermsUnderstanding || '',
        platformUsageWillingness: obj.platformUsageWillingness || '',
        platformFeatures: Array.isArray(obj.platformFeatures) ? obj.platformFeatures.join(', ') : '',
        biggestFear: obj.biggestFear || '',
        riskScale: obj.riskScale || '',
        userAgent: obj.userAgent || ''
      };
      return flat;
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(flattenedData);

    // Set column widths
    const colWidths = [
      { wch: 25 }, // _id
      { wch: 20 }, // name
      { wch: 30 }, // email
      { wch: 15 }, // emailVerified
      { wch: 20 }, // submittedAt
      { wch: 15 }, // ipAddress
      { wch: 15 }, // ageGroup
      { wch: 20 }, // occupation
      { wch: 25 }, // loanExperience
      { wch: 30 }, // interestRateUnderstanding
      { wch: 25 }, // totalRepaymentCalculation
      { wch: 25 }, // hiddenChargesExperience
      { wch: 20 }, // aprKnowledge
      { wch: 25 }, // agreementReadingConfidence
      { wch: 25 }, // processingFeeUncertainty
      { wch: 20 }, // fraudExperience
      { wch: 25 }, // agreementReadingHabit
      { wch: 30 }, // rentalAgreementExperience
      { wch: 25 }, // rentalTermsUnderstanding
      { wch: 25 }, // platformUsageWillingness
      { wch: 40 }, // platformFeatures
      { wch: 50 }, // biggestFear
      { wch: 12 }, // riskScale
      { wch: 30 }  // userAgent
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Survey Data');

    // Generate buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for download
    const fileName = `survey_data_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting surveys:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting survey data',
      error: error.message
    });
  }
};

module.exports = {
  submitSurvey,
  getAllSurveys,
  getSurveyStats,
  exportSurveysToExcel
};
