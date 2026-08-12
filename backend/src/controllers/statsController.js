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

    const { walletAddress } = req.query;

    if (walletAddress) {
      const lowerWallet = walletAddress.toLowerCase();
      
      // Filter challenges where this wallet is a participant
      const myChallenges = challenges.filter(c => 
        c.participants && c.participants.some(p => p.walletAddress.toLowerCase() === lowerWallet)
      );

      let totalStaked = 0;
      let activeChallenges = 0;
      let completedChallenges = 0;
      let failedChallenges = 0;

      myChallenges.forEach(c => {
        const p = c.participants.find(p => p.walletAddress.toLowerCase() === lowerWallet);
        if (!p) return;

        totalStaked += (c.stakeAmount || 0);

        if (p.status === 'completed') {
          completedChallenges++;
        } else if (p.status === 'failed') {
          failedChallenges++;
        } else {
          activeChallenges++;
        }
      });

      const totalChallenges = myChallenges.length;
      const successRate = totalChallenges > 0
        ? Math.round((completedChallenges / totalChallenges) * 100)
        : 0;

      return res.json({
        totalChallenges,
        activeChallenges,
        completedChallenges,
        failedChallenges,
        totalStaked,
        successRate
      });
    }

    // Global stats (fallback/default)
    const totalChallenges = challenges.length;
    const activeChallenges = challenges.filter(c => ['joining', 'upcoming', 'active', 'submission'].includes(c.status)).length;
    const completedChallenges = challenges.filter(c => c.status === 'completed').length;
    const failedChallenges = challenges.filter(c => c.status === 'failed').length;
    const totalStaked = challenges.reduce((sum, c) => sum + ((c.stakeAmount || 0) * (c.participants?.length || 1)), 0);
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
    console.error('Failed to compute stats:', error.message);
    res.status(500).json({ error: 'Failed to compute stats' });
  }
};

module.exports = { getDashboardStats };
