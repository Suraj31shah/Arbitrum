const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  walletAddress: { type: String, required: true },
  status: { type: String, enum: ['active', 'proof_submitted', 'verifying', 'completed', 'failed'], default: 'active' },
  proofData: { type: Object, default: {} }
}, { _id: false, timestamps: true });

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
    prizePool: {
      type: Number,
      default: 0
    },
    deadline: {
      type: Date,
      required: true
    },
    // Global status of the challenge
    status: {
      type: String,
      enum: ['active', 'expired', 'completed', 'failed', 'ai_verified'],
      default: 'active'
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    participants: [participantSchema],
    integrationId: {
      type: String,
      default: 'none'
    },
    integrationHandle: {
      type: String,
      default: ''
    },
    metricValue: {
      type: Number,
      default: null
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
