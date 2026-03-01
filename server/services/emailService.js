const axios = require('axios');
require('dotenv').config();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email via Resend HTTP API
const sendOTPEmail = async (email, otp) => {
  try {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      throw new Error('Email service not configured. Please set RESEND_API_KEY and EMAIL_FROM.');
    }

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Financial Awareness Survey</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Email Verification</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Thank you for starting the Financial Awareness Survey! To continue, please verify your email address using the OTP below:
            </p>
            
            <div style="background: white; border: 2px dashed #667eea; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your Verification Code:</p>
              <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 5px; margin: 10px 0;">
                ${otp}
              </div>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-top: 20px;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>⚠️ Important:</strong> This code will expire in 10 minutes for security reasons.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
          </div>
        </div>
      `;

    const payload = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Financial Awareness Survey - Email Verification',
      html
    };

    const response = await axios.post('https://api.resend.com/emails', payload, {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ OTP sent to ${email} via Resend:`, response.data?.id || 'no-id');
    return { success: true, id: response.data?.id };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    const msg = error?.message || 'Failed to send verification email';
    const isConfigError =
      msg.includes('Email service not configured') ||
      msg.includes('401') ||
      msg.includes('403');

    if (process.env.NODE_ENV === 'development' || isConfigError) {
      throw new Error(msg);
    }

    throw new Error('Failed to send verification email');
  }
};

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map();

// Store OTP with expiry
const storeOTP = (email, otp) => {
  const expiry = Date.now() + (10 * 60 * 1000); // 10 minutes
  otpStore.set(email, { otp, expiry });
};

// Verify OTP
const verifyOTP = (email, providedOTP) => {
  const storedData = otpStore.get(email);
  
  if (!storedData) {
    return { valid: false, message: 'OTP not found or expired' };
  }
  
  if (Date.now() > storedData.expiry) {
    otpStore.delete(email);
    return { valid: false, message: 'OTP expired' };
  }
  
  if (storedData.otp !== providedOTP) {
    return { valid: false, message: 'Invalid OTP' };
  }
  
  otpStore.delete(email);
  return { valid: true, message: 'OTP verified successfully' };
};

// Send admin access request email via Resend HTTP API
const sendAdminAccessRequestEmail = async ({ name, email, reason, to, subject, html }) => {
  try {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      throw new Error('Email service not configured. Please set RESEND_API_KEY and EMAIL_FROM.');
    }

    const payload = {
      from: process.env.EMAIL_FROM,
      to: to || process.env.ADMIN_NOTIFICATION_EMAIL || email,
      subject: subject || 'PaySure Dashboard Access Request',
      html: html || `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>New Dashboard Access Request</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Reason:</strong></p>
          <p>${reason}</p>
        </div>
      `
    };

    console.log('🔍 Resend payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post('https://api.resend.com/emails', payload, {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Admin access request email sent via Resend:`, response.data?.id || 'no-id');
    return { success: true, id: response.data?.id };
  } catch (error) {
    console.error('❌ Error sending admin access email:', error?.response?.data || error.message);
    if (error?.response?.status) {
      console.error('❌ Resend API status:', error.response.status);
    }
    throw new Error('Failed to send admin access request email');
  }
};

module.exports = {
  sendOTPEmail,
  generateOTP,
  storeOTP,
  verifyOTP,
  sendAdminAccessRequestEmail
};
