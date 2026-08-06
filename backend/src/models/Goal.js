const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
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
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

const Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal;
