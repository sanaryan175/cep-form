const mongoose = require('mongoose');

const AccessRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied'],
      default: 'pending'
    },
    approvalToken: { type: String, required: true, unique: true, index: true },
    decidedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AccessRequest', AccessRequestSchema);
