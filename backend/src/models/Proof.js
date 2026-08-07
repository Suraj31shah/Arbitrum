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
      type: {
        confidence: Number,
        completed: Boolean,
        strengths: [String],
        missingEvidence: [String],
        summary: String,
        recommendation: String
      },
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Proof = mongoose.model('Proof', proofSchema);

module.exports = Proof;
