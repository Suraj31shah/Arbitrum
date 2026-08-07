const Challenge = require('../models/Challenge');

const getDashboardStats = async (req, res) => {
  try {
    const challenges = await Challenge.find();

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
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
};

module.exports = { getDashboardStats };
