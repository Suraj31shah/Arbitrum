const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
const { MIN_STAKE, MAX_STAKE } = require('../models/Challenge');
const { readChallenges, saveChallengeLocally } = require('../utils/localChallengeStore');
const { resolveOnChain } = require('../services/resolveService');

// Max simultaneous active challenges per wallet
const MAX_ACTIVE_PER_WALLET = 3;

/**
 * Transition challenge statuses based on current time.
 * Called on read to keep statuses accurate without a cron job.
 * If a challenge becomes completed/failed, triggers on-chain resolution.
 */
const resolvingChallenges = new Set();

function transitionStatus(challenge) {
  const now = new Date();
  const status = challenge.status;

  // upcoming → active (start time reached)
  if (status === 'upcoming' && now >= new Date(challenge.startTime)) {
    challenge.status = 'active';
  }
  // active → failed (deadline passed, auto-fail anyone still 'active')
  if (challenge.status === 'active' && now >= new Date(challenge.deadline)) {
    let anyoneCompleted = false;
    challenge.participants.forEach(p => {
      if (p.status === 'completed') {
        anyoneCompleted = true;
      } else if (p.status === 'active' || p.status === 'proof_submitted' || p.status === 'verifying') {
        p.status = 'failed';
      }
    });
    challenge.status = anyoneCompleted ? 'completed' : 'failed';
    challenge.completedAt = now;
  }

  // Self-Healing Retry Logic: Trigger on-chain resolution if concluded but not resolved
  if ((challenge.status === 'completed' || challenge.status === 'failed') && !challenge.resolvedOnChain) {
    const cid = challenge._id.toString();
    if (!resolvingChallenges.has(cid)) {
      resolvingChallenges.add(cid);
      const winnersAddresses = challenge.participants
        .filter(p => p.status === 'completed')
        .map(p => p.walletAddress);
        
      resolveOnChain(cid, winnersAddresses)
        .then(txHash => {
          if (txHash) {
            challenge.resolvedOnChain = true;
            challenge.resolveTxHash = txHash;
            Challenge.findByIdAndUpdate(challenge._id, {
              resolvedOnChain: true,
              resolveTxHash: txHash
            }).catch(e => console.error('Failed to save resolve tx hash:', e.message));
          } else {
            resolvingChallenges.delete(cid);
          }
        })
        .catch(e => {
          console.error('On-chain resolution failed:', e.message);
          resolvingChallenges.delete(cid);
        });
    }
  }

  return challenge;
}

const getChallenges = async (req, res) => {
  try {
    const { filter, wallet } = req.query;

    let userId = null;
    let userWallet = null;

    if (req.isAuthenticated() && req.user && req.user.walletAddress) {
      userId = req.user._id || req.user.id;
      userWallet = req.user.walletAddress.toLowerCase();
    }

    if (mongoose.connection.readyState !== 1) {
      const localChallenges = readChallenges();
      if (!userId) {
         // Return all joinable public challenges if unauthenticated
         return res.json(localChallenges.filter(c => ['upcoming', 'active', 'joinable'].includes(c.status)));
      }
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
      return res.json(userChallenges);
    }

    let orConditions = [];
    if (userId) {
      orConditions.push({ creator: userId });
      orConditions.push({ 'participants.user': userId });
    }
    if (userWallet) {
      orConditions.push({ 'participants.walletAddress': userWallet });
      orConditions.push({ 'participants.walletAddress': new RegExp(`^${userWallet}$`, 'i') });
    }

    let query = {};
    if (orConditions.length > 0) {
      // If we are looking for 'mine', use the conditions
      if (filter === 'mine') {
         query = { $or: orConditions };
      }
      // If no filter, we can just fetch everything (public)
    } else if (filter === 'mine') {
      // Unauthenticated user requesting 'mine' gets nothing
      return res.json([]);
    }

    let challenges = await Challenge.find(query)
      .populate('creator', 'username profileUrl walletAddress')
      .populate('participants.user', 'username profileUrl walletAddress')
      .sort({ createdAt: -1 });
    
    const now = new Date();
    
    // Automatically fail expired active challenges
    challenges = await Promise.all(challenges.map(async (c) => {
      if (c.status === 'active' && new Date(c.deadline) < now) {
        c.status = 'failed';
        await c.save();
      }
      return c;
    }));

    // If filter=mine, only return user's challenges
    if (filter === 'mine' && userWallet) {
      challenges = challenges.filter(c => {
        const creatorId = c.creator?._id?.toString() || c.creator?.toString();
        const currentUserId = userId?.toString();
        if (creatorId && currentUserId && creatorId === currentUserId) return true;
        if (Array.isArray(c.participants)) {
          return c.participants.some(p => {
            if (p.walletAddress && p.walletAddress.toLowerCase() === userWallet) return true;
            const pUserId = p.user?._id?.toString() || p.user?.toString();
            if (pUserId && currentUserId && pUserId === currentUserId) return true;
            return false;
          });
        }
        return false;
      });
    }

    // If filter=joinable and a wallet is provided, exclude challenges the wallet already joined
    if (filter === 'joinable' && wallet) {
      const lowerWallet = wallet.toLowerCase();
      challenges = challenges.filter(c =>
        !c.participants.some(p => p.walletAddress && p.walletAddress.toLowerCase() === lowerWallet)
      );
    }

    res.json(challenges);
  } catch (error) {
    console.error('Failed to fetch challenges from MongoDB, serving local store:', error.message);
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
    res.json(userChallenges);
  }
};

const getChallengeById = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const localChallenges = readChallenges();
      const match = localChallenges.find(c => c._id === req.params.id || c.id === req.params.id);
      if (!match) return res.status(404).json({ error: 'Challenge not found.' });
      return res.json(match);
    }

    const challenge = await Challenge.findById(req.params.id)
      .populate('creator', 'username profileUrl walletAddress')
      .populate('participants.user', 'username profileUrl walletAddress');

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found.' });
    }

    // Auto-transition
    const oldStatus = challenge.status;
    transitionStatus(challenge);
    if (challenge.status !== oldStatus) await challenge.save();

    res.json(challenge);
  } catch (error) {
    console.error('Failed to fetch challenge by id:', error.message);
    const localChallenges = readChallenges();
    const match = localChallenges.find(c => c._id === req.params.id || c.id === req.params.id);
    if (match) return res.json(match);
    res.status(500).json({ error: 'Failed to fetch challenge.' });
  }
};

const createChallenge = async (req, res) => {
  if (!req.isAuthenticated() || !req.user || !req.user.walletAddress) {
    return res.status(401).json({ error: 'You must be logged in with a wallet to create a challenge.' });
  }

  const { title, description, goal, deadline, stakeAmount, startMode, startTime,
          integrationId, integrationHandle, integrationMetric, metricValue } = req.body;

  // Validation
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required.' });
  }
  if (!description || typeof description !== 'string' || description.trim() === '') {
    return res.status(400).json({ error: 'Description is required.' });
  }
  if (!goal || typeof goal !== 'string' || goal.trim() === '') {
    return res.status(400).json({ error: 'Goal is required.' });
  }
  if (!deadline) {
    return res.status(400).json({ error: 'Deadline is required.' });
  }
  if (new Date(deadline) <= new Date()) {
    return res.status(400).json({ error: 'Deadline must be in the future.' });
  }

  // Validate stake amount (free-form with min/max bounds)
  const parsedStake = parseFloat(stakeAmount);
  if (isNaN(parsedStake) || parsedStake < MIN_STAKE || parsedStake > MAX_STAKE) {
    return res.status(400).json({
      error: `Stake amount must be between ${MIN_STAKE} and ${MAX_STAKE} ETH.`
    });
  }

  // Validate start mode
  const mode = startMode === 'scheduled' ? 'scheduled' : 'immediate';

  // Calculate start time and initial status
  const now = new Date();
  let challengeStartTime, initialStatus;

  if (mode === 'immediate') {
    challengeStartTime = now;
    initialStatus = 'active';
  } else {
    // Scheduled: user provides startTime
    if (!startTime || new Date(startTime) <= now) {
      return res.status(400).json({ error: 'Scheduled start time must be in the future.' });
    }
    challengeStartTime = new Date(startTime);
    initialStatus = 'upcoming';

    if (new Date(deadline) <= challengeStartTime) {
      return res.status(400).json({ error: 'Deadline must be after the start time.' });
    }
  }

  // Removed max active challenges per wallet restriction per user request

  const challengeData = {
    title: title.trim(),
    description: description.trim(),
    goal: goal.trim(),
    stakeAmount: parsedStake,
    startMode: mode,
    startTime: challengeStartTime,
    deadline: new Date(deadline),
    status: initialStatus,
    creator: req.user._id,
    creatorWallet: req.user.walletAddress.toLowerCase(),
    participants: [{
      user: req.user._id,
      walletAddress: req.user.walletAddress,
      status: 'active'
    }],
    charityAddress: process.env.CHARITY_WALLET_ADDRESS || '0x000000000000000000000000000000000000dEaD',
    integrationId: integrationId || 'none',
    integrationHandle: integrationHandle || '',
    integrationMetric: integrationMetric || 'all',
    metricValue: metricValue || null
  };

  try {
    if (mongoose.connection.readyState !== 1) {
      console.warn('MongoDB disconnected. Saving challenge locally.');
      const local = saveChallengeLocally(challengeData);
      return res.status(201).json(local);
    }

    const newChallenge = await Challenge.create(challengeData);
    return res.status(201).json(newChallenge);
  } catch (error) {
    console.error('Failed to create challenge in DB:', error.message);
    res.status(500).json({ error: 'Failed to create challenge.' });
  }
};

const joinChallenge = async (req, res) => {
  if (!req.isAuthenticated() || !req.user || !req.user.walletAddress) {
    return res.status(401).json({ error: 'You must be logged in with a wallet to join.' });
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database disconnected.' });
    }

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found.' });

    // Auto-transition
    transitionStatus(challenge);

    // Check joining window (can join anytime before deadline)
    const now = new Date();
    if (now >= new Date(challenge.deadline)) {
      return res.status(400).json({ error: 'The deadline for this challenge has passed.' });
    }
    if (['completed', 'failed'].includes(challenge.status)) {
      return res.status(400).json({ error: 'This challenge has already concluded.' });
    }

    const alreadyJoined = challenge.participants.some(
      p => p.walletAddress.toLowerCase() === req.user.walletAddress.toLowerCase()
    );
    if (alreadyJoined) {
      return res.status(400).json({ error: 'You have already joined this challenge.' });
    }

    challenge.participants.push({
      user: req.user._id,
      walletAddress: req.user.walletAddress,
      status: 'active'
    });

    await challenge.save();
    res.json(challenge);
  } catch (error) {
    console.error('Failed to join challenge:', error.message);
    res.status(500).json({ error: 'Failed to join challenge.' });
  }
};

/**
 * Update a specific participant's status (used after proof verification)
 * SECURED: requires authentication
 */
const updateParticipantStatus = async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const { walletAddress, status } = req.body;
  const validStatuses = ['active', 'proof_submitted', 'verifying', 'completed', 'failed'];

  if (!walletAddress || !status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'walletAddress and valid status are required.' });
  }

  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found.' });

    const participant = challenge.participants.find(
      p => p.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found in this challenge.' });
    }

    participant.status = status;
    if (status === 'completed') {
      participant.completedAt = new Date();
    }

    // Check if challenge is fully resolved (all participants completed or failed)
    const allResolved = challenge.participants.every(
      p => p.status === 'completed' || p.status === 'failed'
    );
    if (allResolved) {
      const anyCompleted = challenge.participants.some(p => p.status === 'completed');
      challenge.status = anyCompleted ? 'completed' : 'failed';
      challenge.completedAt = new Date();

      // Trigger on-chain resolution
      if (!challenge.resolvedOnChain) {
        const winnersAddresses = challenge.participants
          .filter(p => p.status === 'completed')
          .map(p => p.walletAddress);
        resolveOnChain(challenge._id.toString(), winnersAddresses)
          .then(txHash => {
            if (txHash) {
              Challenge.findByIdAndUpdate(challenge._id, {
                resolvedOnChain: true,
                resolveTxHash: txHash
              }).catch(e => console.error('Failed to save resolve tx hash:', e.message));
            }
          })
          .catch(e => console.error('On-chain resolution failed:', e.message));
      }
    }

    await challenge.save();
    res.json(challenge);
  } catch (error) {
    console.error('Failed to update participant status:', error.message);
    res.status(500).json({ error: 'Failed to update participant status.' });
  }
};

/**
 * Legacy: update global challenge status (kept for compatibility)
 * SECURED: requires authentication
 */
const updateChallengeStatus = async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const { status } = req.body;
  const validStatuses = ['joining', 'upcoming', 'active', 'submission', 'completed', 'failed'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const update = { status };
    if (status === 'completed') {
      update.completedAt = new Date();
    }

    const challenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found.' });
    }

    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update challenge.' });
  }
};

module.exports = {
  getChallenges,
  getChallengeById,
  createChallenge,
  joinChallenge,
  updateParticipantStatus,
  updateChallengeStatus
};
