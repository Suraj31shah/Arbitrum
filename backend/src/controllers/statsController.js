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
        orConditions.push({ 'participants.walletAddress': new RegExp(`^${userWallet}$`, 'i') });
      }
      challenges = await Challenge.find({ $or: orConditions });
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
    const localChallenges = readChallenges();
    const userChallenges = localChallenges.filter(c => {
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

    const totalChallenges = userChallenges.length;
    const activeChallenges = userChallenges.filter(c => c.status === 'active').length;
    const completedChallenges = userChallenges.filter(c => c.status === 'completed').length;
    const failedChallenges = userChallenges.filter(c => c.status === 'failed').length;
    const totalStaked = userChallenges.reduce((sum, c) => sum + (c.stakeAmount || 0), 0);
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
