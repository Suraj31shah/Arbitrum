const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
const { readChallenges } = require('../utils/localChallengeStore');

const getDashboardStats = async (req, res) => {
  try {
    let challenges = [];
    if (mongoose.connection.readyState !== 1) {
      challenges = readChallenges();
    } else {
      challenges = await Challenge.find();
    }

    const totalChallenges = challenges.length;
    const activeChallenges = challenges.filter(c => c.status === 'active').length;
    const completedChallenges = challenges.filter(c => c.status === 'completed').length;
    const failedChallenges = challenges.filter(c => c.status === 'failed').length;
    const totalStaked = challenges.reduce((sum, c) => sum + (c.stakeAmount || 0), 0);
    const successRate = totalChallenges > 0
      ? Math.round((completedChallenges / totalChallenges) * 100)
      : 0;

    res.json({
      totalChallenges,
      activeChallenges,
      completedChallenges,
      failedChallenges,
      totalStaked,
      successRate
    });
  } catch (error) {
    console.error('Failed to compute stats from DB, calculating from local store:', error.message);
    const challenges = readChallenges();
    const totalChallenges = challenges.length;
    const activeChallenges = challenges.filter(c => c.status === 'active').length;
    const completedChallenges = challenges.filter(c => c.status === 'completed').length;
    const failedChallenges = challenges.filter(c => c.status === 'failed').length;
    const totalStaked = challenges.reduce((sum, c) => sum + (c.stakeAmount || 0), 0);
    const successRate = totalChallenges > 0 ? Math.round((completedChallenges / totalChallenges) * 100) : 0;

    res.json({
      totalChallenges,
      activeChallenges,
      completedChallenges,
      failedChallenges,
      totalStaked,
      successRate
    });
  }
};

module.exports = { getDashboardStats };
