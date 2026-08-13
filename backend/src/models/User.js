const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    githubId: {
      type: String,
      unique: true,
      sparse: true // sparse allows multiple nulls
    },
    githubUsername: String,
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
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
