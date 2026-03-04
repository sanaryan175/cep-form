const axios = require('axios');
const sgMail = require('@sendgrid/mail');
const EmailOTP = require('../models/EmailOTP');
require('dotenv').config();

if (process.env.SENDGRID_API_KEY) {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('SendGrid for OTP initialised');
  } catch (err) {
    console.error('Error initialising SendGrid for OTP:', err.message || err);
  }
} else {
  console.log('SendGrid API key not set for OTP emails');
}

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email via SendGrid with retry logic for consistent delivery
const sendOTPEmail = async (email, otp, retryCount = 0) => {
  const maxRetries = 2;
  
  try {
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      throw new Error('Email service not configured. Please set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL.');
    }

    const startedAt = Date.now();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Financial Awareness Survey</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Email Verification</p>
        </div>

        <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.10); border: 1px solid #e5e7eb;">
          <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px;">Hi there,</p>
          <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 14px;">Use the verification code below to complete your survey:</p>

          <div style="text-align: center; margin: 22px 0;">
            <div style="display: inline-block; padding: 14px 26px; border-radius: 999px; background: rgba(79, 70, 229, 0.06); border: 1px solid rgba(79, 70, 229, 0.35);">
              <span style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 24px; letter-spacing: 0.35em; font-weight: 700; color: #4f46e5;">${otp}</span>
            </div>
          </div>

          <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px;">This code will expire in <strong>10 minutes</strong>.</p>
          <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 12px;">If you didn't request this verification, you can safely ignore this email.</p>
        </div>

        <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 11px; text-align: center;">You're receiving this email because your address was used to verify access for the Financial Awareness Survey on PaySure.</p>
      </div>
    `;

    // Always use the configured (and authenticated) sender
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;

    const msg = {
      to: email,
      from: {
        email: fromEmail,
        name: process.env.SENDGRID_FROM_NAME || 'Sanskriti',
      },
      subject: 'Your Financial Awareness Survey Verification Code',
      html,
      // Add priority headers for better delivery
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    };

    console.log(`📧 Sending OTP email via SendGrid (attempt ${retryCount + 1}):`, {
      to: email,
      from: fromEmail
    });
    
    const sendStart = Date.now();
    const response = await sgMail.send(msg);
    const sendMs = Date.now() - sendStart;
    const totalMs = Date.now() - startedAt;
    
    console.log('✅ OTP email sent via SendGrid:', {
      email,
      from: fromEmail,
      attempt: retryCount + 1,
      statusCode: response?.statusCode,
      sendMs,
      totalMs
    });
    
    return { success: true, attempt: retryCount + 1 };
    
  } catch (error) {
    console.error(`❌ SendGrid error (attempt ${retryCount + 1}):`, {
      email,
      error: error?.response?.body || error.message,
      statusCode: error?.response?.statusCode
    });
    
    // Retry on throttling or temporary errors
    if (retryCount < maxRetries && (
      error?.response?.statusCode === 429 || // Rate limited
      error?.response?.statusCode >= 500 || // Server error
      error?.code === 'ECONNRESET' // Connection error
    )) {
      console.log(`🔄 Retrying OTP send (${retryCount + 1}/${maxRetries}) after delay...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
      return sendOTPEmail(email, otp, retryCount + 1);
    }
    
    throw new Error('Failed to send verification email');
  }
};

// Store OTP with expiry (MongoDB + TTL) - Optimized
const storeOTP = async (email, otp) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const startedAt = Date.now();

  // Use lean() for faster query and minimal fields
  await EmailOTP.findOneAndUpdate(
    { email: normalizedEmail },
    { $set: { otp: String(otp), expiresAt } },
    { upsert: true, new: true, lean: true }
  );

  console.log('OTP stored fast:', {
    email: normalizedEmail,
    ms: Date.now() - startedAt
  });
};

// Verify OTP (MongoDB) - Optimized
const verifyOTP = async (email, providedOTP) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const provided = String(providedOTP).trim();

  const startedAt = Date.now();

  // Use lean() and select only needed fields for faster query
  const record = await EmailOTP.findOne({ email: normalizedEmail })
    .select('otp expiresAt')
    .lean();

  if (!record) {
    console.log('OTP verified:', {
      email: normalizedEmail,
      result: 'not_found',
      ms: Date.now() - startedAt
    });
    return { valid: false, message: 'OTP not found or expired' };
  }

  if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now()) {
    await EmailOTP.deleteOne({ email: normalizedEmail }).catch(() => {});
    console.log('OTP verified:', {
      email: normalizedEmail,
      result: 'expired',
      ms: Date.now() - startedAt
    });
    return { valid: false, message: 'OTP expired' };
  }

  if (String(record.otp) !== provided) {
    console.log('OTP verified:', {
      email: normalizedEmail,
      result: 'invalid',
      ms: Date.now() - startedAt
    });
    // IMPORTANT: do NOT delete OTP on invalid attempt
    return { valid: false, message: 'Invalid OTP' };
  }

  await EmailOTP.deleteOne({ email: normalizedEmail }).catch(() => {});
  console.log('OTP verified:', {
    email: normalizedEmail,
    result: 'valid',
    ms: Date.now() - startedAt
  });

  return { valid: true, message: 'OTP verified successfully' };
};

// Send admin access request email via Resend HTTP API
const sendAdminAccessRequestEmail = async ({ name, email, reason, to, subject, html }) => {
  try {
    console.log('🔧 Environment check:', {
      RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET' : 'NOT SET',
      EMAIL_FROM: process.env.EMAIL_FROM,
      RESEND_API_KEY_LENGTH: process.env.RESEND_API_KEY?.length || 0
    });

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
