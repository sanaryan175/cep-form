import React, { useState, useEffect } from 'react';
import { submitSurvey, sendVerificationEmail, verifyEmailCode } from '../services/api';

const SurveyForm = ({ setEmailVerified, emailVerified }) => {
  const [currentSection, setCurrentSection] = useState(emailVerified ? 0 : -1); // Start with -1 for pre-survey
  const [formData, setFormData] = useState({
    // Pre-survey information
    name: '',
    email: '',
    emailVerified: !!emailVerified,
    // Section 1: Basic Information
    ageGroup: '',
    occupation: '',
    loanExperience: '',

    // Section 2: Loan Awareness
    interestRateUnderstanding: '',
    totalRepaymentCalculation: '',
    hiddenChargesExperience: '',
    aprKnowledge: '',
    agreementReadingConfidence: '',

    // Section 3: Financial Risk Experience
    processingFeeUncertainty: '',
    fraudExperience: '',
    agreementReadingHabit: '',

    // Section 4: Rental / Agreement Awareness
    rentalAgreementExperience: '',
    rentalTermsUnderstanding: '',

    // Section 5: Validation Platform Need
    platformUsageWillingness: '',
    platformFeatures: [],
    biggestFear: '',
    riskScale: 3
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const clearStatusMessage = () => setStatusMessage(null);

  // On mount, restore name/email if they were saved during this 15-min verification window
  useEffect(() => {
    const storedName = localStorage.getItem('surveyName') || '';
    const storedEmail = localStorage.getItem('surveyEmail') || '';
    if (storedName || storedEmail) {
      setFormData(prev => ({
        ...prev,
        name: storedName,
        email: storedEmail
      }));
    }
  }, []);

  useEffect(() => {
    return () => {
      setIsSubmitting(false);
    };
  }, []);

  useEffect(() => {
    // Enforce verification gate based on authoritative parent state.
    if (!emailVerified) {
      setCurrentSection(-1);
      setShowVerification(false);
      setVerificationCode('');
      setFormData(prev => ({
        ...prev,
        emailVerified: false
      }));
      return;
    }

    // If verified, ensure we are not stuck on verification step
    if (currentSection === -1) {
      setCurrentSection(0);
    }
    setFormData(prev => ({
      ...prev,
      emailVerified: true
    }));
  }, [emailVerified, currentSection]);

  useEffect(() => {
    if (!statusMessage) return;
    if (statusMessage.type === 'error') return;

    const timeoutId = setTimeout(() => {
      setStatusMessage(null);
    }, 4000);

    return () => clearTimeout(timeoutId);
  }, [statusMessage]);

  // Debug: Monitor formData changes
  useEffect(() => {
    console.log('FormData updated:', formData);
    return () => {
      // Cleanup function
    };
  }, [formData]);

  const sections = [
    {
      title: ' Section 1: Basic Information',
      description: 'Tell us about yourself',
      fields: [
        {
          name: 'ageGroup',
          label: 'Age Group',
          type: 'radio',
          options: ['18–22', '23–30', '31–45', '46+']
        },
        {
          name: 'occupation',
          label: 'Occupation',
          type: 'radio',
          options: ['Student', 'Salaried Employee', 'Self-Employed', 'Homemaker', 'Other']
        },
        {
          name: 'loanExperience',
          label: 'Have you ever taken a loan?',
          type: 'radio',
          options: ['Yes', 'No', 'Planning to']
        }
      ]
    },
    {
      title: ' Section 2: Loan Awareness',
      description: 'Your understanding of loan terms',
      fields: [
        {
          name: 'interestRateUnderstanding',
          label: 'Did you fully understand the interest rate and EMI calculation before taking the loan?',
          type: 'radio',
          options: ['Yes', 'Partially', 'No']
        },
        {
          name: 'totalRepaymentCalculation',
          label: 'Did you calculate the total repayment amount before signing?',
          type: 'radio',
          options: ['Yes', 'No']
        },
        {
          name: 'hiddenChargesExperience',
          label: 'Have you ever faced hidden charges (processing fee, penalty, insurance, etc.)?',
          type: 'radio',
          options: ['Yes', 'No', 'Not sure']
        },
        {
          name: 'aprKnowledge',
          label: 'Do you know the difference between advertised interest rate and effective interest rate (APR)?',
          type: 'radio',
          options: ['Yes', 'No']
        },
        {
          name: 'agreementReadingConfidence',
          label: 'How confident are you in reading loan agreements?',
          type: 'radio',
          options: ['Very confident', 'Somewhat confident', 'Not confident']
        }
      ]
    },
    {
      title: ' Section 3: Financial Risk Experience',
      description: 'Your experiences with financial risks',
      fields: [
        {
          name: 'processingFeeUncertainty',
          label: 'Have you ever felt unsure before paying a loan processing fee or deposit?',
          type: 'radio',
          options: ['Yes', 'No']
        },
        {
          name: 'fraudExperience',
          label: 'Have you or someone you know faced financial fraud related to loans or agreements?',
          type: 'radio',
          options: ['Yes', 'No']
        },
        {
          name: 'agreementReadingHabit',
          label: 'Do you usually read full agreements before signing?',
          type: 'radio',
          options: ['Always', 'Sometimes', 'Rarely']
        }
      ]
    },
    {
      title: ' Section 4: Rental / Agreement Awareness',
      description: 'Your experience with rental agreements',
      fields: [
        {
          name: 'rentalAgreementExperience',
          label: 'Have you signed a rental agreement?',
          type: 'radio',
          options: ['Yes', 'No']
        },
        {
          name: 'rentalTermsUnderstanding',
          label: 'Did you fully understand penalty clauses and deposit terms?',
          type: 'radio',
          options: ['Yes', 'No', 'Not completely']
        }
      ]
    },
    {
      title: ' Section 5: Validation Platform Need',
      description: 'Your thoughts on a validation platform',
      fields: [
        {
          name: 'platformUsageWillingness',
          label: 'Would you use a platform that checks loan risk and hidden charges before you commit money?',
          type: 'radio',
          options: ['Definitely', 'Maybe', 'No']
        },
        {
          name: 'platformFeatures',
          label: 'What would you like such a platform to check?',
          type: 'checkbox',
          options: ['Hidden charges', 'EMI burden', 'Risk score', 'Agreement clauses', 'Scam detection', 'All of the above']
        },
        {
          name: 'biggestFear',
          label: 'What is your biggest fear while taking a loan or signing an agreement?',
          type: 'textarea',
          placeholder: 'Share your thoughts...'
        },
        {
          name: 'riskScale',
          label: 'On a scale of 1–5, how risky do you think financial decisions are in India today? (1 = Very Safe, 5 = Very Risky)',
          type: 'scale',
          min: 1,
          max: 5
        }
      ]
    }
  ];

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Persist only name & email so they are remembered after Dashboard -> Survey
    if (name === 'name') {
      localStorage.setItem('surveyName', value);
    }
    if (name === 'email') {
      localStorage.setItem('surveyEmail', value);
    }
  };

  const handleCheckboxChange = (name, value, checked) => {
    setFormData(prev => {
      const currentValues = prev[name] || [];
      if (checked) {
        return {
          ...prev,
          [name]: [...currentValues, value]
        };
      }

      return {
        ...prev,
        [name]: currentValues.filter(item => item !== value)
      };
    });
  };

  // Email verification functions
  const sendVerificationCode = async () => {
    clearStatusMessage();
    if (!formData.name || !formData.email) {
      setStatusMessage({ type: 'error', text: 'Please enter your name and email address first.' });
      return;
    }

    setIsSendingCode(true);
    try {
      console.log('Sending verification email to:', formData.email);
      await sendVerificationEmail(formData.email);

      setStatusMessage({
        type: 'success',
        text: `Verification code sent to ${formData.email}. Please check your email and enter the code below.`
      });
      
      setShowVerification(true);
    } catch (error) {
      setStatusMessage({ type: 'error', text: `Error sending verification email: ${error.message}` });
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyEmailCodeHandler = async () => {
    clearStatusMessage();
    if (!verificationCode) {
      setStatusMessage({ type: 'error', text: 'Please enter the verification code.' });
      return;
    }

    setIsVerifying(true);
    try {
      console.log('Verifying code for email:', formData.email);
      const response = await verifyEmailCode(formData.email, verificationCode);
      
      if (response.success) {
        console.log('Before verification - formData:', formData);
        setFormData(prev => ({ 
          ...prev, 
          emailVerified: true 
        }));
        setShowVerification(false);
        setCurrentSection(0); // Move to first survey section
        setEmailVerified(true); // Update parent state to show navbar
        console.log('After verification - email verified, moving to survey');
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: `Error verifying email: ${error.message}` });
    } finally {
      setIsVerifying(false);
    }
  };

  const validateSection = () => {
    const currentFields = sections[currentSection].fields;
    for (const field of currentFields) {
      if (field.type !== 'checkbox' && !formData[field.name]) {
        return false;
      }
      if (field.type === 'checkbox' && formData[field.name].length === 0) {
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    clearStatusMessage();
    if (validateSection()) {
      if (currentSection < sections.length - 1) {
        setCurrentSection(currentSection + 1);
      }
    } else {
      setStatusMessage({ type: 'error', text: 'Please fill in all required fields before proceeding.' });
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearStatusMessage();
    console.log('=== handleSubmit start ===');
    console.log('Current section:', currentSection);
    console.log('formData.emailVerified:', formData.emailVerified);
    console.log('formData snapshot:', { ...formData });
    if (currentSection === -1) {
      console.error('Submit attempted on verification step');
      setStatusMessage({ type: 'error', text: 'Please verify your email before submitting the survey.' });
      return;
    }
    if (!validateSection()) {
      console.error('Validation failed for section', currentSection);
      setStatusMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }
    console.log('Validation passed');

    setIsSubmitting(true);
    try {
      // Debug log to ensure name and email are included
      console.log('Submitting survey data:', {
        name: formData.name,
        email: formData.email,
        emailVerified: formData.emailVerified,
        biggestFear: formData.biggestFear
      });
      
      await submitSurvey(formData);
      setSubmitted(true);
      console.log('Survey submitted successfully');
    } catch (error) {
      console.error('Submit error caught:', error);
      console.error('Error message:', error.message);
      console.error('Error response data:', error.response?.data);
      setStatusMessage({ type: 'error', text: `Error submitting survey: ${error.message || 'Unknown error'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Thank You!</h2>
          <p className="text-gray-600 mb-6">Your Financial Awareness Survey response has been submitted successfully.</p>
          <button
            onClick={() => {
              // Clear survey + verification state and go back to email verification step
              setSubmitted(false);
              setCurrentSection(-1);
              setShowVerification(false);
              setVerificationCode('');
              setEmailVerified(false);
              localStorage.removeItem('emailVerifiedUntil');
              localStorage.removeItem('surveyName');
              localStorage.removeItem('surveyEmail');
              setFormData({
                name: '',
                email: '',
                emailVerified: false,
                ageGroup: '',
                occupation: '',
                loanExperience: '',
                interestRateUnderstanding: '',
                totalRepaymentCalculation: '',
                hiddenChargesExperience: '',
                aprKnowledge: '',
                agreementReadingConfidence: '',
                processingFeeUncertainty: '',
                fraudExperience: '',
                agreementReadingHabit: '',
                rentalAgreementExperience: '',
                rentalTermsUnderstanding: '',
                platformUsageWillingness: '',
                platformFeatures: [],
                biggestFear: '',
                riskScale: 3
              });
            }}
            className="btn-primary"
          >
            Submit Another Response
          </button>
        </div>
      </div>
    );
  }

  const currentSectionData = sections[currentSection];

  // Pre-survey verification form
  if (currentSection === -1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Financial Awareness Survey</h1>
          <p className="text-gray-600 mb-6">Please verify your email before starting the survey</p>

          {statusMessage && (
            <div
              className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                statusMessage.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : statusMessage.type === 'error'
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : 'border-blue-200 bg-blue-50 text-blue-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">{statusMessage.text}</div>
                <button
                  type="button"
                  onClick={clearStatusMessage}
                  className="text-gray-500 hover:text-gray-700 leading-none"
                  aria-label="Dismiss message"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          
          {!showVerification ? (
            <div className="space-y-4">
              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    console.log('Name input changed:', e.target.value);
                    handleInputChange('name', e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    console.log('Email input changed:', e.target.value);
                    handleInputChange('email', e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your email address"
                  required
                />
              </div>
              
              <button
                onClick={sendVerificationCode}
                disabled={isSendingCode}
                className="w-full btn-primary"
              >
                {isSendingCode ? 'Sending...' : 'Send Verification Code'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="form-label">Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                />
              </div>
              
              <button
                onClick={verifyEmailCodeHandler}
                disabled={isVerifying}
                className="w-full btn-primary"
              >
                {isVerifying ? 'Verifying...' : 'Verify Code'}
              </button>
              
              <button
                onClick={() => setShowVerification(false)}
                className="w-full btn-secondary"
              >
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {statusMessage && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
              statusMessage.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : statusMessage.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-blue-200 bg-blue-50 text-blue-800'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">{statusMessage.text}</div>
              <button
                type="button"
                onClick={clearStatusMessage}
                className="text-gray-500 hover:text-gray-700 leading-none"
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          </div>
        )}
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Section {currentSection + 1} of {sections.length}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(((currentSection + 1) / sections.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Survey Form */}
        <div className="survey-section">
          <h1 className="survey-title">{currentSectionData.title}</h1>
          <p className="survey-description">{currentSectionData.description}</p>

          <form onSubmit={handleSubmit}>
            {currentSectionData.fields.map((field) => (
              <div key={field.name} className="form-group">
                <label className="form-label">{field.label}</label>

                {field.type === 'radio' && (
                  <div className="form-radio-group">
                    {field.options.map((option) => (
                      <label key={option} className="form-radio-label">
                        <input
                          type="radio"
                          name={field.name}
                          value={option}
                          checked={formData[field.name] === option}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {field.type === 'checkbox' && (
                  <div className="form-checkbox-group">
                    {field.options.map((option) => (
                      <label key={option} className="form-checkbox-label">
                        <input
                          type="checkbox"
                          name={field.name}
                          value={option}
                          checked={formData[field.name].includes(option)}
                          onChange={(e) => handleCheckboxChange(field.name, option, e.target.checked)}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {field.type === 'textarea' && (
                  <textarea
                    name={field.name}
                    value={formData[field.name]}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows="4"
                    required
                  />
                )}

                {field.type === 'scale' && (
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      name={field.name}
                      min={field.min}
                      max={field.max}
                      value={formData[field.name]}
                      onChange={(e) => handleInputChange(field.name, parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-lg font-medium text-primary-600 w-8">
                      {formData[field.name]}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentSection === 0}
                className={`btn-secondary ${currentSection === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Previous
              </button>

              {currentSection === sections.length - 1 ? (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Survey'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary"
                >
                  Next
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SurveyForm;
