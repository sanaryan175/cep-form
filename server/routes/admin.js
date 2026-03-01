const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const mongoose = require('mongoose');
const AccessRequest = require('../models/AccessRequest');
const AccessToken = require('../models/AccessToken');
const { sendAdminAccessRequestEmail, sendOTPEmail } = require('../services/emailService');

// Debug: Check if models are loaded
console.log('🔍 Models loaded:', { 
  AccessRequest: !!AccessRequest, 
  AccessToken: !!AccessToken 
});

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const requestCounts = new Map();

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 3; // max 3 requests per window per email

const getAllowedAdminKeys = () => {
  const keysRaw = process.env.ADMIN_KEYS || process.env.ADMIN_KEY;
  return (keysRaw || '')
    .split(',')
    .map(k => k.trim())
    .filter(Boolean);
};

const getAdminRecipients = () => {
  const recipientsRaw = process.env.ADMIN_EMAILS || process.env.ADMIN_NOTIFICATION_EMAIL || process.env.EMAIL_USER;
  return (recipientsRaw || '')
    .split(',')
    .map(e => e.trim())
    .filter(Boolean);
};

const getAppBaseUrl = () => {
  return process.env.APP_BASE_URL || 'http://localhost:5000';
};

router.post('/verify', (req, res) => {
  const allowedKeys = getAllowedAdminKeys();
  const providedKey = req.get('x-admin-key');

  if (!providedKey) {
    return res.status(403).json({ success: false, message: 'Access restricted' });
  }

  if (allowedKeys.includes(providedKey)) {
    return res.json({ success: true, message: 'Authorized' });
  }

  const tokenHash = sha256(providedKey);
  AccessToken.findOne({ tokenHash })
    .then((token) => {
      if (!token) {
        return res.status(403).json({ success: false, message: 'Access restricted' });
      }
      if (token.expiresAt && token.expiresAt.getTime() < Date.now()) {
        return AccessToken.deleteOne({ _id: token._id }).then(() => {
          return res.status(403).json({ success: false, message: 'Access restricted' });
        });
      }
      return res.json({ success: true, message: 'Authorized' });
    })
    .catch((error) => {
      console.error('Admin verify error:', error);
      return res.status(500).json({ success: false, message: 'Authorization error' });
    });
});

router.post('/request-access', async (req, res) => {
  try {
    const { name, email, reason } = req.body || {};

    if (!name || !email || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and reason are required'
      });
    }

    // Rate limiting: check recent requests for this email
    const now = Date.now();
    const record = requestCounts.get(email);
    if (record && Array.isArray(record.timestamps)) {
      const recent = record.timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
      if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
        return res.status(429).json({
          success: false,
          message: `Too many requests. Please wait ${Math.ceil((RATE_LIMIT_WINDOW_MS - (now - recent[0])) / 60000)} minutes.`
        });
      }
      requestCounts.set(email, { timestamps: [...recent, now] });
    } else {
      requestCounts.set(email, { timestamps: [now] });
    }

    const recipients = getAdminRecipients();

    if (recipients.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'ADMIN_EMAILS or ADMIN_NOTIFICATION_EMAIL is not configured on the server'
      });
    }

    const approvalToken = crypto.randomBytes(24).toString('hex');
    await AccessRequest.create({
      name,
      email,
      reason,
      approvalToken,
      status: 'pending'
    });

    const baseUrl = getAppBaseUrl();
    const approveUrl = `${baseUrl}/api/admin/decision/${approvalToken}?action=approve`;
    const denyUrl = `${baseUrl}/api/admin/decision/${approvalToken}?action=deny`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px;">
          <h2 style="margin: 0 0 12px 0;">Dashboard Access Request</h2>
          <p style="margin: 0 0 16px 0; color: #444;">A user requested access to the dashboard.</p>
          <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; background: #f9fafb;">
            <p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${String(name).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
            <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${String(email).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
            <p style="margin: 0;"><strong>Reason:</strong> ${String(reason).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>

          <div style="margin-top: 18px; display: flex; gap: 12px;">
            <a href="${approveUrl}" style="display:inline-block;background:#10b981;color:white;text-decoration:none;padding:10px 14px;border-radius:8px;font-weight:600;">Approve</a>
            <a href="${denyUrl}" style="display:inline-block;background:#ef4444;color:white;text-decoration:none;padding:10px 14px;border-radius:8px;font-weight:600;">Disapprove</a>
          </div>

          <p style="margin-top: 14px; color: #6b7280; font-size: 12px;">If the buttons don't work, open these links:</p>
          <p style="margin: 0; font-size: 12px;"><a href="${approveUrl}">${approveUrl}</a></p>
          <p style="margin: 0; font-size: 12px;"><a href="${denyUrl}">${denyUrl}</a></p>
        </div>
      `;

    // Send to each admin recipient using Resend
    for (const recipient of recipients) {
      await sendAdminAccessRequestEmail({
        name,
        email,
        reason,
        to: recipient,
        subject: 'Dashboard Access Request - Financial Awareness Survey',
        html
      });
    }

    return res.json({ success: true, message: 'Access request sent' });
  } catch (error) {
    console.error('Request access error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send access request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/decision/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { action } = req.query;

    console.log('🔍 Decision request:', { token, action });
    console.log('🔍 MongoDB connection state:', mongoose.connection.readyState);

    if (!token || !action) {
      console.log('❌ Missing token or action');
      return res.status(400).send('Invalid request');
    }

    const request = await AccessRequest.findOne({ approvalToken: token });
    console.log('🔍 DB query result:', request);
    
    if (!request) {
      console.log('❌ Request not found for token:', token);
      return res.status(404).send('Request not found');
    }

    console.log('📋 Found request:', { 
      id: request._id, 
      status: request.status, 
      email: request.email,
      name: request.name 
    });

    if (!request.email) {
      console.log('❌ Request has no email field');
      return res.status(500).send('Invalid request data');
    }

    if (request.status !== 'pending') {
      console.log('⚠️ Request already processed:', request.status);
      return res.status(200).send(`Request already ${request.status}.`);
    }

    const normalized = String(action).toLowerCase();
    if (normalized !== 'approve' && normalized !== 'deny') {
      console.log('❌ Invalid action:', action);
      return res.status(400).send('Invalid action');
    }

    request.status = normalized === 'approve' ? 'approved' : 'denied';
    request.decidedAt = new Date();
    await request.save();

    console.log('✅ Status updated to:', request.status);

    if (request.status === 'approved') {
      const ttlMinutes = Number(process.env.ACCESS_TOKEN_TTL_MINUTES || 10);
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

      const accessCode = crypto.randomBytes(9).toString('hex');
      const tokenHash = sha256(accessCode);
      await AccessToken.create({ tokenHash, email: request.email, expiresAt });

      console.log('🔑 Access token created for:', request.email);

      const html = `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px;">
            <h2 style="margin: 0 0 12px 0;">Access Approved</h2>
            <p style="margin: 0 0 16px 0; color: #444;">Your request to access the dashboard has been approved.</p>
            <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; background: #f9fafb;">
              <p style="margin: 0 0 8px 0;"><strong>Your Access Code:</strong></p>
              <div style="font-size: 20px; font-weight: 700; letter-spacing: 1px;">${accessCode}</div>
              <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">Valid for ${ttlMinutes} minutes (until ${expiresAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })})</p>
            </div>
            <p style="margin-top: 14px; color: #444;">Open the app → Dashboard → paste this code in the Admin Key field.</p>
          </div>
        `;

      console.log('📧 Sending approval email to:', request.email);
      await sendAdminAccessRequestEmail({
        name: request.name,
        email: request.email,
        reason: '',
        to: request.email,
        subject: 'Dashboard Access Approved - Financial Awareness Survey',
        html
      });
      console.log('✅ Approval email sent');

      return res.status(200).send('Approved. Access code sent to the requester.');
    }

    const denyHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px;">
          <h2 style="margin: 0 0 12px 0;">Access Request Update</h2>
          <p style="margin: 0; color: #444;">Your request to access the dashboard was not approved at this time.</p>
        </div>
      `;

    console.log('📧 Sending denial email to:', request.email);
    await sendAdminAccessRequestEmail({
      name: request.name,
      email: request.email,
      reason: '',
      to: request.email,
      subject: 'Dashboard Access Request Update - Financial Awareness Survey',
      html: denyHtml
    });
    console.log('✅ Denial email sent');

    return res.status(200).send('Disapproved. Requester notified via email.');
  } catch (error) {
    console.error('Decision error:', error);
    return res.status(500).send('Server error');
  }
});

module.exports = router;
