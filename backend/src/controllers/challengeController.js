const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
const { readChallenges, saveChallengeLocally } = require('../utils/localChallengeStore');

const getChallenges = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const localChallenges = readChallenges();
      return res.json(localChallenges);
    }

    let challenges = await Challenge.find()
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

    res.json(challenges);
  } catch (error) {
    console.error('Failed to fetch challenges from MongoDB, serving local store:', error.message);
    const localChallenges = readChallenges();
    res.json(localChallenges);
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

    // Automatically fail if expired and active
    if (challenge.status === 'active' && new Date(challenge.deadline) < new Date()) {
      challenge.status = 'expired';
      await challenge.save();
    }

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

  const { title, description, stakeAmount, deadline, status, integrationId, integrationHandle, metricValue } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required.' });
  }

  if (!description || typeof description !== 'string' || description.trim() === '') {
    return res.status(400).json({ error: 'Description is required.' });
  }

  if (typeof stakeAmount !== 'number' || !Number.isFinite(stakeAmount) || stakeAmount < 0) {
    return res.status(400).json({ error: 'stakeAmount must be a non-negative number.' });
  }

  if (!deadline) {
    return res.status(400).json({ error: 'Deadline is required.' });
  }

  const challengeData = {
    title: title.trim(),
    description: description.trim(),
    stakeAmount,
    prizePool: stakeAmount,
    deadline: new Date(deadline),
    status: status && typeof status === 'string' && status.trim() !== '' ? status.trim() : 'active',
    creator: req.user._id,
    participants: [{
      user: req.user._id,
      walletAddress: req.user.walletAddress,
      status: 'active'
    }],
    integrationId: integrationId || 'none',
    integrationHandle: integrationHandle || '',
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

    if (challenge.status !== 'active') {
      return res.status(400).json({ error: 'This challenge is no longer accepting participants.' });
    }

    const alreadyJoined = challenge.participants.some(p => p.user.toString() === req.user._id.toString());
    if (alreadyJoined) {
      return res.status(400).json({ error: 'You have already joined this challenge.' });
    }

    challenge.participants.push({
      user: req.user._id,
      walletAddress: req.user.walletAddress,
      status: 'active'
    });
    
    challenge.prizePool += challenge.stakeAmount;
    await challenge.save();

    res.json(challenge);
  } catch (error) {
    console.error('Failed to join challenge:', error.message);
    res.status(500).json({ error: 'Failed to join challenge.' });
  }
};

const updateChallengeStatus = async (req, res) => {
  // This function would normally verify proofs. For now we just update global status, 
  // but in multiplayer we should update the specific participant's status instead.
  // We will keep this simple for now.
  const { status } = req.body;
  const validStatuses = ['active', 'expired', 'completed', 'failed'];

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
  updateChallengeStatus
};
