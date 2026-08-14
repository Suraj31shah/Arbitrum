const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    githubId: {
      type: String,
      unique: true,
      sparse: true // sparse allows multiple nulls
    },
    githubUsername: String,
    githubAccessToken: String,
    notionId: {
      type: String,
      unique: true,
      sparse: true
    },
    notionAccessToken: String,
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    googleAccessToken: String,
    googleRefreshToken: String,
    username: {
      type: String
    },
    profileUrl: {
      type: String
    },
    walletAddress: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: ''
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: {
      type: String,
      default: null
    },
    emailVerificationExpires: {
      type: Date,
      default: null
    },
    notificationPreferences: {
      deadlineReminders: { type: Boolean, default: true },
      participantJoined: { type: Boolean, default: true },
      proofResults: { type: Boolean, default: true },
      challengeCompleted: { type: Boolean, default: true },
      rewardReceived: { type: Boolean, default: true }
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
