const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing API health...');
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('Health check:', healthResponse.data);

    console.log('Testing survey submission...');
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
      ageGroup: '23–30',
      occupation: 'Student',
      loanExperience: 'No',
      interestRateUnderstanding: 'Partially',
      totalRepaymentCalculation: 'No',
      hiddenChargesExperience: 'Not sure',
      aprKnowledge: 'No',
      agreementReadingConfidence: 'Somewhat confident',
      processingFeeUncertainty: 'Yes',
      fraudExperience: 'No',
      agreementReadingHabit: 'Sometimes',
      rentalAgreementExperience: 'No',
      rentalTermsUnderstanding: 'No',
      platformUsageWillingness: 'Definitely',
      platformFeatures: ['Hidden charges'],
      biggestFear: 'Test fear',
      riskScale: 3
    };

    const surveyResponse = await axios.post('http://localhost:5000/api/survey', testData);
    console.log('Survey submission successful:', surveyResponse.data);
  } catch (error) {
    console.error('API test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testAPI();
