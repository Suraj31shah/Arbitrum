const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
const { readChallenges } = require('../utils/localChallengeStore');

const getDashboardStats = async (req, res) => {
  try {
    if (!req.isAuthenticated() || !req.user || !req.user.walletAddress) {
      return res.json({
        totalChallenges: 0,
        activeChallenges: 0,
        completedChallenges: 0,
        failedChallenges: 0,
        totalStaked: 0,
        successRate: 0
      });
    }

    const userId = req.user._id || req.user.id;
    const userWallet = req.user.walletAddress ? req.user.walletAddress.toLowerCase() : null;

    let challenges = [];
    if (mongoose.connection.readyState !== 1) {
      const localChallenges = readChallenges();
      challenges = localChallenges.filter(c => {
        if (!c) return false;
        const creatorId = c.creator?._id?.toString() || c.creator?.toString();
        const currentUserId = userId?.toString();
        if (creatorId && currentUserId && creatorId === currentUserId) return true;

        if (Array.isArray(c.participants)) {
          return c.participants.some(p => {
            const pUserId = p.user?._id?.toString() || p.user?.toString();
            if (pUserId && currentUserId && pUserId === currentUserId) return true;
            if (userWallet && p.walletAddress && p.walletAddress.toLowerCase() === userWallet) return true;
            return false;
          });
        }
        return false;
      });
    } else {
      const orConditions = [
        { creator: userId },
        { 'participants.user': userId }
      ];
      if (userWallet) {
        orConditions.push({ 'participants.walletAddress': userWallet });
      }
      challenges = await Challenge.find({ $or: orConditions });
    }

    const { walletAddress } = req.query;

    if (walletAddress) {
      const lowerWallet = walletAddress.toLowerCase();
      
      // Filter challenges where this wallet is a participant
      const myChallenges = challenges.filter(c => 
        c.participants && c.participants.some(p => p.walletAddress.toLowerCase() === lowerWallet)
      );

      const { parseEther, formatEther } = require('ethers');
      let totalWei = 0n;
      let activeChallenges = 0;
      let completedChallenges = 0;
      let failedChallenges = 0;

      myChallenges.forEach(c => {
        const p = c.participants.find(p => p.walletAddress.toLowerCase() === lowerWallet);
        if (!p) return;

        try {
          totalWei += parseEther((c.stakeAmount || 0).toString());
        } catch (e) {}

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
        
      const totalStaked = parseFloat(formatEther(totalWei));

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
    const { parseEther, formatEther } = require('ethers');
    const totalWei = challenges.reduce((sum, c) => {
      try {
        const stakeWei = parseEther((c.stakeAmount || 0).toString());
        const count = BigInt(c.participants?.length || 1);
        return sum + (stakeWei * count);
      } catch (e) {
        return sum;
      }
    }, 0n);
    const totalStaked = parseFloat(formatEther(totalWei));
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
