const express = require('express');
const router = express.Router();
const { sendVerificationEmail, verifyEmailCode } = require('../controllers/emailController');

// POST /api/email/send - Send verification email
router.post('/send', sendVerificationEmail);

// POST /api/email/verify - Verify OTP
router.post('/verify', verifyEmailCode);

module.exports = router;
