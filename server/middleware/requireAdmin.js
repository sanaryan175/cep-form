const crypto = require('crypto');
const AccessToken = require('../models/AccessToken');

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const requireAdmin = async (req, res, next) => {
  try {
    const keysRaw = process.env.ADMIN_KEYS || process.env.ADMIN_KEY;
    const allowedKeys = (keysRaw || '')
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    const providedKey = req.get('x-admin-key');
    if (!providedKey) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted'
      });
    }

    if (allowedKeys.includes(providedKey)) {
      return next();
    }

    const tokenHash = sha256(providedKey);
    const token = await AccessToken.findOne({ tokenHash });
    if (!token) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted'
      });
    }

    if (token.expiresAt && token.expiresAt.getTime() < Date.now()) {
      await AccessToken.deleteOne({ _id: token._id });
      return res.status(403).json({
        success: false,
        message: 'Access restricted'
      });
    }

    return next();
  } catch (error) {
    console.error('requireAdmin error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization error'
    });
  }
};

module.exports = requireAdmin;
