const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    stakeAmount: {
      type: Number,
      required: true,
      min: 0
    },
    deadline: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'proof_submitted', 'verifying', 'ai_verified', 'completed', 'failed', 'expired'],
      default: 'active'
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Challenge = mongoose.model('Challenge', challengeSchema);

module.exports = Challenge;
