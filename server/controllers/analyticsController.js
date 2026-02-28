const Survey = require('../models/Survey');

// Get section-wise analytics
const getSectionAnalytics = async (req, res) => {
  try {
    const { section } = req.params;
    
    let analytics = {};

    switch (section) {
      case 'basic-info':
        analytics = await getBasicInfoAnalytics();
        break;
      case 'loan-awareness':
        analytics = await getLoanAwarenessAnalytics();
        break;
      case 'financial-risk':
        analytics = await getFinancialRiskAnalytics();
        break;
      case 'rental-awareness':
        analytics = await getRentalAwarenessAnalytics();
        break;
      case 'platform-need':
        analytics = await getPlatformNeedAnalytics();
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid section specified'
        });
    }

    res.json({
      success: true,
      section,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching section analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

// Get comprehensive dashboard data
const getDashboardData = async (req, res) => {
  try {
    const totalResponses = await Survey.countDocuments();
    const todayResponses = await Survey.countDocuments({
      submittedAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    // Last 7 days trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyTrend = await Survey.aggregate([
      {
        $match: {
          submittedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$submittedAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Key metrics
    const metrics = {
      totalResponses,
      todayResponses,
      avgRiskScale: await getAverageRiskScale(),
      fraudExperienceRate: await getFraudExperienceRate(),
      hiddenChargesRate: await getHiddenChargesRate(),
      platformInterestRate: await getPlatformInterestRate()
    };

    // Section breakdowns
    const sections = {
      basicInfo: await getBasicInfoAnalytics(),
      loanAwareness: await getLoanAwarenessAnalytics(),
      financialRisk: await getFinancialRiskAnalytics(),
      rentalAwareness: await getRentalAwarenessAnalytics(),
      platformNeed: await getPlatformNeedAnalytics()
    };

    res.json({
      success: true,
      data: {
        metrics,
        dailyTrend,
        sections
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

// Helper functions
const getBasicInfoAnalytics = async () => {
  const [ageGroups, occupations, loanExperience] = await Promise.all([
    Survey.aggregate([
      { $group: { _id: '$ageGroup', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Survey.aggregate([
      { $group: { _id: '$occupation', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Survey.aggregate([
      { $group: { _id: '$loanExperience', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  return { ageGroups, occupations, loanExperience };
};

const getLoanAwarenessAnalytics = async () => {
  const [interestUnderstanding, repaymentCalculation, hiddenCharges, aprKnowledge, confidence] = await Promise.all([
    Survey.aggregate([
      { $group: { _id: '$interestRateUnderstanding', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Survey.aggregate([
      { $group: { _id: '$totalRepaymentCalculation', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Survey.aggregate([
      { $group: { _id: '$hiddenChargesExperience', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Survey.aggregate([
      { $group: { _id: '$aprKnowledge', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Survey.aggregate([
      { $group: { _id: '$agreementReadingConfidence', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  return { interestUnderstanding, repaymentCalculation, hiddenCharges, aprKnowledge, confidence };
};

const getFinancialRiskAnalytics = async () => {
  const [processingFeeUncertainty, fraudExperience, readingHabit] = await Promise.all([
    Survey.aggregate([
      { $group: { _id: '$processingFeeUncertainty', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Survey.aggregate([
      { $group: { _id: '$fraudExperience', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Survey.aggregate([
      { $group: { _id: '$agreementReadingHabit', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  return { processingFeeUncertainty, fraudExperience, readingHabit };
};

const getRentalAwarenessAnalytics = async () => {
  const [rentalExperience, termsUnderstanding] = await Promise.all([
    Survey.aggregate([
      { $group: { _id: '$rentalAgreementExperience', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Survey.aggregate([
      { $group: { _id: '$rentalTermsUnderstanding', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  return { rentalExperience, termsUnderstanding };
};

const getPlatformNeedAnalytics = async () => {
  const [willingness, features] = await Promise.all([
    Survey.aggregate([
      { $group: { _id: '$platformUsageWillingness', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Survey.aggregate([
      { $unwind: '$platformFeatures' },
      { $group: { _id: '$platformFeatures', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  // Common fears
  const fears = await Survey.aggregate([
    { $match: { biggestFear: { $ne: '', $exists: true } } },
    { $group: { _id: '$biggestFear', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  return { willingness, features, fears };
};

const getAverageRiskScale = async () => {
  const result = await Survey.aggregate([
    { $match: { riskScale: { $exists: true } } },
    { $group: { _id: null, average: { $avg: '$riskScale' } } }
  ]);
  return result[0]?.average || 0;
};

const getFraudExperienceRate = async () => {
  const total = await Survey.countDocuments();
  const fraudYes = await Survey.countDocuments({ fraudExperience: 'Yes' });
  return total > 0 ? (fraudYes / total) * 100 : 0;
};

const getHiddenChargesRate = async () => {
  const total = await Survey.countDocuments();
  const hiddenChargesYes = await Survey.countDocuments({ hiddenChargesExperience: 'Yes' });
  return total > 0 ? (hiddenChargesYes / total) * 100 : 0;
};

const getPlatformInterestRate = async () => {
  const total = await Survey.countDocuments();
  const definitely = await Survey.countDocuments({ platformUsageWillingness: 'Definitely' });
  const maybe = await Survey.countDocuments({ platformUsageWillingness: 'Maybe' });
  return total > 0 ? ((definitely + maybe) / total) * 100 : 0;
};

module.exports = {
  getSectionAnalytics,
  getDashboardData
};
