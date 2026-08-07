const mongoose = require('mongoose');

const proofSchema = new mongoose.Schema(
  {
    goalId: {
      type: String,
      required: true,
      trim: true
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
    }
  },
  {
    timestamps: true
  }
);

const Proof = mongoose.model('Proof', proofSchema);

module.exports = Proof;
