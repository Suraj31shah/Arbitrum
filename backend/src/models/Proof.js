const mongoose = require('mongoose');

const proofSchema = new mongoose.Schema(
  {
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true
    },
    walletAddress: {
      type: String,
      required: true,
      lowercase: true
    },
    githubUrl: {
      type: String,
      trim: true,
      default: ''
    },
    websiteUrl: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      default: 'pending'
    },
    filePaths: [{
      type: String
    }],
    filePath: {
      type: String,
      default: ''
    },
    aiAnalysis: {
      confidence: { type: Number, default: 0 },
      completed: { type: Boolean, default: false },
      strengths: { type: [String], default: [] },
      missingEvidence: { type: [String], default: [] },
      summary: { type: String, default: '' },
      recommendation: { type: String, default: '' }
    },
    disputed: {
      type: Boolean,
      default: false
    },
    disputeReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const Proof = mongoose.model('Proof', proofSchema);

module.exports = Proof;
