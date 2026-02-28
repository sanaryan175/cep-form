const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
  // Pre-survey information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please enter a valid email address'
    }
  },
  emailVerified: {
    type: Boolean,
    default: false
  },

  // Section 1: Basic Information
  ageGroup: {
    type: String,
    enum: ['18–22', '23–30', '31–45', '46+'],
    required: true
  },
  occupation: {
    type: String,
    enum: ['Student', 'Salaried Employee', 'Self-Employed', 'Homemaker', 'Other'],
    required: true
  },
  loanExperience: {
    type: String,
    enum: ['Yes', 'No', 'Planning to'],
    required: true
  },

  // Section 2: Loan Awareness
  interestRateUnderstanding: {
    type: String,
    enum: ['Yes', 'Partially', 'No'],
    required: true
  },
  totalRepaymentCalculation: {
    type: String,
    enum: ['Yes', 'No'],
    required: true
  },
  hiddenChargesExperience: {
    type: String,
    enum: ['Yes', 'No', 'Not sure'],
    required: true
  },
  aprKnowledge: {
    type: String,
    enum: ['Yes', 'No'],
    required: true
  },
  agreementReadingConfidence: {
    type: String,
    enum: ['Very confident', 'Somewhat confident', 'Not confident'],
    required: true
  },

  // Section 3: Financial Risk Experience
  processingFeeUncertainty: {
    type: String,
    enum: ['Yes', 'No'],
    required: true
  },
  fraudExperience: {
    type: String,
    enum: ['Yes', 'No'],
    required: true
  },
  agreementReadingHabit: {
    type: String,
    enum: ['Always', 'Sometimes', 'Rarely'],
    required: true
  },

  // Section 4: Rental / Agreement Awareness
  rentalAgreementExperience: {
    type: String,
    enum: ['Yes', 'No'],
    required: true
  },
  rentalTermsUnderstanding: {
    type: String,
    enum: ['Yes', 'No', 'Not completely'],
    required: true
  },

  // Section 5: Validation Platform Need
  platformUsageWillingness: {
    type: String,
    enum: ['Definitely', 'Maybe', 'No'],
    required: true
  },
  platformFeatures: [{
    type: String,
    enum: ['Hidden charges', 'EMI burden', 'Risk score', 'Agreement clauses', 'Scam detection', 'All of the above']
  }],
  biggestFear: {
    type: String,
    required: true
  },

  // Optional: Risk Scale
  riskScale: {
    type: Number,
    required: false,
    min: 1,
    max: 5,
    validate: {
      validator: function(value) {
        return !value || (value >= 1 && value <= 5);
      },
      message: 'Risk scale must be between 1 and 5'
    }
  },

  // Metadata
  ipAddress: String,
  userAgent: String,
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
surveySchema.index({ submittedAt: -1 });
surveySchema.index({ ageGroup: 1, occupation: 1 });
surveySchema.index({ email: 1 }); // For unique email checks if needed
surveySchema.index({ emailVerified: 1 });

module.exports = mongoose.model('Survey', surveySchema);
