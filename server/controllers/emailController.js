const { sendOTPEmail, generateOTP, storeOTP, verifyOTP } = require('../services/emailService');

// Send verification email
const sendVerificationEmail = async (req, res) => {
  try {
    const startedAt = Date.now();
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP
    const storeStart = Date.now();
    await storeOTP(email, otp);
    const storeMs = Date.now() - storeStart;
    
    // Send email (async) - respond immediately to keep UI fast
    const emailQueuedAt = Date.now();
    sendOTPEmail(email, otp).catch((error) => {
      console.error('Async OTP send failed:', {
        email,
        message: error?.message || String(error)
      });
    });

    const totalMs = Date.now() - startedAt;
    console.log('OTP send request timings:', {
      email,
      storeMs,
      queuedAfterMs: emailQueuedAt - startedAt,
      totalMs
    });

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email'
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email',
      error: error.message
    });
  }
};

// Verify OTP
const verifyEmailCode = async (req, res) => {
  try {
    const startedAt = Date.now();
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const verifyStart = Date.now();
    const verification = await verifyOTP(email, otp);
    const verifyMs = Date.now() - verifyStart;
    const totalMs = Date.now() - startedAt;

    console.log('OTP verify request timings:', {
      email,
      verifyMs,
      totalMs,
      result: verification?.valid ? 'valid' : 'invalid'
    });
    
    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email',
      error: error.message
    });
  }
};

module.exports = {
  sendVerificationEmail,
  verifyEmailCode
};
