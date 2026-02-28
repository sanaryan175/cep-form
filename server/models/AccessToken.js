const mongoose = require('mongoose');

const AccessTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

AccessTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AccessToken', AccessTokenSchema);
